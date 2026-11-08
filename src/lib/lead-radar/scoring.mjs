/** Livane Lead Radar v1.1. Evidence-first permit qualification. No invented bid openings. */
const cabinetWords=/\b(cabinets?|cabinetry|casework|millwork|built[ -]?ins?|wardrobes?|vanit(?:y|ies))\b/i;
const interiorDoorWords=/\b(interior doors?|inside doors?|pocket doors?|closet doors?|bedroom doors?|bathroom doors?|prehung(?: doors?)?|barn doors?|door schedules?)\b/i;
const genericDoors=/\b(doors?|door installation|door replacement)\b/i;
const exteriorOnly=/\b(garage doors?|overhead doors?|roll[ -]?up doors?|impact (?:rated )?(?:doors?|windows?)|hurricane (?:doors?|windows?)|exterior doors?|storefronts?|sliding glass doors?|window[s]?\s*(?:and|&)\s*doors?|front entry doors?|entrance doors?|shutters?|screen doors?)\b/i;
const residential=/\b(residential|residence|condo(?:minium)?s?|apartments?|town\s?homes?|townhouses?|duplex(?:es)?|single[ -]?family|multi[ -]?family|dwelling|homes?|houses?|sfr)\b/i;
const kitchenWork=/\b(kitchen|kitchens)\b.{0,95}\b(remodel\w*|renovat\w*|alter\w*|replac\w*|new|install\w*|reconfigur\w*)|\b(remodel\w*|renovat\w*|alter\w*|replac\w*|new|install\w*|reconfigur\w*)\b.{0,95}\b(kitchen|kitchens)\b/i;
const noInstallation=/\b(refinish|refacing|reface|paint(?:ing)? cabinets?|resurfac|repair only|countertops? only|backsplash only)\b/i;
const inactive=/\b(final(?:ed)?|closed|complete(?:d)?|cancel(?:led|ed)|expired|revoked|void|withdrawn|certificate of occupancy)\b/i;
// Specialty trades are not Livane cabinet/interior-door GCs.
const irrelevantTrades=/\b(plumb(?:ing|er|ers)?|electric(?:al|ian|ians)?|hvac|mechanical|air[ -]?condition(?:ing)?|glass|glazing|mirror|roof(?:ing|er|ers)?|pool(?:s)?|fire[ -]?sprinkler|fire[ -]?alarm|solar|elevator|irrigation)\b/i;

export function inferSignals(value=''){
 const text=String(value??'');
 const cabinet=cabinetWords.test(text)&&!noInstallation.test(text)?'explicit':kitchenWork.test(text)&&!noInstallation.test(text)?'potential':'unknown';
 // A garage/exterior-door permit is NOT an interior-door lead. When both kinds appear, retain interior evidence.
 let door='unknown';
 if(interiorDoorWords.test(text))door='explicit';
 else if(genericDoors.test(text)&&!exteriorOnly.test(text)&&/\b(interior|remodel|renovat|alter|residential|replacement|install|finish|house|home)\b/i.test(text))door='potential';
 return {cabinet,door};
}

export function sourceUpdateDate(project){
 const raw=project.raw_source||{};
 const v=project.source==='fort_lauderdale'?raw.LASTUPDATEDATE:raw.ApplicationStatusDate;
 const ms=typeof v==='number'?v:(/^\d{12,}$/.test(String(v??''))?Number(v):Date.parse(String(v??'')));
 const date=new Date(ms);
 return Number.isFinite(date.getTime())?date:null;
}
function daysOld(date,now){return date?Math.floor((now.getTime()-date.getTime())/86400000):null;}
export function isInactiveStatus(status){return inactive.test(String(status||''));}
export function evidenceFor(project,company={},now=new Date()){
 const cabinet=project.cabinet_signal||'unknown',door=project.door_signal||'unknown';
 const direct=cabinet==='explicit'||door==='explicit';
 const scopeRelevant=direct||cabinet==='potential'; // No generic residence-only leads.
 const unrelatedContractor=irrelevantTrades.test(String(company?.name||''));
 const unrelatedPermit=irrelevantTrades.test(String(project.project_type||''))&&!direct;
 const tradeExcluded=unrelatedContractor||unrelatedPermit;
 const relevant=scopeRelevant&&!tradeExcluded;
 const inactiveProject=isInactiveStatus(project.permit_status)||['closed','awarded'].includes(project.procurement_status);
 const ageDays=daysOld(sourceUpdateDate(project),now);
 const fresh=ageDays!==null&&ageDays>=0&&ageDays<=180;
 const phone=Boolean(company?.phone&&String(company.phone).replace(/\D/g,'').length>=10);
 const named=Boolean(company?.name);
 const address=Boolean(project.address||project.project_name);
 const scope=[cabinet==='explicit'?'Cabinets mentioned':cabinet==='potential'?'Kitchen work; cabinets unverified':null,door==='explicit'?'Interior doors mentioned':door==='potential'?'Doors possible; type unverified':null].filter(Boolean);
 const reasons=[...scope];
 if(phone&&named)reasons.push('Contractor and phone published in municipal permit');
 else reasons.push('Contractor phone not available in this permit');
 if(ageDays===null)reasons.push('Last municipal update unavailable');
 else reasons.push('Municipal record updated '+ageDays+' days ago');
 if(inactiveProject)reasons.push('Permit or procurement is closed/complete');
 if(tradeExcluded)reasons.push('Specialty contractor/permit outside cabinet and interior-door supply');
 if(!address)reasons.push('Project address not published');
 // Priority means an evidence-based prospect TO CONTACT. It does not mean bidding is open.
 const tier=!relevant||inactiveProject||!address||tradeExcluded?'archive':direct&&phone&&named&&fresh?'priority':'research';
 return {tier,relevant,direct,inactiveProject,tradeExcluded,ageDays,phone,named,address,fresh,reasons};
}

