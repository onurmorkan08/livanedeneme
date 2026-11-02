/** Conservative prospect scoring: no procurement, size or schedule invented. */
const explicitCabinet = /\b(cabinet(?:ry|s)?|casework|millwork|wardrobe|vanit(?:y|ies))\b/i;
const explicitDoor = /\b(doors?|door\s+schedule|door\s+replacement|door\s+installation|prehung)\b/i;
const residentialContext = /\b(residential|residence|condo(?:minium)?s?|apartments?|town\s?homes?|townhouses?|duplex(?:es)?|single[ -]?family|multi[ -]?family|dwelling|home\s+renovation|house|sfr)\b/i;
const finishContext = /\b(interior|renovation|remodel|alteration|new construction|new building|finish|build[ -]?out|addition)\b/i;

export function inferSignals(value = '') {
  const text = String(value ?? '');
  const cabinet = explicitCabinet.test(text) ? 'explicit' : (((residentialContext.test(text) && finishContext.test(text)) || (/\bkitchen\b/i.test(text) && /\b(remodel|renovation|new|interior|build[ -]?out)\b/i.test(text))) ? 'potential' : 'unknown');
  const door = explicitDoor.test(text) ? 'explicit' : (residentialContext.test(text) && finishContext.test(text) ? 'potential' : 'unknown');
  return { cabinet, door };
}

export function computeScore(project, company = {}, today = new Date()) {
  const reasons = [];
  let score = 0;
  const c = project.cabinet_signal ?? 'unknown', d = project.door_signal ?? 'unknown';
  if (c === 'explicit' && d === 'explicit') { score += 3.5; reasons.push('Dolap ve kapı açıkça belirtilmiş (işin açık olduğu doğrulanmadı)'); }
  else if ((c === 'explicit' && d === 'potential') || (c === 'potential' && d === 'explicit')) {score += 2.3; reasons.push('Bir iş açıkça belirtilmiş, diğeri olası');}
  else if (c === 'explicit' || d === 'explicit') {score += 1.8; reasons.push('Tek ürün açıkça belirtilmiş');}
  else if (c === 'potential' && d === 'potential') {score += 1; reasons.push('Konut ve renovasyon bağlamından paket işi olası');}
  else if (c === 'potential' || d === 'potential') {score += 0.4; reasons.push('Zayıf kapsam işareti');}
  else reasons.push('Kapı/dolap işine ilişkin kanıt bulunmadı');

  if (project.procurement_status === 'quote_requested') {score += 2; reasons.push('Teklif istendi (manuel satış verisi)');}
  else if (project.procurement_status === 'open') {score += 1.5; reasons.push('Tedarik fırsatı açık (manuel doğrulama gerekli)');}
  else reasons.push('Tedarik/ihale durumu doğrulanmadı');

  if (project.installation_date) {
    const dt = new Date(project.installation_date + 'T12:00:00Z');
    const diff = (dt.getTime() - today.getTime()) / 86400000;
    const weight = project.installation_date_confidence === 'verified' ? 1 : project.installation_date_confidence === 'estimated' ? 0.55 : 0;
    if (diff >= 0 && diff <= 90) { score += 1.5 * weight; reasons.push('Montaj 0–90 gün içinde (' + project.installation_date_confidence + ')'); }
    else if (diff > 90 && diff <= 180) {score += 0.8 * weight; reasons.push('Montaj 3–6 ay içinde (' + project.installation_date_confidence + ')');}
    else reasons.push('Yakın tarihli doğrulanmış montaj fırsatı yok');
  } else reasons.push('Montaj tarihi bilinmiyor; permit tarihinden türetilmedi');

  const n = company.employee_count;
  if (Number.isInteger(n) && n >= 1) {
    if (n <= 20) score += 1.5;
    else if (n <= 50) score += 0.9;
    else if (n <= 100) score += 0.3;
    reasons.push('Şirket çalışan sayısı: ' + n + (company.employee_count_source ? ' (' + company.employee_count_source + ')' : ' (kaynak eklenmeli)'));
  } else reasons.push('Şirketin çalışan sayısı doğrulanmadı');

  const count = company.observed_project_count ?? 0;
  if (count >= 2 && count <= 10) {score += 0.7; reasons.push('Veri havuzunda birden fazla proje (şirketin tüm portföyü değil)');}
  else if (count >= 1) score += 0.35;
  if (company.phone) score += 0.6;
  if (company.decision_maker) score += 0.2;

  const inactive = /\b(final|closed|complete|completed|cancelled|canceled|revoked|expired|void)\b/i.test(project.permit_status ?? '');
  if (inactive || project.procurement_status === 'awarded' || project.procurement_status === 'closed') {
    score = Math.min(score, 2);
    reasons.push('Tamamlanmış/iptal edilmiş/tedarik edilmiş proje: puan sınırlandı');
  }
  return { score: Math.round(Math.min(10, Math.max(0, score)) * 10) / 10, reasons };
}

export function normalizeCompanyKey(name, license, city) {
  if (license && String(license).trim()) return 'lic:' + String(license).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normalized = String(name ?? '').toLowerCase().replace(/[^a-z0-9]/g,'');
  const location = String(city ?? '').toLowerCase().replace(/[^a-z0-9]/g,'');
  return normalized ? 'name:' + location + ':' + normalized : null;
}

export function classifyScope(p) {
  const c = p.cabinet_signal !== 'unknown', d = p.door_signal !== 'unknown';
  return c && d ? 'bundle' : c ? 'cabinets' : d ? 'doors' : 'unknown';
}
