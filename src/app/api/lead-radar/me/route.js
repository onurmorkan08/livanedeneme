import {authorize,denied} from '../../../../lib/lead-radar/auth.js';
export const dynamic='force-dynamic';
export async function GET(req){try{const a=await authorize(req);if(a.error)return denied(a);return Response.json({profile:a.profile});}catch(e){return Response.json({error:'Cannot verify role'},{status:500})}}
