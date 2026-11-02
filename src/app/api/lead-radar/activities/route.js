import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
import {computeScore} from '../../../../lib/lead-radar/scoring.mjs';
export const dynamic='force-dynamic';
const outcomes=new Set(['no_answer','wrong_number','gatekeeper','decision_maker','not_interested','already_awarded','future','plans_requested','quote_requested','meeting','negotiation','won','lost']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(req) {
  try {
   const a=await authorize(req);if(a.error)return denied(a);
   const id=new URL(req.url).searchParams.get('companyId');
   if(!id||!uuid.test(id))return Response.json({error:'Invalid company ID'},{status:400});
   const {data,error}=await a.db.from('activities').select('id,outcome,note,next_followup_at,created_at,project_id').eq('company_id',id).order('created_at',{ascending:false}).limit(100);
   if(error)throw error;
   return Response.json({activities:data||[]});
  }catch(e){return Response.json({error:'Could not load activity',detail:String(e.message).slice(0,200)},{status:500});}
}
export async function POST(req) {
 try {
  const a=await authorize(req);if(a.error)return denied(a);
  const body=await req.json();
  if(!uuid.test(body.company_id)||!outcomes.has(body.outcome)||typeof body.note !== 'string'||body.note.length>4000) return Response.json({error:'Invalid input'},{status:400});
  if(body.project_id && !uuid.test(body.project_id)) return Response.json({error:'Invalid project ID'},{status:400});
  const next = body.next_followup_at ? new Date(body.next_followup_at) : null;
  if(next && Number.isNaN(next.getTime())) return Response.json({error:'Invalid follow-up date'},{status:400});
  const {data:company,error:cError}=await a.db.from('companies').select('*').eq('id',body.company_id).maybeSingle();
  if(cError||!company)return Response.json({error:'Company not found'},{status:404});
  if(body.project_id){const {data:project}=await a.db.from('projects').select('id').eq('id',body.project_id).eq('contractor_company_id',body.company_id).maybeSingle(); if(!project)return Response.json({error:'Project does not belong to company'},{status:400});}
  const {error}=await a.db.from('activities').insert({company_id:body.company_id,project_id:body.project_id||null,user_id:a.user.id,outcome:body.outcome,note:body.note,next_followup_at:next?.toISOString()||null});
  if(error)throw error;
  const {error:companyError}=await a.db.from('companies').update({contact_status:body.outcome,last_contacted_at:new Date().toISOString(),next_followup_at:next?.toISOString()||null,updated_at:new Date().toISOString()}).eq('id',company.id);
  if(companyError)throw companyError;
  // Reevaluate a project after an outcome providing procurement evidence.
  if(body.project_id && ['quote_requested','already_awarded'].includes(body.outcome)) {
    const {data:project}=await a.db.from('projects').select('*').eq('id',body.project_id).single();
    if(project) {
      const procurement_status=body.outcome==='quote_requested'?'quote_requested':'awarded';
      const s=computeScore({...project,procurement_status},company);
      const {error:projectError}=await a.db.from('projects').update({procurement_status,score:s.score,score_reasons:s.reasons,updated_at:new Date().toISOString()}).eq('id',project.id);
      if(projectError)throw projectError;
    }
  }
  return Response.json({ok:true});
 }catch(e){return Response.json({error:'Could not save activity',detail:String(e.message).slice(0,200)},{status:500});}
}
