import {get,put} from '@vercel/blob';
import {parseState} from './model.mjs';

const STATE_PATH='livane-radar/state-v1.json';
function requireStore(){if(!process.env.BLOB_READ_WRITE_TOKEN)throw new Error('Lead Radar private storage not connected');}
export async function loadState(){
 requireStore();
 const file=await get(STATE_PATH,{access:'private',useCache:false});
 if(!file)return {state:parseState(null),etag:null};
 if(file.statusCode!==200||!file.stream)throw Error('Private storage read failed');
 const raw=await new Response(file.stream).text();
 return {state:parseState(JSON.parse(raw)),etag:file.blob.etag};
}
function isRetryable(err){return /precondition|already.exists|conflict|412|409/i.test(String(err?.name||'')+' '+String(err?.message||''));}
export async function mutateState(change,maxRetries=6){
 for(let attempt=0;attempt<maxRetries;attempt++){
  const {state,etag}=await loadState();
  const value=await change(state);
  if(value?.noChange)return value.result;
  const options={access:'private',contentType:'application/json',cacheControlMaxAge:60};
  if(etag){options.allowOverwrite=true;options.ifMatch=etag;}
  // First writer must not overwrite another simultaneous first writer.
  try{await put(STATE_PATH,JSON.stringify(state),options);return value;}
  catch(err){if(isRetryable(err)&&attempt<maxRetries-1)continue;throw err;}
 }
 throw Error('Another user updated the CRM; try again');
}
