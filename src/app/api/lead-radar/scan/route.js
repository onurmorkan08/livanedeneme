import {authorize,denied,isCron} from '../../../../lib/lead-radar/auth.js';
import {runScan} from '../../../../lib/lead-radar/scan.js';
export const dynamic='force-dynamic';
export const maxDuration=300;
let inProgress=false;
async function handle(req){
 try{
  if(!isCron(req)){const a=await authorize(req,'admin',false);if(a.error)return denied(a);}
  if(inProgress)return Response.json({error:'Scan already running in this instance'},{status:409});
  inProgress=true;
  try{return Response.json({runs:await runScan()},{headers:{'Cache-Control':'no-store'}});}
  finally{inProgress=false;}
 }catch(err){return Response.json({error:'Scan failed',detail:String(err.message).slice(0,250)},{status:503});}
}
export async function POST(req){return handle(req);}
export async function GET(req){if(!isCron(req))return Response.json({error:'Cron authorization required'},{status:401});return handle(req);}
