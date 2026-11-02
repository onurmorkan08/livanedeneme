import {getAdmin} from './supabase.js';
import {sessionFromRequest} from './session.js';

export async function authorize(request,requiredRole=null,needsDatabase=true){
  const person=sessionFromRequest(request);
  if(!person)return {error:'Sign in required',status:401};
  if(requiredRole && person.role!==requiredRole)return {error:'Insufficient permission',status:403};
  const profile={display_name:person.display_name,role:person.role};
  if(!needsDatabase)return {user:{id:person.username},profile};
  try {return {user:{id:person.username},profile,db:getAdmin()};}
  catch{return {error:'CRM database has not been connected yet',status:503};}
}
export function denied(a){return Response.json({error:a.error},{status:a.status,headers:{'Cache-Control':'no-store'}});}
export function isCron(request){
 const secret=process.env.CRON_SECRET;
 return Boolean(secret&&secret.length>=32&&request.headers.get('authorization')===`Bearer ${secret}`);
}
