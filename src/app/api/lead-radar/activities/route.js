import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
import {loadState,mutateState} from '../../../../lib/lead-radar/storage.js';
import {logActivity} from '../../../../lib/lead-radar/model.mjs';
export const dynamic='force-dynamic';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const outcomes=new Set(['no_answer','wrong_number','gatekeeper','decision_maker','not_interested','already_awarded','future','plans_requested','quote_requested','meeting','negotiation','won','lost']);
export async function GET(req){
 const a=await authorize(req,null,false);if(a.error)return denied(a);
 const id=new URL(req.url).searchParams.get('companyId');if(!uuid.test(id||''))return Response.json({error:'Invalid company ID'},{status:400});
 try{const {state}=await loadState();return Response.json({activities:state.activities.filter(x=>x.company_id===id).slice(0,100)},{headers:{'Cache-Control':'no-store'}});}
 catch(err){return Response.json({error:'Could not read activities',detail:String(err.message).slice(0,180)},{status:503});}
}
export async function POST(req){
 const a=await authorize(req,null,false);if(a.error)return denied(a);
 try{
  const b=await req.json();
  if(!b||!uuid.test(b.company_id)||!outcomes.has(b.outcome)||typeof b.note!=='string'||!b.note.trim()||b.note.length>4000)return Response.json({error:'Invalid call notes'},{status:400});
  if(b.project_id&&!uuid.test(b.project_id))return Response.json({error:'Invalid project ID'},{status:400});
  const next=b.next_followup_at?new Date(b.next_followup_at):null;
  if(next&&Number.isNaN(next.getTime()))return Response.json({error:'Invalid follow-up date'},{status:400});
  const safe={company_id:b.company_id,project_id:b.project_id||null,outcome:b.outcome,note:b.note,next_followup_at:next?.toISOString()||null};
  const result=await mutateState(s=>logActivity(s,safe,a.user.id)?{ok:true}:{noChange:true,result:{error:'Company not found'}});
  if(result.error)return Response.json(result,{status:404});return Response.json(result);
 }catch(err){return Response.json({error:'Could not save call',detail:String(err.message).slice(0,180)},{status:503});}
}
