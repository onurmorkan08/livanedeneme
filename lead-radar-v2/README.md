# Livane Lead Radar V2 — isolated foundation + strict permit discovery

**Status: development prototype only.** Tested locally with controlled data; live municipal endpoints and existing login are NOT yet integration-tested. No records are shipped or fabricated. Neither the public Livane site nor `/lead-radar` is changed.

## Requirements
- Node.js 22 or newer (uses built-in experimental `node:sqlite`).
- Writable local disk for the two SQLite databases.
- Network access for public ArcGIS permit APIs.
- To sign in normally: existing Supabase Auth URL + anon key, two user UUIDs, session secret.

## Run locally
1. `cp .env.example .env` then load environment with your shell or use `node --env-file=.env server.mjs`.
2. `node --test tests/*.test.mjs`
3. `node --env-file=.env server.mjs` then open `http://localhost:3008`.
4. For **local testing only** without credentials: `DEV_BYPASS_AUTH=true node server.mjs` and open `http://localhost:3008`. Never set this on a public host.
5. Click **Scan official sources**. Network/API issues appear as explicit errors. Source failure does not create dummy records.

## Modules
- M1: isolated lead-generator and CRM database files; existing Supabase Auth is configurable; UI and data persistence implemented. **Old app backup is NOT completed**, because old app DB credentials/export have not been provided.
- M2: official Miami iBuild and Fort Lauderdale Permit Tracker ArcGIS API queries; strict matching for cabinet/casework or explicit interior door phrases; source permalinks; preliminary evidence score; no invented contact fields.
- M3–M6 not implemented. No automatic CRM insertion. The `sales-crm.sqlite` store is deliberately inert.

## Critical production constraints
- **Do not deploy the SQLite implementation unchanged to Vercel**: Vercel functions do not provide durable writable storage for application databases. Before publishing preview, migrate Lead Generator and CRM to separate persistent managed DB instances (e.g. two separate Supabase/Postgres databases) and test read/write/restart behavior.
- Existing Onur/Semih login uses Supabase Auth only if its original Auth project is confirmed. This prototype does not create user accounts and does not ship credentials.
- Independently back up the legacy `/lead-radar` DB/schemas before ANY cutover. `npm run backup` backs up only V2 local SQLite files and is not a legacy backup.
- **Production City of Miami field names/API and both live ArcGIS query operations need runtime testing.** Miami metadata matches publicly documented iBuild field names, but no live records were validated in this execution environment.
- Official permit descriptions are short and cannot establish a live purchasing requirement. These are sourced, preliminary opportunities, not guaranteed leads.
- `source_url` links to an official ArcGIS query filtered by permit number. For full project-specific validation, open the query, search the municipality portal, and inspect the detailed permit/plan.
- Endpoint reads limit the search to first 400 matching rows per source, ordered by ArcGIS object ID (not a guaranteed date order). Expand paging and per-source data freshness only after validation.

## Privacy / safety
- No email sending, CRM export, or automated outreach.
- Auth cookie encrypted and 1-hour maximum lifetime; user UUID allowlist; no development bypass on remote host or NODE_ENV=production.
- Public exposure requires HTTPS reverse proxy, rate-limiting, confirmed backend auth config, managed DBs and deployment tests.

## Definition of done for M2
1. 10–20 **real** currently actionable permit records with working official source references and manual scope review.
2. Confirm raw descriptions, source date, location, contact fields, and status for each.
3. No generic renovation, unrelated garage/glass doors or fabricated projects.
4. Confirm both authorized users can sign in; scanner can run, DB persists, failed source leaves prior records intact.
5. Only after written acceptance: freeze M1+M2 and start M3.
