import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
import {loadState,mutateState} from '../../../../lib/lead-radar/storage.js';
import {updateCompany} from '../../../../lib/lead-radar/model.mjs';
export const dynamic='force-dynamic';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(req){
 const a=await authorize(req,null,false);if(a.error)return denied(a);
 try{const {state}=await loadState();const companies=state.companies.sort((x,y)=>(y.observed_project_count||0)-(x.observed_project_count||0)).slice(0,1000);
  return Response.json({companies},{headers:{'Cache-Control':'no-store'}});
 }catch(err){return Response.json({error:'Could not read companies',detail:String(err.message).slice(0,180)},{status:503});}
}
export async function PATCH(req){
 const a=await authorize(req,'admin',false);if(a.error)return denied(a);
 try{
  const b=await req.json();if(!b||!uuid.test(b.id))return Response.json({error:'Invalid company ID'},{status:400});
  const fields=['employee_count','employee_count_source','decision_maker','phone','email','website'];
  const safe={id:b.id};for(const k of fields)if(Object.hasOwn(b,k))safe[k]=b[k];
  if('employee_count' in safe&&safe.employee_count!==null&&(!Number.isInteger(safe.employee_count)||safe.employee_count<0||safe.employee_count>100000))return Response.json({error:'Invalid employee count'},{status:400});
  for(const k of fields.filter(f=>f!=='employee_count'))if(k in safe&&safe[k]!==null&&(typeof safe[k]!=='string'||safe[k].length>300))return Response.json({error:'Invalid '+k},{status:400});
  if(safe.employee_count!=null && (!b.employee_count_source||!String(b.employee_count_source).trim()))return Response.json({error:'Employee count requires a source'},{status:400});
  const result=await mutateState(s=>updateCompany(s,safe)?{ok:true}:{noChange:true,result:{error:'Company not found'}});
  if(result.error)return Response.json(result,{status:404});return Response.json(result);
 }catch(err){return Response.json({error:'Could not update company',detail:String(err.message).slice(0,180)},{status:503});}
}
