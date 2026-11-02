import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
export const dynamic='force-dynamic';
export async function GET(req){
 const a=await authorize(req,null,false);
 if(a.error)return denied(a);
 return Response.json({profile:a.profile},{headers:{'Cache-Control':'no-store'}});
}
