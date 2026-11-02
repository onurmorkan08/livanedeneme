import {accountsConfigured,authenticateStaff,clearCookie,cookieFor,issueStaffSession,sessionFromRequest} from '../../../../lib/lead-radar/session.js';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'no-store'};
const secure=process.env.NODE_ENV==='production';
export async function GET(req){
  const user=sessionFromRequest(req);
  if(!user)return Response.json({error:'Not signed in'},{status:401,headers:noStore});
  return Response.json({user},{headers:noStore});
}
export async function POST(req){
  if(!accountsConfigured())return Response.json({error:'Staff passwords have not been configured on the server'},{status:503,headers:noStore});
  const body=await req.json().catch(()=>null);
  if(!body||typeof body.username!=='string'||typeof body.password!=='string')return Response.json({error:'Enter username and password'},{status:400,headers:noStore});
  const person=authenticateStaff(body.username,body.password);
  if(!person)return Response.json({error:'Incorrect username or password'},{status:401,headers:noStore});
  const token=issueStaffSession(person);
  return Response.json({user:person},{headers:{...noStore,'Set-Cookie':cookieFor(token,secure)}});
}
export async function DELETE(){
  return Response.json({ok:true},{headers:{...noStore,'Set-Cookie':clearCookie(secure)}});
}
