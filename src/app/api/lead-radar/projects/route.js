import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
import {computeScore} from '../../../../lib/lead-radar/scoring.mjs';
export const dynamic='force-dynamic';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed=['construction_start_date','construction_end_date','installation_date','installation_date_confidence','designer','architect','developer','unit_count','procurement_status','sales_note'];
function validDate(d){return d===null || (typeof d==='string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(d+'T00:00:00Z').getTime()));}
export async function GET(req) {
 try {
   const a=await authorize(req); if(a.error) return denied(a);
   const url=new URL(req.url);
   let query=a.db.from('projects').select('*,company:companies!projects_contractor_company_id_fkey(id,name,phone,employee_count,employee_count_source,observed_project_count,decision_maker,contact_status,next_followup_at)').order('score',{ascending:false}).order('last_checked_at',{ascending:false}).limit(500);
   const city=url.searchParams.get('city');if(city && ['Miami','Fort Lauderdale'].includes(city)) query=query.eq('city',city);
   const {data,error}=await query;
   if(error) throw error;
   return Response.json({projects:data||[]});
 } catch(e){return Response.json({error:'Could not read projects',detail:String(e.message).slice(0,200)},{status:500});}
}
export async function PATCH(req){
 try{
  const a=await authorize(req);if(a.error)return denied(a);
  const body=await req.json();
  if(!uuid.test(body.id))return Response.json({error:'Invalid project ID'},{status:400});
  const changes={};
  for (const key of allowed)if(Object.prototype.hasOwnProperty.call(body,key))changes[key]=body[key];
  for (const key of ['construction_start_date','construction_end_date','installation_date']) if(key in changes && !validDate(changes[key])) return Response.json({error:'Invalid '+key},{status:400});
  if('installation_date_confidence' in changes && !['unknown','estimated','verified'].includes(changes.installation_date_confidence))return Response.json({error:'Invalid date confidence'},{status:400});
  if('procurement_status' in changes && !['unknown','open','quote_requested','awarded','closed'].includes(changes.procurement_status))return Response.json({error:'Invalid procurement state'},{status:400});
  if('unit_count' in changes && changes.unit_count!==null && (!Number.isInteger(changes.unit_count)||changes.unit_count<1||changes.unit_count>2000))return Response.json({error:'Invalid units'},{status:400});
  for(const key of ['designer','architect','developer','sales_note'])if(key in changes && changes[key]!==null && (typeof changes[key]!=='string'||changes[key].length>1500))return Response.json({error:'Invalid '+key},{status:400});
  const {data:p,error:e}=await a.db.from('projects').select('*').eq('id',body.id).single();if(e||!p)return Response.json({error:'Project not found'},{status:404});
  const {data:c}=p.contractor_company_id?await a.db.from('companies').select('*').eq('id',p.contractor_company_id).single():{data:{}};
  const updated={...p,...changes};
  // Verified dates must be user-entered; a date is not accepted without a confidence label.
  if(updated.installation_date && updated.installation_date_confidence==='unknown')return Response.json({error:'Select verified or estimated for installation date'},{status:400});
  const s=computeScore(updated,c||{});
  const {error:writeError}=await a.db.from('projects').update({...changes,score:s.score,score_reasons:s.reasons,updated_at:new Date().toISOString()}).eq('id',p.id);
  if(writeError)throw writeError;
  return Response.json({ok:true});
 }catch(e){return Response.json({error:'Could not update project',detail:String(e.message).slice(0,200)},{status:500});}
}
