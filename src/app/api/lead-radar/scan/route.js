import {authorize,denied,isCron} from '../../../../lib/lead-radar/auth.js';
import {runScan} from '../../../../lib/lead-radar/scan.js';
export const dynamic='force-dynamic';
export const maxDuration=300;
let inProgress=false; // In-process guard; database-level lock needed for multi-instance high-volume production.
async function handle(req) {
  try {
    if(!isCron(req)) {
      const a=await authorize(req,'admin'); if(a.error)return denied(a);
    }
    if (inProgress) return Response.json({error:'Scan is already running in this instance'},{status:409});
    inProgress=true;
    try {return Response.json({runs:await runScan()});}
    finally {inProgress=false;}
  } catch(e){return Response.json({error:'Scan failed',detail:String(e.message).slice(0,250)},{status:500});}
}
export async function POST(req){return handle(req);}
export async function GET(req){
  if(!isCron(req))return Response.json({error:'Cron authorization required'},{status:401});
  return handle(req);
}