export function computeScore(project,company={},now=new Date()){
 company = company ?? {};
 const e=evidenceFor(project,company,now), reasons=[...e.reasons];
 const c=project.cabinet_signal||'unknown',d=project.door_signal||'unknown';
 let score=0;
 if(c==='explicit'&&d==='explicit'){score+=4.3;reasons.push('Both product categories explicitly documented');}
 else if(c==='explicit'&&d==='potential'||c==='potential'&&d==='explicit'){score+=3.6;reasons.push('One product explicit, other possible');}
 else if(c==='explicit'||d==='explicit'){score+=3.1;reasons.push('One relevant product explicitly documented');}
 else if(c==='potential'){score+=1.5;reasons.push('Kitchen scope; cabinets require verification');}
 if(e.named){score+=.45;reasons.push('Contractor named');}
 if(e.phone){score+=1.4;reasons.push('Published contractor phone available');}
 const status=String(project.permit_status||'');
 if(status&&!e.inactiveProject){score+=1.0;reasons.push('Permit status not marked closed; procurement unknown');}
 if(e.ageDays!==null&&e.ageDays>=0){
  if(e.ageDays<=90){score+=1.15;reasons.push('Municipal record recently updated');}
  else if(e.ageDays<=180){score+=.75;reasons.push('Municipal record updated within 180 days');}
 }
 if(project.permit_date){const dt=new Date(project.permit_date+'T00:00:00Z');const age=daysOld(dt,now);if(age!==null&&age>=0&&age<=180){score+=.45;reasons.push('Permit date within 180 days');}}
 if(Number.isInteger(company.employee_count)&&company.employee_count>0&&company.employee_count<=20){score+=.45;reasons.push('Small contractor size verified');}
 if(project.procurement_status==='quote_requested'){score+=1.5;reasons.push('Quote requested (manual CRM information)');}
 else if(project.procurement_status==='open'){score+=1.0;reasons.push('Open procurement (manual CRM information)');}
 if(project.installation_date&&['verified','estimated'].includes(project.installation_date_confidence)){
  const age=daysOld(new Date(project.installation_date+'T00:00:00Z'),now);
  if(age!==null&&age<=0&&age>=-90){score+=project.installation_date_confidence==='verified'?.7:.25;reasons.push('Recorded installation within 90 days');}
 }
 if(e.tier==='archive'){score=Math.min(score,2);reasons.push('Not an active, relevant product prospect');}
 return {score:Math.round(Math.min(10,Math.max(0,score))*10)/10,reasons};
}
export function normalizeCompanyKey(name,license,city){
 if(license&&String(license).trim())return 'lic:'+String(license).toUpperCase().replace(/[^A-Z0-9]/g,'');
 const normalized=String(name??'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const location=String(city??'').toLowerCase().replace(/[^a-z0-9]/g,'');
 return normalized?'name:'+location+':'+normalized:null;
}
export function classifyScope(p){const c=p.cabinet_signal!=='unknown',d=p.door_signal!=='unknown';return c&&d?'bundle':c?'cabinets':d?'doors':'unknown';}
