import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
import {loadState,mutateState} from '../../../../lib/lead-radar/storage.js';
import {updateCompany,isCrmMember} from '../../../../lib/lead-radar/model.mjs';
import {evidenceFor,inferSignals} from '../../../../lib/lead-radar/scoring.mjs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'no-store'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
export async function GET(req){
 const auth=await authorize(req,null,false);if(auth.error)return denied(auth);
 try{
  const {state}=await loadState();
  const companies=state.companies.filter(c=>isCrmMember(state,c))
   .sort((a,b)=>(b.observed_project_count||0)-(a.observed_project_count||0)).slice(0,1000);
  return Response.json({companies},{headers:noStore});
 }catch(error){return Response.json({error:'Could not read CRM',detail:String(error.message).slice(0,180)},{status:503,headers:noStore});}
}
// Explicit, human initiated addition from one chosen permit. No scan may call POST.
export async function POST(req){
 const auth=await authorize(req,null,false);if(auth.error)return denied(auth);
 try{
  const body=await req.json();
  if(!body||!uuid.test(body.project_id||''))return Response.json({error:'Choose a valid project'},{status:400,headers:noStore});
  const result=await mutateState(state=>{
   const project=state.projects.find(p=>p.id===body.project_id);
   if(!project)return {noChange:true,result:{error:'Project not found',status:404}};
   const company=state.companies.find(c=>c.id===project.contractor_company_id);
   if(!company?.name)return {noChange:true,result:{error:'Contractor not identified. Research first.',status:422}};
   const signals=inferSignals([project.description,project.project_type].filter(Boolean).join(' '));
   const quality=evidenceFor({...project,cabinet_signal:signals.cabinet,door_signal:signals.door},company);
   if(quality.tier==='archive')return {noChange:true,result:{error:'This permit is not a qualified active cabinet/door lead',status:422}};
   if(isCrmMember(state,company))return {noChange:true,result:{ok:true,company,already:true}};
   company.crm_added_at=new Date().toISOString();
   company.crm_added_by=auth.user.id;
   company.crm_project_id=project.id;
   return {ok:true,company,already:false};
  });
  if(result.error)return Response.json({error:result.error},{status:result.status||400,headers:noStore});
  return Response.json(result,{headers:noStore});
 }catch(error){return Response.json({error:'Could not add to CRM',detail:String(error.message).slice(0,180)},{status:503,headers:noStore});}
}
export async function PATCH(req){
 const auth=await authorize(req,'admin',false);if(auth.error)return denied(auth);
 try{
  const body=await req.json();if(!body||!uuid.test(body.id||''))return Response.json({error:'Invalid company ID'},{status:400});
  const fields=['employee_count','employee_count_source','decision_maker','phone','email','website'];
  const safe={id:body.id};for(const key of fields)if(Object.hasOwn(body,key))safe[key]=body[key];
  if('employee_count' in safe&&safe.employee_count!==null&&(!Number.isInteger(safe.employee_count)||safe.employee_count<0||safe.employee_count>100000))return Response.json({error:'Invalid employee count'},{status:400});
  for(const key of fields.filter(k=>k!=='employee_count'))if(key in safe&&safe[key]!==null&&(typeof safe[key]!=='string'||safe[key].length>300))return Response.json({error:'Invalid '+key},{status:400});
  if(safe.employee_count!=null&&(!body.employee_count_source||!String(body.employee_count_source).trim()))return Response.json({error:'Employee count requires a source'},{status:400});
  const result=await mutateState(state=>{
   const company=state.companies.find(c=>c.id===safe.id);
   if(!isCrmMember(state,company))return {noChange:true,result:{error:'Add this company to CRM first',status:403}};
   return updateCompany(state,safe)?{ok:true}:{noChange:true,result:{error:'Company not found',status:404}};
  });
  if(result.error)return Response.json({error:result.error},{status:result.status||404});return Response.json(result,{headers:noStore});
 }catch(error){return Response.json({error:'Could not update company',detail:String(error.message).slice(0,180)},{status:503});}
}
