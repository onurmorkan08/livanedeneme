'use client';

let client;
export function getBrowserClient(){
 if(!client)client={auth:{
  async getSession(){
    const response=await fetch('/api/lead-radar/session',{credentials:'same-origin',cache:'no-store'});
    if(!response.ok)return {data:{session:null}};
    const {user}=await response.json();
    return {data:{session:{user:{id:user.username,username:user.username,email:user.display_name,role:user.role}}}};
  },
  async signOut(){
    const response=await fetch('/api/lead-radar/session',{method:'DELETE',credentials:'same-origin',cache:'no-store'});
    if(!response.ok)throw new Error('Could not sign out');
    return {error:null};
  }
 }};
 return client;
}
export async function authorizedFetch(path,opts={}){
 const response=await fetch(path,{...opts,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',...(opts.headers||{})}});
 const json=await response.json().catch(()=>({error:'Unexpected response'}));
 if(!response.ok)throw new Error(json.detail||json.error||'Request failed');
 return json;
}
