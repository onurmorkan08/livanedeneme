import {createClient} from '@supabase/supabase-js';
let admin;
export function getAdmin() {
  if (!admin) {
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !secret) throw new Error('Missing server Supabase configuration');
    admin=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  }
  return admin;
}
