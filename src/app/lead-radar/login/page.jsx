'use client';
import {useState,useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {getBrowserClient} from '../../../lib/lead-radar/browser.js';
export default function Login(){
 const router=useRouter();const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;getBrowserClient().auth.getSession().then(({data})=>{if(active&&data.session)router.replace('/lead-radar');}).catch(()=>{});return()=>{active=false};},[router]);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{const {error}=await getBrowserClient().auth.signInWithPassword({email,password});if(error)throw error;router.replace('/lead-radar');}catch(err){setError(err.message)}finally{setBusy(false)}}
 return <main className="login-wrap lr-root"><div className="login-box"><div className="eyebrow">LIVANE / INTERNAL INTELLIGENCE</div><h1>Lead <em>Radar.</em></h1><p className="muted">Livane / Staff access. Account permissions are controlled centrally.</p><form onSubmit={submit} className="stack"><label>Email<input autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@company.com" /></label><label>Password<input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>{error&&<div className="error">{error}</div>}<button className="primary" disabled={busy}>{busy?'Signing in…':'Sign in →'}</button></form></div></main>
}
