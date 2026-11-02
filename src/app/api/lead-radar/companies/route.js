import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
import {computeScore} from '../../../../lib/lead-radar/scoring.mjs';
export const dynamic='force-dynamic';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(req) {
 try {
   const a=await authorize(req);if(a.error)return denied(a);
   const {data,error}=await a.db.from('companies').select('*').order('observed_project_count',{ascending:false}).limit(1000);
   if(error)throw error;
   return Response.json({companies:data||[]});
 } catch(e) {return Response.json({error:'Could not read companies',detail:String(e.message).slice(0,200)},{status:500});}
}
export async function PATCH(req) {
 try {
   const a=await authorize(req,'admin');if(a.error)return denied(a);
   const b=await req.json();
   if(!uuid.test(b.id))return Response.json({error:'Invalid company ID'},{status:400});
   const fields=['employee_count','employee_count_source','decision_maker','phone','email','website'];
   const values={};for(const k of fields)if(Object.hasOwn(b,k))values[k]=b[k];
   if('employee_count' in values && values.employee_count!==null && (!Number.isInteger(values.employee_count)||values.employee_count<0||values.employee_count>100000))return Response.json({error:'Invalid employee count'},{status:400});
   for(const k of fields.filter(x=>x!=='employee_count'))if(k in values && values[k]!==null && (typeof values[k]!=='string'||values[k].length>300))return Response.json({error:'Invalid '+k},{status:400});
   if(values.employee_count!=null && (!b.employee_count_source||!String(b.employee_count_source).trim()))return Response.json({error:'Employee count requires a source'},{status:400});
   const {data:company,error:err}=await a.db.from('companies').update({...values,updated_at:new Date().toISOString()}).eq('id',b.id).select('*').single();
   if(err)throw err;
   const {data:projects,error:projectError}=await a.db.from('projects').select('*').eq('contractor_company_id',company.id).limit(500);
   if(projectError)throw projectError;
   for(const p of projects||[]){const s=computeScore(p,company);const {error}=await a.db.from('projects').update({score:s.score,score_reasons:s.reasons}).eq('id',p.id);if(error)throw error;}
   return Response.json({ok:true});
 }catch(e){return Response.json({error:'Could not update company',detail:String(e.message).slice(0,200)},{status:500});}
}
