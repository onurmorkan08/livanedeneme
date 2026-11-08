import { inferSignals } from './scoring.mjs';

// Published municipal GIS services, NOT simulated records.
export const SOURCES = [
  {
    id: 'fort_lauderdale', city: 'Fort Lauderdale',
    endpoint: 'https://gis.fortlauderdale.gov/server/rest/services/BuildingPermits/FeatureServer/0',
    orderField: 'LASTUPDATEDATE',
    fields: 'OBJECTID,PERMITID,CASEKEY,PERMITTYPE,PERMITSTAT,PERMITDESC,SUBMITDT,APPROVEDT,FULLADDR,OWNERNAME,APPLICANT,CONTRACTOR,CONTRACTPH,CONTRACTID,ESTCOST,USECLASS,LASTUPDATEDATE'
  },
  {
    id: 'miami', city: 'Miami',
    endpoint: 'https://gis.miami.gov/gis/rest/services/Maps/iBuildPermits/MapServer/0',
    orderField: 'ApplicationStatusDate',
    fields: 'OBJECTID,PermitNumber,ApplicationNumber,PermitStatus,FULLADDR,ApplicationType,MasterPermitStatus,PermitIssuedDate,MasterPermitType,ScopeOfWork,MasterPermitNumber,ProjectName,ApplicationStatusDate,PermitType'
  }
];
const value = v => typeof v === 'string' ? v.trim() || null : v == null ? null : String(v);
export function arcDate(v) {
  if (v == null || v === '') return null;
  const ms = Number(v);
  const date = Number.isFinite(ms) && ms > 0 ? new Date(ms) : new Date(v);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0,10);
}

export function arcgisRecordLink(source, permitNumber, oid) {
  const clause = permitNumber
   ? (source.id === 'miami' ? `PermitNumber = '${String(permitNumber).replace(/'/g, "''")}'` : `PERMITID = '${String(permitNumber).replace(/'/g, "''")}'`)
   : `OBJECTID = ${Number(oid)}`;
  const q = new URLSearchParams({where:clause, outFields:'*', returnGeometry:'false',f:'pjson'});
  return source.endpoint + '/query?' + q;
}

export function normalizeArcGISRecord(source, attrs) {
  const ftl=source.id==='fort_lauderdale';
  const permit_number=value(ftl? attrs.PERMITID || attrs.CASEKEY : attrs.PermitNumber || attrs.ApplicationNumber);
  const oid=attrs.OBJECTID;
  if (oid == null && !permit_number) return null;
  const description=value(ftl ? attrs.PERMITDESC : attrs.ScopeOfWork) || '';
  const type=value(ftl ? attrs.PERMITTYPE : (attrs.MasterPermitType || attrs.PermitType)) || '';
  const useClass=ftl ? value(attrs.USECLASS)||'' : value(attrs.ApplicationType)||'';
  const combined = [description,type,useClass, ftl?'':value(attrs.ProjectName)||''].join(' ');
  const signals = inferSignals(combined);
  const name=value(ftl? attrs.FULLADDR : attrs.ProjectName || attrs.FULLADDR);
  return {
    source: source.id,
    source_record_id: permit_number || `OBJECTID:${oid}`,
    source_url: arcgisRecordLink(source,permit_number,oid),
    permit_number,
    project_name: name,
    address: value(attrs.FULLADDR),
    city: source.city,
    project_type: [type,useClass].filter(Boolean).join(' / ') || null,
    description: description || null,
    permit_status: value(ftl ? attrs.PERMITSTAT : (attrs.PermitStatus || attrs.MasterPermitStatus)),
    permit_date: arcDate(ftl ? attrs.APPROVEDT : attrs.PermitIssuedDate),
    // Not inferable from a permit issue date. Only later validated/manual records may fill these.
    construction_start_date: null,
    construction_end_date: null,
    installation_date: null,
    installation_date_confidence: 'unknown',
    developer: ftl? value(attrs.OWNERNAME) : null,
    designer: null,
    architect: null,
    unit_count: null,
    cabinet_signal: signals.cabinet,
    door_signal: signals.door,
    raw_source: attrs,
    company: ftl && value(attrs.CONTRACTOR) ? {
      name: value(attrs.CONTRACTOR),
      phone: value(attrs.CONTRACTPH),
      license_number: value(attrs.CONTRACTID)
    } : null
  };
}

