import {get, put, BlobPreconditionFailedError} from '@vercel/blob';
import {parseState} from './model.mjs';

// Keep the original CRM object: no data reset or migration.
const STATE_PATH = 'livane-radar/state-v1.json';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function requireStore(){
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Lead Radar private storage not connected');
  }
}

export async function loadState(){
  requireStore();
  // Requires @vercel/blob >= 2.6.0: useCache:false reads the current origin object.
  // Earlier SDK releases could read an out-of-date ETag after an overwrite.
  const file = await get(STATE_PATH, {access:'private', useCache:false});
  if (!file) return {state:parseState(null), etag:null};
  if (file.statusCode !== 200 || !file.stream) {
    throw new Error('Private CRM storage read failed');
  }
  const raw = await new Response(file.stream).text();
  return {state:parseState(JSON.parse(raw)), etag:file.blob.etag};
}

function isConflict(error){
  return error instanceof BlobPreconditionFailedError ||
    /precondition|etag mismatch|already exists|conflict|\b412\b|\b409\b/i.test(
      String(error?.name || '') + ' ' + String(error?.message || '')
    );
}

/**
 * Read-modify-write with optimistic concurrency. If another request writes
 * first, re-read the latest CRM snapshot and re-apply the intended change.
 * The shared CRM data and manual notes are never cleared on a retry.
 */
export async function mutateState(change, maxRetries=9){
  for (let attempt=0; attempt<maxRetries; attempt++){
    const {state, etag} = await loadState();
    const value = await change(state);
    if (value?.noChange) return value.result;

    const options = {
      access:'private',
      contentType:'application/json',
      cacheControlMaxAge:60,
    };
    if (etag){
      options.allowOverwrite = true;
      options.ifMatch = etag;
    }
    try {
      await put(STATE_PATH, JSON.stringify(state), options);
      return value;
    } catch(error){
      if (!isConflict(error)) throw error;
      if (attempt === maxRetries - 1){
        throw new Error('CRM data changed during save. Refresh and retry. No existing records were deleted.');
      }
      // Delay helps when concurrent requests compete; avoids immediate repeated failures.
      await wait(Math.min(150 * (2 ** attempt), 1700));
    }
  }
  throw new Error('Could not save CRM changes after retries');
}
