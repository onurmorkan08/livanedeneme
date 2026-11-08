import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {openStores,getLeads} from './src/db.mjs';
import {scanSources} from './src/discovery.mjs';
import {userFromRequest,signIn,makeCookie,clearCookie,devMode} from './src/auth.mjs';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const {lead,crm}=openStores(process.env.DB_DIR||path.join(ROOT,'data'));
const publicDir=path.join(ROOT,'public');
let scanning=false;
function securityHeaders(res){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");}
function send(res,status,body,type='application/json'){res.writeHead(status,{'Content-Type':type});res.end(type==='application/json'?JSON.stringify(body):body);}
async function readBody(req){let b='';for await(const p of req){b+=p.toString();if(b.length>10000)throw new Error('Request too large');}return JSON.parse(b||'{}');}
function originOK(req){const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===req.headers.host;}catch{return false;}}
const server=http.createServer(async (req,res)=>{
  securityHeaders(res);
  try{
    const url=new URL(req.url,'http://localhost');
    const secure=(req.headers['x-forwarded-proto']==='https');
    if(req.method==='POST'&&!originOK(req))return send(res,403,{error:'Origin check failed'});
    if(req.method==='POST'&&url.pathname==='/api/login'){
      const {email,password}=await readBody(req);
      if(typeof email!=='string'||typeof password!=='string')return send(res,400,{error:'Email/password required'});
      const auth=await signIn(email,password);
      if(!auth)return send(res,401,{error:'Login failed or user not authorized'});
      res.setHeader('Set-Cookie',makeCookie(auth.cookie,auth.maxAge,secure));
      return send(res,200,{ok:true});
    }
    if(req.method==='POST'&&url.pathname==='/api/logout'){
      res.setHeader('Set-Cookie',clearCookie(secure));return send(res,200,{ok:true});
    }
    if(url.pathname==='/api/session')return send(res,200,{user:userFromRequest(req)});
    const user=userFromRequest(req);
    if(url.pathname.startsWith('/api/')&&!user)return send(res,401,{error:'Login required'});
    if(req.method==='GET'&&url.pathname==='/api/leads'){
      const city=url.searchParams.get('city')||'',scope=url.searchParams.get('scope')||'',search=url.searchParams.get('search')||'';
      const filters={city:['Miami','Fort Lauderdale'].includes(city)?city:'',scope:['Cabinets','Interior Doors','Both'].includes(scope)?scope:'',search:search.slice(0,80)};
      const latest=lead.prepare('SELECT * FROM scan_runs ORDER BY id DESC LIMIT 1').get();
      return send(res,200,{leads:getLeads(lead,filters),lastScan:latest?{status:latest.status,endedAt:latest.ended_at,imported:latest.imported,errors:JSON.parse(latest.errors)}:null});
    }
    if(req.method==='POST'&&url.pathname==='/api/discovery/run'){
      if(scanning)return send(res,409,{error:'Scan already in progress'});
      scanning=true;try{return send(res,200,await scanSources(lead));}finally{scanning=false;}
    }
    if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{status:'ok',modules:['infrastructure','discovery'],crmWriteEnabled:false,environment:user.dev?'local-dev':'authenticated'});
    if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/index.html'||url.pathname==='/app.js'||url.pathname==='/style.css')){
      const name=url.pathname==='/'?'index.html':url.pathname.slice(1);const type=name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html';
      return send(res,200,fs.readFileSync(path.join(publicDir,name),'utf8'),type);
    }
    return send(res,404,{error:'Not found'});
  }catch(e){console.error('request error:',e.message);return send(res,500,{error:'Request failed',detail:process.env.NODE_ENV==='production'?undefined:e.message});}
});
const port=Number(process.env.PORT||3008);
server.listen(port,'127.0.0.1',()=>console.log(`Livane Lead Radar V2 on http://localhost:${port}`));