export async function fetchArcGIS(source, maxRecords=50) {
  const limit = Math.min(250,Math.max(1,Number(maxRecords) || 50));
  const params = new URLSearchParams({
    where:'1=1', outFields:source.fields, returnGeometry:'false', f:'json',
    orderByFields:`${source.orderField} DESC`, resultOffset:'0',
    resultRecordCount:String(limit)
  });
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),20000);
  try {
    const res=await fetch(source.endpoint+'/query?'+params,{cache:'no-store',signal:ctrl.signal,headers:{Accept:'application/json'}});
    if (!res.ok) throw new Error(`ArcGIS HTTP ${res.status}`);
    const json=await res.json();
    if (json.error) throw new Error(`ArcGIS ${json.error.code || ''}: ${json.error.message || 'unknown'}`);
    if (!Array.isArray(json.features)) throw new Error('Unexpected ArcGIS response: features array missing');
    return json.features.map(f => normalizeArcGISRecord(source,f.attributes ?? {})).filter(Boolean);
  } finally {clearTimeout(timer);}
}

/** Small evidence-first search, not a broad list of the latest arbitrary permits.
 * The SQL WHERE predicate only narrows candidates; all records are validated locally.
 * If a source refuses UPPER/LIKE we fall back to its recent pages instead of faking data.
 */
import {evidenceFor,computeScore} from './scoring.mjs';
export function focusedWhere(source){
 const field=source.id==='fort_lauderdale'?'PERMITDESC':'ScopeOfWork';
 const words=['CABINET','KITCHEN','MILLWORK','CASEWORK','VANITY','INTERIOR DOOR','POCKET DOOR','DOOR REPLAC','DOOR INSTALL','WARDROBE'];
 return '('+words.map(w=>`UPPER(${field}) LIKE '%${w}%'`).join(' OR ')+')';
}
async function fetchPage(source,where,offset,pageSize,fetchImpl=fetch){
 const params=new URLSearchParams({where,outFields:source.fields,returnGeometry:'false',f:'json',orderByFields:`${source.orderField} DESC`,resultOffset:String(offset),resultRecordCount:String(pageSize)});
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetchImpl(source.endpoint+'/query?'+params,{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Municipal API HTTP '+response.status);
  const result=await response.json();
  if(result.error)throw Error('Municipal API '+(result.error.message||result.error.code));
  if(!Array.isArray(result.features))throw Error('Municipal response missing features');
  return result.features;
 }finally{clearTimeout(timer);}
}
export async function fetchFocusedArcGIS(source,{pages=5,pageSize=200,limit=45,fetchImpl=fetch,now=new Date()}={}){
 const maxPages=Math.min(8,Math.max(1,pages));
 const size=Math.min(250,Math.max(10,pageSize));
 const maxLeads=Math.min(100,Math.max(1,limit));
 const unique=new Set(),records=[];
 let examined=0,predicate=focusedWhere(source),fallback=false,page=0;
 while(page<maxPages){
  let features;
  try{features=await fetchPage(source,predicate,page*size,size,fetchImpl);}
  catch(err){
   if(page===0&&!fallback){predicate='1=1';fallback=true;continue;}
   throw err;
  }
  if(features.length===0){if(page===0&&!fallback){predicate='1=1';fallback=true;continue;}break;}
  examined+=features.length;
  for(const item of features){
   const p=normalizeArcGISRecord(source,item.attributes||{});
   if(!p)continue;
   const k=p.source+'|'+p.source_record_id;if(unique.has(k))continue;unique.add(k);
   // Retain direct work and kitchen-remodel research candidates. Not generic home permits.
   if(!evidenceFor(p,p.company,now).relevant)continue;
   // Exclude finalized/closed/expired from intake; old CRM records are not deleted.
   if(evidenceFor(p,p.company,now).inactiveProject)continue;
   records.push(p);
  }
  page++;
  if(features.length<size)break;
 }
 const sorted=records.sort((a,b)=>{
  const ea=evidenceFor(a,a.company,now),eb=evidenceFor(b,b.company,now);
  const ta=ea.tier==='priority'?2:ea.tier==='research'?1:0,tb=eb.tier==='priority'?2:eb.tier==='research'?1:0;
  return tb-ta || computeScore(b,b.company,now).score-computeScore(a,a.company,now).score;
 }).slice(0,maxLeads);
 return {records:sorted,examined,shortlisted:sorted.length,fallbackUsed:fallback};
}
