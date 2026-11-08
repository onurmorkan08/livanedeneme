import {test} from 'node:test';import assert from 'node:assert/strict';
import {detectScope,preliminaryQuality} from '../src/classify.mjs';
test('matching explicit cabinet and interior door phrases',()=>{
  assert.equal(detectScope('Kitchen cabinet replacement and interior doors installation').scope,'Both');
  assert.equal(detectScope('Replace kitchen cabinets').scope,'Cabinets');
  assert.equal(detectScope('Replace bedroom doors').scope,'Interior Doors');
});
test('rejects irrelevant garage shower and generic renovation permits',()=>{
  for(const d of ['garage door replacement','glass shower door','full home renovation','new electrical cabinet','Replace exterior entry doors','install kitchen countertops'])assert.equal(detectScope(d),null,d);
});
test('missing contact is not treated as bad lead',()=>{
  const x=preliminaryQuality({scope:'Cabinets',contractor:null,contact:null,status:'Active'});
  assert(x.score>=5);assert(x.reasons.some(s=>s.includes('missing information')));
});
