import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {openStores,getLeads} from '../src/db.mjs';
import {normalizeFeature,scanSources,SOURCES,queryUrl} from '../src/discovery.mjs';
const ft=SOURCES[0];
test('normalizes official Fort Lauderdale fields without inventing data',()=>{
 const lead=normalizeFeature(ft,{PERMITID:'A-234',PERMITDESC:'Interior doors and kitchen cabinets',FULLADDR:'12 SAMPLE AVE',PERMITSTAT:'Active',SUBMITDT:1780000000000,CONTRACTOR:'Test GC',CONTRACTPH:''});
 assert.equal(lead.scope,'Both');assert.equal(lead.contact,null);assert.equal(lead.gc,'Test GC');assert(lead.sourceUrl.includes('A-234'));
});
test('ArcGIS query requests relevant descriptions and official fields',()=>{
 const u=new URL(queryUrl(ft));assert(u.searchParams.get('where').includes('CABINET'));assert(u.searchParams.get('outFields').includes('CONTRACTOR'));assert.equal(u.searchParams.get('f'),'json');
});
test('separate physical stores, duplicate upsert and no CRM automatic writes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-v2-'));
 const {lead,crm}=openStores(dir);
 const source={...ft,endpoint:'https://example.com/permits'};
 let called=0;
 const fake=async()=>{called++;return{ok:true,json:async()=>({features:[{attributes:{PERMITID:'BB2',PERMITDESC:'Kitchen cabinets',FULLADDR:'100 SAMPLE RD',PERMITSTAT:'Pending',CONTRACTOR:'Sample GC',CONTRACTPH:'555-0000'}}]})}};
 const r=await scanSources(lead,{fetchImpl:fake,sources:[source],maxPages:1,pageSize:100});
 assert.equal(r.status,'completed');assert.equal(getLeads(lead).length,1);
 await scanSources(lead,{fetchImpl:fake,sources:[source],maxPages:1,pageSize:100});assert.equal(getLeads(lead).length,1);
 assert.equal(crm.prepare("SELECT count(*) n FROM infrastructure_meta").get().n,0);
 lead.close();crm.close();fs.rmSync(dir,{recursive:true,force:true});
});
