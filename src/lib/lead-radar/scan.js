import {getAdmin} from './supabase.js';
import {SOURCES,fetchArcGIS} from './arcgis.mjs';
import {computeScore,normalizeCompanyKey} from './scoring.mjs';

const permittedProjectColumns = ['source','source_record_id','source_url','permit_number','project_name','address','city','project_type','description','permit_status','permit_date','developer','designer','architect','unit_count','cabinet_signal','door_signal','raw_source'];
async function requireResult(promise,context) {
 const {data,error}=await promise;
 if (error) throw new Error(context+': '+error.message);
 return data;
}

async function matchCompany(db,p) {
  if (!p.company?.name) return null;
  const key=normalizeCompanyKey(p.company.name,p.company.license_number,p.city);
  if (!key) return null;
  const old=await requireResult(db.from('companies').select('*').eq('identity_key',key).maybeSingle(),'Find company');
  if (old) {
    const additions={};
    if (!old.phone && p.company.phone) additions.phone=p.company.phone;
    if (!old.license_number && p.company.license_number) additions.license_number=p.company.license_number;
    if (Object.keys(additions).length) await requireResult(db.from('companies').update({...additions,updated_at:new Date().toISOString()}).eq('id',old.id),'Update company');
    return old.id;
  }
  // Unique identity_key handles duplicate scans. On conflict, lookup the existing company.
  const {data, error}=await db.from('companies').upsert({identity_key:key,name:p.company.name,phone:p.company.phone,license_number:p.company.license_number},{onConflict:'identity_key',ignoreDuplicates:true}).select('id').maybeSingle();
  if (error) throw new Error('Upsert company: '+error.message);
  if (data?.id) return data.id;
  const existing=await requireResult(db.from('companies').select('id').eq('identity_key',key).single(),'Recheck company');
  return existing.id;
}

async function ingest(db,p,companyId) {
  const current=await requireResult(db.from('projects').select('*').eq('source',p.source).eq('source_record_id',p.source_record_id).maybeSingle(),'Find permit');
  const sourceData=Object.fromEntries(permittedProjectColumns.map(k=>[k,p[k]??null]));
  const values={...sourceData,contractor_company_id:companyId ?? current?.contractor_company_id ?? null,last_checked_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  // Keep all manual enrichment: start/end dates, installation date, procurement state and sales notes.
  // Do not overwrite manually entered designer, developer or unit count with empty source values.
  for(const col of ['designer','architect','developer','unit_count']) {
    if (values[col] == null && current?.[col] != null) values[col]=current[col];
  }
  // Explicit source-scope evidence is kept. Don't downgrade manually verified signal on source updates.
  for (const col of ['cabinet_signal','door_signal']) {
    if (current?.[col]==='explicit' && values[col] !== 'explicit') values[col]='explicit';
  }
  const company=companyId ? await requireResult(db.from('companies').select('*').eq('id',companyId).single(),'Get company for score') : {};
  const scored=computeScore({...current,...values},company);
  values.score=scored.score;
  values.score_reasons=scored.reasons;
  await requireResult(db.from('projects').upsert(values,{onConflict:'source,source_record_id'}),'Persist permit');
  return current ? 'updated' : 'created';
}

async function recalcPortfolio(db,ids) {
  for (const id of ids) {
    const {count,error}=await db.from('projects').select('id',{count:'exact',head:true}).eq('contractor_company_id',id);
    if(error) throw new Error('Count company projects: '+error.message);
    await requireResult(db.from('companies').update({observed_project_count:count,updated_at:new Date().toISOString()}).eq('id',id),'Update portfolio');
    const company=await requireResult(db.from('companies').select('*').eq('id',id).single(),'Get company');
    const ps=await requireResult(db.from('projects').select('*').eq('contractor_company_id',id).limit(500),'Get portfolio scores');
    for(const p of ps){
      const s=computeScore(p,company);
      await requireResult(db.from('projects').update({score:s.score,score_reasons:s.reasons}).eq('id',p.id),'Update score');
    }
  }
}

export async function runScan() {
 const db=getAdmin();
 const maxRecords=Math.min(250,Math.max(1,parseInt(process.env.SCAN_MAX_RECORDS||'50',10)||50));
 const reports=[];
 for(const source of SOURCES) {
   const started=await requireResult(db.from('scan_runs').insert({source:source.id,status:'running'}).select('id').single(),'Start scan');
   const result={source:source.id,status:'success',fetched:0,created:0,updated:0,errors:0,error_detail:null};
   const touched=new Set();
   try {
     const found=await fetchArcGIS(source,maxRecords);
     result.fetched=found.length;
     for(const p of found) {
       try {
         const companyId=await matchCompany(db,p);
         const action=await ingest(db,p,companyId);
         result[action]++;
         if (companyId) touched.add(companyId);
       } catch(err) {
         result.errors++;
         result.error_detail=String(err?.message||err).slice(0,400);
       }
     }
     // Portfolio updates are best-effort, but errors are visible.
     try {await recalcPortfolio(db,touched);} catch(err){result.errors++;result.error_detail=String(err?.message||err).slice(0,400);}
     if(result.errors) result.status='partial';
   } catch(err) {
     result.status='failed'; result.errors++;
     result.error_detail=String(err?.message||err).slice(0,400);
   }
   await requireResult(db.from('scan_runs').update({...result,finished_at:new Date().toISOString()}).eq('id',started.id),'Finish scan');
   reports.push(result);
 }
 return reports;
}
