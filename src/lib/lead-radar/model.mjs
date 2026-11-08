import {randomUUID} from 'node:crypto';
import {computeScore,normalizeCompanyKey} from './scoring.mjs';

export const emptyState=()=>({version:1,projects:[],companies:[],activities:[],scans:[]});
export function parseState(value){
 const src=value&&typeof value==='object'?value:{};
 return {version:1,projects:Array.isArray(src.projects)?src.projects:[],companies:Array.isArray(src.companies)?src.companies:[],activities:Array.isArray(src.activities)?src.activities:[],scans:Array.isArray(src.scans)?src.scans:[]};
}
export const projectCompany=(state,p)=>state.companies.find(c=>c.id===p.contractor_company_id)||null;
/* LIVANE_MANUAL_CRM_V1: discovery records are not CRM accounts. */
export function isCrmMember(state,company){
 if(!company)return false;
 if(company.crm_added_at)return true;
 // Preserve old records that a person actually worked on before this upgrade.
 return Boolean(state.activities?.some(a=>a.company_id===company.id)||
   (company.contact_status && company.contact_status!=='not_contacted')||
   company.last_contacted_at||company.next_followup_at||company.decision_maker||
   company.email||company.website||company.employee_count!=null);
}

const pick=(o,fields)=>Object.fromEntries(fields.map(k=>[k,o[k]??null]));
const sourceColumns=['source','source_record_id','source_url','permit_number','project_name','address','city','project_type','description','permit_status','permit_date','developer','designer','architect','unit_count','cabinet_signal','door_signal','raw_source'];

export function mergePermitBatch(state,source,permits,date=new Date().toISOString()){
 let created=0,updated=0,errors=0;
 const projectMap=new Map(state.projects.map(p=>[p.source+'|'+p.source_record_id,p]));
 const companyMap=new Map(state.companies.map(c=>[c.identity_key,c]));
 for(const record of permits){
  try{
   if(!record?.source||!record.source_record_id||!record.city||record.source!==source)throw new Error('Bad permit record');
   const key=record.source+'|'+record.source_record_id;
   let company=null;
   if(record.company?.name){
    const identity=normalizeCompanyKey(record.company.name,record.company.license_number,record.city);
    if(identity){
     company=companyMap.get(identity);
     if(!company){
      company={id:randomUUID(),identity_key:identity,name:record.company.name,phone:record.company.phone||null,license_number:record.company.license_number||null,email:null,website:null,employee_count:null,employee_count_source:null,decision_maker:null,observed_project_count:0,contact_status:'not_contacted',last_contacted_at:null,next_followup_at:null,created_at:date,updated_at:date};
      state.companies.push(company);companyMap.set(identity,company);
     }else{
      if(!company.phone && record.company.phone)company.phone=record.company.phone;
      if(!company.license_number && record.company.license_number)company.license_number=record.company.license_number;
     }
    }
   }
   const old=projectMap.get(key);
   const fields=pick(record,sourceColumns);
   for(const manualOverlap of ['developer','designer','architect','unit_count'])if(fields[manualOverlap] == null && old?.[manualOverlap]!=null)fields[manualOverlap]=old[manualOverlap];
   for(const signal of ['cabinet_signal','door_signal'])if(old?.[signal]==='explicit'&&fields[signal]!=='explicit')fields[signal]='explicit';
   const next={
    ...(old||{}),...fields,
    id:old?.id||randomUUID(),
    contractor_company_id:company?.id||old?.contractor_company_id||null,
    construction_start_date:old?.construction_start_date||null,
    construction_end_date:old?.construction_end_date||null,
    installation_date:old?.installation_date||null,
    installation_date_confidence:old?.installation_date_confidence||'unknown',
    procurement_status:old?.procurement_status||'unknown',sales_note:old?.sales_note||null,
    last_checked_at:date,updated_at:date,created_at:old?.created_at||date
   };
   if(old){Object.assign(old,next);updated++;}
   else {state.projects.push(next);projectMap.set(key,next);created++;}
  }catch{errors++;}
 }
 const counts=new Map();for(const p of state.projects)if(p.contractor_company_id)counts.set(p.contractor_company_id,(counts.get(p.contractor_company_id)||0)+1);
 for(const c of state.companies)c.observed_project_count=counts.get(c.id)||0;
 const cById=new Map(state.companies.map(c=>[c.id,c]));
 for(const p of state.projects){const s=computeScore(p,cById.get(p.contractor_company_id)||{});p.score=s.score;p.score_reasons=s.reasons;}
 return {created,updated,errors};
}
export const byId=(arr,id)=>arr.find(x=>x.id===id);
export function updateProject(state,body){
 const p=byId(state.projects,body.id);if(!p)return false;
 const changes={};const allowed=['construction_start_date','construction_end_date','installation_date','installation_date_confidence','designer','architect','developer','unit_count','procurement_status','sales_note'];
 for(const k of allowed)if(Object.hasOwn(body,k))changes[k]=body[k];
 const next={...p,...changes};
 if(next.installation_date&&next.installation_date_confidence==='unknown')throw Error('Select verified or estimated for installation date');
 const s=computeScore(next,projectCompany(state,next)||{});
 Object.assign(p,changes,{score:s.score,score_reasons:s.reasons,updated_at:new Date().toISOString()});
 return true;
}
export function updateCompany(state,body){
 const c=byId(state.companies,body.id);if(!c)return false;
 const allowed=['employee_count','employee_count_source','decision_maker','phone','email','website'];
 for(const k of allowed)if(Object.hasOwn(body,k))c[k]=body[k];
 c.updated_at=new Date().toISOString();
 for(const p of state.projects.filter(p=>p.contractor_company_id===c.id)){
  const s=computeScore(p,c);p.score=s.score;p.score_reasons=s.reasons;
 }
 return true;
}
export function logActivity(state,body,username){
 const c=byId(state.companies,body.company_id);if(!c)return false;
 if(body.project_id&&!state.projects.some(p=>p.id===body.project_id&&p.contractor_company_id===c.id))throw Error('Project does not belong to company');
 const now=new Date().toISOString();
 state.activities.unshift({id:randomUUID(),company_id:c.id,project_id:body.project_id||null,user_id:username,outcome:body.outcome,note:body.note,next_followup_at:body.next_followup_at||null,created_at:now});
 c.contact_status=body.outcome;c.last_contacted_at=now;c.next_followup_at=body.next_followup_at||null;c.updated_at=now;
 if(body.project_id&&['quote_requested','already_awarded'].includes(body.outcome)){
  const p=byId(state.projects,body.project_id);
  p.procurement_status=body.outcome==='quote_requested'?'quote_requested':'awarded';
  const s=computeScore(p,c);p.score=s.score;p.score_reasons=s.reasons;p.updated_at=now;
 }
 return true;
}
