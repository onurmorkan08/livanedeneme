import {SOURCES,fetchArcGIS} from './arcgis.mjs';
import {mergePermitBatch} from './model.mjs';
import {mutateState} from './storage.js';
import {randomUUID} from 'node:crypto';
export async function runScan(){
 const maxRecords=Math.min(250,Math.max(1,Number(process.env.SCAN_MAX_RECORDS||250)||250));
 const reports=[];
 for(const source of SOURCES){
  const start=new Date().toISOString();
  const report={id:randomUUID(),source:source.id,status:'success',fetched:0,created:0,updated:0,errors:0,error_detail:null,started_at:start,finished_at:null};
  let records=[];
  try{records=await fetchArcGIS(source,maxRecords);report.fetched=records.length;}
  catch(err){report.status='failed';report.errors=1;report.error_detail=String(err?.message||err).slice(0,400);}
  // Merge inside the retry loop, so a concurrent CRM update isn't lost.
  const saved=await mutateState(state=>{
    const result={...report};
    if(result.status!=='failed'){
     const counts=mergePermitBatch(state,source.id,records);
     result.created=counts.created;result.updated=counts.updated;result.errors+=counts.errors;
     if(result.errors)result.status='partial';
    }
    result.finished_at=new Date().toISOString();
    state.scans.unshift(result);state.scans=state.scans.slice(0,80);
    return result;
  });
  reports.push(saved);
 }
 return reports;
}
