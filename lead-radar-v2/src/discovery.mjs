import {detectScope,preliminaryQuality} from './classify.mjs';
import {saveLead} from './db.mjs';

export const SOURCES = Object.freeze([
  { id:'fort-lauderdale',city:'Fort Lauderdale',name:'Fort Lauderdale Building Permit Tracker',
    endpoint:'https://gis.fortlauderdale.gov/arcgis/rest/services/BuildingPermitTracker/BuildingPermitTracker/MapServer/0',
    descriptionField:'PERMITDESC',idField:'PERMITID',addressField:'FULLADDR',statusField:'PERMITSTAT',
    dateField:'SUBMITDT',projectField:null,contractorField:'CONTRACTOR',contactField:'CONTRACTPH',
    fields:'OBJECTID,PERMITID,PERMITDESC,FULLADDR,PERMITSTAT,SUBMITDT,APPROVEDT,CONTRACTOR,CONTRACTPH,USECLASS'},
  { id:'miami',city:'Miami',name:'City of Miami iBuild Building Permits',
    endpoint:'https://gis.miami.gov/gis/rest/services/Maps/iBuildPermits/MapServer/0',
    descriptionField:'ScopeOfWork',idField:'PermitNumber',addressField:'FULLADDR',statusField:'PermitStatus',
    dateField:'PermitIssuedDate',projectField:'ProjectName',contractorField:null,contactField:null,
    fields:'OBJECTID,PermitNumber,ScopeOfWork,FULLADDR,PermitStatus,PermitIssuedDate,ProjectName,MasterPermitType,PermitType'}
]);
const MATCH_TERMS=['CABINET','CABINETRY','CASEWORK','INTERIOR DOOR','BEDROOM DOOR','CLOSET DOOR','INTERNAL DOOR','KITCHEN MILLWORK'];
export function queryUrl(source,{maxPages=3,pageSize=100,page=0}={}){
  const q=new URL(source.endpoint+'/query');
  const f=source.descriptionField;
  // SQL LIKE string syntax supported by ArcGIS layer; final verification still required against live API.
  const pred=MATCH_TERMS.map(x=>`UPPER(${f}) LIKE '%${x}%'`).join(' OR ');
  q.searchParams.set('where','('+pred+')');
  q.searchParams.set('outFields',source.fields);
  q.searchParams.set('returnGeometry','false');
  q.searchParams.set('orderByFields','OBJECTID DESC');
  q.searchParams.set('resultRecordCount',String(pageSize));
  q.searchParams.set('resultOffset',String(page*pageSize));
  q.searchParams.set('f','json');
  return q.toString();
}
export function normalizeFeature(source,attributes){
  const desc=String(attributes[source.descriptionField]||'').trim();
  const match=detectScope(desc);
  const permitNumber=String(attributes[source.idField]||'').trim();
  const address=String(attributes[source.addressField]||'').trim();
  if(!match||!permitNumber||!address) return null;
  const d=attributes[source.dateField];
  const date=typeof d==='number'?new Date(d).toISOString().slice(0,10):d?String(d).slice(0,10):null;
  const status=String(attributes[source.statusField]||'').trim()||null;
  const gc=source.contractorField?String(attributes[source.contractorField]||'').trim()||null:null;
  const contact=source.contactField?String(attributes[source.contactField]||'').trim()||null:null;
  const project=(source.projectField?String(attributes[source.projectField]||'').trim():'')||`Permit ${permitNumber}`;
  const q=preliminaryQuality({scope:match.scope,contractor:gc,contact,status,date});
  return {id:`${source.id}:${permitNumber}`,source:source.name,
    sourceUrl:`${source.endpoint}/query?where=${encodeURIComponent(`${source.idField}='${permitNumber.replaceAll("'","''")}'`)}&outFields=*&returnGeometry=false&f=pjson`,
    permitNumber, project,address,location:source.city,scope:match.scope,gc,contact,
    permitStatus:status,permitDate:date,description:desc,quality:q.score,
    reasons:[...match.evidence,...q.reasons]};
}

async function getJSON(url, fetchImpl){
  const res=await fetchImpl(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
  if(!res.ok)throw new Error(`HTTP ${res.status}`);
  const content=await res.json();
  if(content.error)throw new Error(`ArcGIS error: ${content.error.message||JSON.stringify(content.error)}`);
  if(!Array.isArray(content.features)) throw new Error('ArcGIS response has no feature list');
  return content;
}
export async function scanSources(db,{fetchImpl=fetch,sources=SOURCES,pageSize=100,maxPages=4}={}) {
  const run=db.prepare('INSERT INTO scan_runs(started_at,status) VALUES (?,?)').run(new Date().toISOString(),'running');
  const errors=[];let total=0;const perSource=[];
  for(const source of sources){
    let count=0;
    try{
      for(let page=0;page<maxPages;page++){
        const data=await getJSON(queryUrl(source,{pageSize,page}),fetchImpl);
        for(const raw of data.features){
          const lead=normalizeFeature(source,raw.attributes||{});
          if(lead){saveLead(db,lead);count++;total++;}
        }
        if(data.features.length<pageSize)break;
      }
    }catch(e){errors.push(`${source.city}: ${e.message}`);}
    perSource.push({city:source.city,matched:count});
  }
  const status=errors.length===sources.length?'failed':errors.length?'partial':'completed';
  db.prepare('UPDATE scan_runs SET ended_at=?, status=?, imported=?, errors=? WHERE id=?').run(new Date().toISOString(),status,total,JSON.stringify(errors),Number(run.lastInsertRowid));
  return {status,matched:total,perSource,errors};
}
