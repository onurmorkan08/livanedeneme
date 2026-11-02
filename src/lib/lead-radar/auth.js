import {getAdmin} from './supabase.js';

export async function authorize(request, requiredRole=null) {
  const bearer=request.headers.get('authorization') || '';
  if (!bearer.startsWith('Bearer ')) return {error:'Missing access token',status:401};
  const accessToken=bearer.slice(7).trim();
  if (!accessToken) return {error:'Missing access token',status:401};
  const db=getAdmin();
  const {data:{user},error:authError}=await db.auth.getUser(accessToken);
  if (authError || !user) return {error:'Invalid session',status:401};
  const {data:profile,error:profileError}=await db.from('profiles').select('role,display_name').eq('user_id',user.id).maybeSingle();
  if (profileError || !profile) return {error:'Access not configured for this user',status:403};
  if (requiredRole && profile.role!==requiredRole) return {error:'Insufficient permission',status:403};
  return {user,profile,db};
}
export function denied(auth) {return Response.json({error:auth.error},{status:auth.status});}
export function isCron(request) {
 const s=process.env.CRON_SECRET;
 return !!s && s.length>=32 && request.headers.get('authorization')===`Bearer ${s}`;
}
