import crypto from 'node:crypto';
const COOKIE='livane_radar_v2';
const b64=v=>Buffer.from(v).toString('base64url');
function secret(){const raw=process.env.AUTH_COOKIE_SECRET;
  if(!raw||raw.length<32)throw new Error('AUTH_COOKIE_SECRET must be 32+ characters');
  return crypto.createHash('sha256').update(raw).digest();}
function seal(obj){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',secret(),iv),data=Buffer.from(JSON.stringify(obj));
  const encrypted=Buffer.concat([cipher.update(data),cipher.final()]);return [b64(iv),b64(cipher.getAuthTag()),b64(encrypted)].join('.');}
function unseal(s){try{const [i,t,e]=s.split('.');if(!i||!t||!e)return null;
  const d=crypto.createDecipheriv('aes-256-gcm',secret(),Buffer.from(i,'base64url'));
  d.setAuthTag(Buffer.from(t,'base64url'));return JSON.parse(Buffer.concat([d.update(Buffer.from(e,'base64url')),d.final()]).toString());
  }catch{return null;}}
export function devMode(req){const host=(req.headers.host||'').split(':')[0];return process.env.DEV_BYPASS_AUTH==='true' && process.env.NODE_ENV!=='production' && (host==='localhost'||host==='127.0.0.1');}
export function userFromRequest(req){if(devMode(req))return {id:'local-dev',email:'Local test user',dev:true};
  const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='));
  if(!cookie)return null;const data=unseal(cookie.slice(COOKIE.length+1));
  if(!data||data.exp<Date.now())return null;const allowed=(process.env.ALLOWED_USER_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!allowed.includes(data.id))return null;return {id:data.id,email:data.email,dev:false};
}
export async function signIn(email,password){
  const base=process.env.SUPABASE_AUTH_URL?.replace(/\/$/,'');
  const key=process.env.SUPABASE_ANON_KEY;
  if(!base||!key||!process.env.ALLOWED_USER_IDS)throw new Error('Supabase Auth environment is missing');
  const url=new URL('/auth/v1/token?grant_type=password',base);
  const result=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(12000)});
  const auth=await result.json();
  if(!result.ok||!auth.user?.id) return null;
  const allowed=process.env.ALLOWED_USER_IDS.split(',').map(x=>x.trim());
  if(!allowed.includes(auth.user.id))return null;
  const duration=Math.min(Math.max(300,auth.expires_in||3600),3600);
  const exp=Date.now()+duration*1000;
  return {cookie:seal({id:auth.user.id,email:auth.user.email,exp}),maxAge:duration};
}
export function makeCookie(v,maxAge,secure){return `${COOKIE}=${v}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`;}
export function clearCookie(secure){return `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure?'; Secure':''}`;}
