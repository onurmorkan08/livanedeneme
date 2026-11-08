import fs from 'node:fs';import path from 'node:path';
const src=path.resolve(process.env.DB_DIR||'data');const dst=path.resolve('backups',new Date().toISOString().replaceAll(':','-'));
fs.mkdirSync(dst,{recursive:true});let n=0;
for(const name of ['lead-generator.sqlite','sales-crm.sqlite']){const f=path.join(src,name);if(fs.existsSync(f)){fs.copyFileSync(f,path.join(dst,name));n++;}}
console.log(`${n} MVP database file(s) copied to ${dst}. This is NOT a backup of the legacy /lead-radar database.`);
