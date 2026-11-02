import {createHash,createHmac,timingSafeEqual} from 'node:crypto';

export const STAFF_COOKIE='livane_staff_session';
const LIFE_SECONDS=60*60*24*7;
const STAFF={
  onur:{display_name:'Onur',role:'admin',env:'LIVANE_ONUR_PASSWORD'},
  semih:{display_name:'Semih',role:'sales',env:'LIVANE_SEMIH_PASSWORD'},
};

function sessionSecret(){
  const value=process.env.LIVANE_SESSION_SECRET;
  if (!value || value.length<32) throw new Error('Staff login is not configured');
  return value;
}
export function accountsConfigured(){
  return Boolean(process.env.LIVANE_ONUR_PASSWORD && process.env.LIVANE_SEMIH_PASSWORD && process.env.LIVANE_SESSION_SECRET?.length>=32);
}
export function authenticateStaff(username,password){
  const key=String(username||'').toLowerCase().trim();
  const person=STAFF[key];
  const expected=person&&process.env[person.env];
  if(!person||!expected||typeof password!=='string'||password.length>256)return null;
  const a=createHash('sha256').update(password,'utf8').digest();
  const b=createHash('sha256').update(expected,'utf8').digest();
  if(!timingSafeEqual(a,b))return null;
  return {username:key,display_name:person.display_name,role:person.role};
}
function signature(payload){
  return createHmac('sha256',sessionSecret()).update(payload).digest('base64url');
}
export function issueStaffSession(person,nowSeconds=Math.floor(Date.now()/1000)){
  if(!STAFF[person.username])throw new Error('Unknown account');
  const payload=`v1.${person.username}.${nowSeconds+LIFE_SECONDS}`;
  return payload+'.'+signature(payload);
}
export function verifyStaffToken(token,nowSeconds=Math.floor(Date.now()/1000)){
  try {
    if(typeof token!=='string'||token.length>500)return null;
    const segments=token.split('.');
    if(segments.length!==4||segments[0]!=='v1')return null;
    const [,username,expiryString,received]=segments;
    if(!STAFF[username]||!/^\d{10,12}$/.test(expiryString))return null;
    const expires=Number(expiryString);
    if(expires<=nowSeconds||expires>nowSeconds+LIFE_SECONDS)return null;
    const correct=signature(segments.slice(0,3).join('.'));
    const a=Buffer.from(received,'utf8'),b=Buffer.from(correct,'utf8');
    if(a.length!==b.length||!timingSafeEqual(a,b))return null;
    return {username,display_name:STAFF[username].display_name,role:STAFF[username].role};
  } catch {return null;}
}
export function sessionFromRequest(request){
  const header=request.headers.get('cookie')||'';
  const pair=header.split(';').map(x=>x.trim()).find(x=>x.startsWith(STAFF_COOKIE+'='));
  return verifyStaffToken(pair?decodeURIComponent(pair.slice(STAFF_COOKIE.length+1)):null);
}
export function cookieFor(token,secure=true){
  return `${STAFF_COOKIE}=${encodeURIComponent(token)}; Max-Age=${LIFE_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure?'; Secure':''}`;
}
export function clearCookie(secure=true){
  return `${STAFF_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure?'; Secure':''}`;
}
