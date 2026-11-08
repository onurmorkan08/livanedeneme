import {SOURCES,fetchFocusedArcGIS} from './arcgis.mjs';
import {evidenceFor} from './scoring.mjs';
import {mergePermitBatch} from './model.mjs';
import {mutateState} from './storage.js';
import {randomUUID} from 'node:crypto';

/** One small, deliberate discovery pass per city. No synthetic sales leads. */
export async function runScan(){
 const pages=Math.min(6,Math.max(1,Number(process.env.SCAN_FOCUSED_PAGES||5)||5));
 const reports=[];
 for(const source of SOURCES){
  const started_at=new Date().toISOString();
  const report={id:randomUUID(),source:source.id,status:'success',fetched:0,screened:0,shortlisted:0,priority:0,research:0,created:0,updated:0,errors:0,error_detail:null,started_at,finished_at:null};
  let candidates=[];
  try{
   const found=await fetchFocusedArcGIS(source,{pages,pageSize:200,limit:45});
   report.fetched=found.examined;
   report.screened=found.examined;
   candidates=found.records;
   report.shortlisted=candidates.length;
   for(const p of candidates){const tier=evidenceFor(p,p.company).tier;if(tier==='priority')report.priority++;else if(tier==='research')report.research++;}
   if(found.fallbackUsed)report.note='Source filter unavailable; screened recent permit pages instead';
  }catch(err){report.status='failed';report.errors=1;report.error_detail=String(err?.message||err).slice(0,350);}
  // Writes run only after the source request finished, preserving manual CRM annotations.
  const saved=await mutateState(state=>{
   const result={...report};
   if(result.status!=='failed'){
    const counts=mergePermitBatch(state,source.id,candidates);
    result.created=counts.created;result.updated=counts.updated;result.errors+=counts.errors;
    if(counts.errors)result.status='partial';
   }
   result.finished_at=new Date().toISOString();
   state.scans.unshift(result);state.scans=state.scans.slice(0,80);
   return result;
  });
  reports.push(saved);
 }
 return reports;
}
