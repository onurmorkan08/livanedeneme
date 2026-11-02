import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
import {loadState} from '../../../../lib/lead-radar/storage.js';
export const dynamic='force-dynamic';
export async function GET(req){
 const a=await authorize(req,null,false);if(a.error)return denied(a);
 try{const {state}=await loadState();return Response.json({scans:state.scans.slice(0,15)},{headers:{'Cache-Control':'no-store'}});}
 catch(err){return Response.json({error:'Could not read scans',detail:String(err.message).slice(0,180)},{status:503});}
}
