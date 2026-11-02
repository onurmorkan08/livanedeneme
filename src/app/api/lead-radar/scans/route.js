import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
export const dynamic='force-dynamic';
export async function GET(req) {
 try {
   const a=await authorize(req);if(a.error)return denied(a);
   const {data,error}=await a.db.from('scan_runs').select('id,source,status,fetched,created,updated,errors,error_detail,started_at,finished_at').order('started_at',{ascending:false}).limit(15);
   if(error)throw error;
   return Response.json({scans:data||[]});
 } catch(e){return Response.json({error:'Could not read scan runs',detail:String(e.message).slice(0,200)},{status:500});}
}
