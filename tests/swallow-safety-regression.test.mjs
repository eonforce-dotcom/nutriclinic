import test from 'node:test';
import assert from 'node:assert/strict';
import {recommend, normalize} from '../web/engine.mjs';
import {swallowStatus} from '../web/scales.mjs';
const base = {setting:'ward', age:67, sex:'male', heightCm:175, weightKg:65, gi:'ok', kidney:'normal', shock:'none', feeding:'none', weightLossPct:0, lowIntakeDays:0, lowElectrolytes:'no', alcohol:'no', riskDrugs:'no'};
test('an intake/texture score alone cannot establish oral or thin-fluid safety', () => {
  for (const values of [{fois:7}, {iddsiFood:7, iddsiFluid:0}, {fois:5, iddsiFood:4, iddsiFluid:2}]) {
    assert.equal(swallowStatus(normalize({...base, ...values}).p).value, null);
    const r = recommend({...base, ...values});
    assert.notEqual(r.route.kind, 'oral');
    assert.ok(r.missing.some(x => x.field === 'swallow'));
  }
});
test('an explicit clinical oral decision still allows an oral recommendation while red flags restrict it', () => {
  assert.equal(recommend({...base, swallow:'safe', fois:7, oralIntakePct:40}).route.kind, 'oral');
  assert.equal(swallowStatus(normalize({...base, swallow:'safe', iddsiFluid:2}).p).value, 'modified');
  for (const restrictions of [{impairedAlertness:true}, {unsafeSigns:true}, {fois:2}]) {
    assert.equal(swallowStatus(normalize({...base, swallow:'safe', ...restrictions}).p).value, 'unsafe');
  }
});
