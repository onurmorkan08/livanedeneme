import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
import {loadState,mutateState} from '../../../../lib/lead-radar/storage.js';
import {projectCompany,updateProject} from '../../../../lib/lead-radar/model.mjs';
import {evidenceFor,inferSignals,computeScore} from '../../../../lib/lead-radar/scoring.mjs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'no-store'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed=['construction_start_date','construction_end_date','installation_date','installation_date_confidence','designer','architect','developer','unit_count','procurement_status','sales_note'];
const validDate=d=>d===null||(typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(new Date(d+'T00:00:00Z').getTime()));
export async function GET(req){
 const a=await authorize(req,null,false);if(a.error)return denied(a);
 try{
  const {state}=await loadState();const city=new URL(req.url).searchParams.get('city');
  const records=state.projects.filter(p=>!city||p.city===city)
   .map(p=>{
    const company=projectCompany(state,p);
    const signals=inferSignals([p.description,p.project_type].filter(Boolean).join(' '));
    const current={...p,cabinet_signal:signals.cabinet,door_signal:signals.door};
    const quality=evidenceFor(current,company);const fit=computeScore(current,company);
    return {...current,score:fit.score,score_reasons:fit.reasons,company,lead_tier:quality.tier,lead_why:quality.reasons,source_age_days:quality.ageDays};
   })
   .sort((a,b)=>{const rank={priority:2,research:1,archive:0};return (rank[b.lead_tier]||0)-(rank[a.lead_tier]||0)||b.score-a.score||String(b.last_checked_at||'').localeCompare(String(a.last_checked_at||''));})
   .slice(0,500);
  return Response.json({projects:records},{headers:noStore});
 }catch(err){return Response.json({error:'Could not read projects',detail:String(err.message).slice(0,180)},{status:503,headers:noStore});}
}
export async function PATCH(req){
 const a=await authorize(req,null,false);if(a.error)return denied(a);
 try{
  const b=await req.json();if(!b||!uuid.test(b.id))return Response.json({error:'Invalid project ID'},{status:400});
  for(const k of ['construction_start_date','construction_end_date','installation_date'])if(Object.hasOwn(b,k)&&!validDate(b[k]))return Response.json({error:'Invalid '+k},{status:400});
  if('installation_date_confidence' in b&&!['unknown','estimated','verified'].includes(b.installation_date_confidence))return Response.json({error:'Invalid date confidence'},{status:400});
  if('procurement_status' in b&&!['unknown','open','quote_requested','awarded','closed'].includes(b.procurement_status))return Response.json({error:'Invalid procurement state'},{status:400});
  if('unit_count' in b && b.unit_count!==null && (!Number.isInteger(b.unit_count)||b.unit_count<1||b.unit_count>2000))return Response.json({error:'Invalid unit count'},{status:400});
  for(const k of ['designer','architect','developer','sales_note'])if(Object.hasOwn(b,k)&&b[k]!==null&&(typeof b[k]!=='string'||b[k].length>1500))return Response.json({error:'Invalid '+k},{status:400});
  const safe={id:b.id};for(const k of allowed)if(Object.hasOwn(b,k))safe[k]=b[k];
  const result=await mutateState(s=>{if(!updateProject(s,safe))return {noChange:true,result:{error:'Project not found'}};return {ok:true};});
  if(result.error)return Response.json(result,{status:404});return Response.json(result,{headers:noStore});
 }catch(err){return Response.json({error:'Could not update project',detail:String(err.message).slice(0,180)},{status:503});}
}
