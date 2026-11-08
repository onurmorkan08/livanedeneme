import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export function openStores(directory=path.join(process.cwd(),'data')) {
  fs.mkdirSync(directory,{recursive:true});
  const lead = new DatabaseSync(path.join(directory,'lead-generator.sqlite'));
  const crm = new DatabaseSync(path.join(directory,'sales-crm.sqlite'));
  for(const db of [lead,crm]) db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  lead.exec(`CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY, source TEXT NOT NULL, source_url TEXT NOT NULL,
    permit_number TEXT NOT NULL, project TEXT NOT NULL, address TEXT NOT NULL,
    location TEXT NOT NULL, scope TEXT NOT NULL CHECK(scope IN ('Cabinets','Interior Doors','Both')),
    gc TEXT, contact TEXT, permit_status TEXT, permit_date TEXT,
    description TEXT NOT NULL, quality INTEGER NOT NULL CHECK(quality BETWEEN 0 AND 10),
    quality_reasons TEXT NOT NULL, last_seen TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS scan_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT NOT NULL, ended_at TEXT,
    status TEXT NOT NULL, imported INTEGER NOT NULL DEFAULT 0, errors TEXT NOT NULL DEFAULT '[]'
  );`);
  // A different physical DB and no CRM write route exist in the MVP.
  crm.exec(`CREATE TABLE IF NOT EXISTS infrastructure_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  return {lead,crm};
}
export function saveLead(db,lead){
  db.prepare(`INSERT INTO leads(id,source,source_url,permit_number,project,address,location,scope,gc,contact,permit_status,permit_date,description,quality,quality_reasons,last_seen)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
    source_url=excluded.source_url,project=excluded.project,address=excluded.address,scope=excluded.scope,
    gc=excluded.gc,contact=excluded.contact,permit_status=excluded.permit_status,
    permit_date=excluded.permit_date,description=excluded.description,quality=excluded.quality,
    quality_reasons=excluded.quality_reasons,last_seen=excluded.last_seen`).run(
    lead.id,lead.source,lead.sourceUrl,lead.permitNumber,lead.project,lead.address,lead.location,lead.scope,
    lead.gc,lead.contact,lead.permitStatus,lead.permitDate,lead.description,lead.quality,JSON.stringify(lead.reasons),new Date().toISOString());
}
export function getLeads(db,{city='',scope='',search='',limit=100}={}) {
  const params=[]; let where=' WHERE 1=1';
  if(city){where+=' AND location=?';params.push(city);}
  if(scope){where+=' AND scope=?';params.push(scope);}
  if(search){where+=' AND (project LIKE ? OR address LIKE ? OR gc LIKE ? OR description LIKE ?)';params.push(...Array(4).fill('%'+search+'%'));}
  return db.prepare('SELECT * FROM leads'+where+' ORDER BY quality DESC, permit_date DESC LIMIT ?').all(...params,Math.min(500,Math.max(1,limit))).map(r=>({
    id:r.id,source:r.source,sourceUrl:r.source_url,permitNumber:r.permit_number,
    project:r.project,address:r.address,location:r.location,scope:r.scope,gc:r.gc,contact:r.contact,
    permitStatus:r.permit_status,permitDate:r.permit_date,description:r.description,
    quality:r.quality,reasons:JSON.parse(r.quality_reasons)
  }));
}
