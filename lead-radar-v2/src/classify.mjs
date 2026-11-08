/* Strict, evidence-based MVP matching. No generic renovation is called a cabinet/door lead. */
const CABINET = /\b(cabinet(?:s|ry|ry\s+installation)?|casework|kitchen\s+millwork|millwork\s+in\s+(?:the\s+)?kitchen)\b/i;
const INTERIOR_DOOR = /\b(interior\s+(?:wood\s+|hollow\s+core\s+|solid\s+core\s+)?doors?|inside\s+doors?|bedroom\s+doors?|closet\s+doors?|internal\s+doors?|interior\s+door\s+(?:replacement|installation|install))\b/i;
const NEGATIVE_DOORS = /\b(garage|overhead|roll\s*up|shower|glass|storefront|sliding\s+glass|exterior|entry|entrance|storm|fire\s*exit)\s+doors?\b/i;
const NEGATIVE_CABINET = /\b(medicine\s+cabinet|electrical\s+cabinet|fire\s+cabinet|meter\s+cabinet|utility\s+cabinet)\b/ig;

export function detectScope(input) {
  const desc = String(input || '').replace(NEGATIVE_CABINET, ' ');
  const cabinets = CABINET.test(desc);
  // A garage/shower-door-only record must not be counted. Interior evidence still counts in a mixed record.
  const interiorDoors = INTERIOR_DOOR.test(desc);
  const unrelatedDoorOnly = !interiorDoors && NEGATIVE_DOORS.test(desc);
  if (!cabinets && !interiorDoors) return null;
  return { scope: cabinets && interiorDoors ? 'Both' : cabinets ? 'Cabinets' : 'Interior Doors',
    evidence: [cabinets ? 'Cabinet/casework explicitly mentioned' : null, interiorDoors ? 'Interior door explicitly mentioned' : null].filter(Boolean),
    ignoredUnrelatedDoors: unrelatedDoorOnly };
}
export function preliminaryQuality({scope, contractor, contact, status, date}) {
  const reasons=[];
  let score = scope === 'Both' ? 7 : 5;
  reasons.push(scope === 'Both' ? 'Both product categories directly indicated' : 'Product category directly indicated');
  if(contractor){score+=1;reasons.push('Contractor named in official record');}
  if(contact){score+=1;reasons.push('Contractor phone present in official record');}
  const s=(status||'').toLowerCase();
  if(/active|pending|review|issued|approved|open/.test(s) && !/inactive|closed/.test(s)) {score+=1;reasons.push('Permit status may still be actionable');}
  if(/final|expired|closed|cancel/.test(s)){score=Math.max(1,score-2);reasons.push('Permit status may indicate opportunity has passed');}
  const old=date && Date.now() - new Date(date).getTime() > 365*24*3600*1000;
  if(old){score=Math.max(1,score-1);reasons.push('Permit date is over one year old');}
  if(!contractor) reasons.push('GC unverified; missing information is not a negative finding');
  if(!contact) reasons.push('Contract phone unavailable; research required');
  return {score:Math.max(1,Math.min(10,score)), reasons};
}
