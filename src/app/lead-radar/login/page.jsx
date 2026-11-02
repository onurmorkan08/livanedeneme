'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {getBrowserClient} from '../../../lib/lead-radar/browser.js';

export default function Login(){
 const router=useRouter();
 const [username,setUsername]=useState('');
 const [password,setPassword]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;getBrowserClient().auth.getSession().then(({data})=>{
  if(active&&data.session)router.replace('/lead-radar');
 }).catch(()=>{});return()=>{active=false};},[router]);
 async function submit(event){
  event.preventDefault();setBusy(true);setError('');
  try {
   const response=await fetch('/api/lead-radar/session',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||'Login failed');
   router.replace('/lead-radar');
  }catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <main className="login-wrap lr-root"><div className="login-box">
  <div className="eyebrow">LIVANE / STAFF ACCESS</div>
  <h1>Lead <em>Radar.</em></h1>
  <p className="muted">Private team workspace.</p>
  <form className="stack" onSubmit={submit}>
   <label>Username<input autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value.toLowerCase())} placeholder="onur or semih" /></label>
   <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
   {error&&<div className="error" role="alert">{error}</div>}
   <button className="primary" disabled={busy}>{busy?'Signing in…':'Login →'}</button>
  </form>
  <p className="muted small" style={{marginTop:24}}><a href="/">← Back to Livane</a></p>
 </div></main>;
}
