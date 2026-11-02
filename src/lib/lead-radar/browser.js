'use client';
import {createClient} from '@supabase/supabase-js';
let instance;
export function getBrowserClient(){
 if(!instance){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)throw new Error('Public Supabase settings missing');
  instance=createClient(url,key);
 }
 return instance;
}
export async function authorizedFetch(path,opts={}) {
 const sb=getBrowserClient();
 const {data:{session}}=await sb.auth.getSession();
 if(!session)throw new Error('Session expired. Sign in again.');
 const resp=await fetch(path,{...opts,headers:{'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json',...(opts.headers||{})},cache:'no-store'});
 const json=await resp.json().catch(()=>({error:'Unexpected response'}));
 if(!resp.ok)throw new Error(json.detail||json.error||'Request failed');
 return json;
}
