import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ELECTRO_COMPONENT_CAPABILITIES,
  ELECTRO_KNOWN_COMPONENT_IDS,
  ELECTRO_KNOWN_RESTRICTION_IDS,
  ELECTRO_RESTRICTIONS,
  canonicalElectroRestrictionIds,
  formatElectroIdSelection,
  hasElectroRestriction,
  isComponentAllowed,
  parseElectroSpec,
} from '../src/electro/config.ts';
import { SYMBOLS } from '../src/electro/symbols.ts';

test('component capability ids are stable, unique and grouped in ten-step families', () => {
  assert.deepEqual(ELECTRO_COMPONENT_CAPABILITIES, {
    battery: 100,
    'voltage-source': 110,
    resistor: 200,
    'variable-resistor': 210,
    capacitor: 220,
    inductor: 230,
    'iron-core-inductor': 240,
    diode: 300,
    photodiode: 310,
    led: 320,
    switch: 400,
    'changeover-switch': 410,
    lamp: 500,
    motor: 510,
    voltmeter: 600,
    ammeter: 610,
    ground: 700,
    antenna: 710,
    transistor: 800,
    transformer: 900,
  });
  assert.equal(Object.keys(ELECTRO_COMPONENT_CAPABILITIES).length, SYMBOLS.length);
  assert.equal(ELECTRO_KNOWN_COMPONENT_IDS.length, SYMBOLS.length);
  assert.equal(new Set(ELECTRO_KNOWN_COMPONENT_IDS).size, SYMBOLS.length);
  assert.ok(ELECTRO_KNOWN_COMPONENT_IDS.every((id) => id >= 100 && id % 10 === 0));
  assert.deepEqual(ELECTRO_KNOWN_RESTRICTION_IDS, [100, 110, 120, 300, 400]);
});

test('legacy specs allow every component and contain no restrictions', () => {
  const config = parseElectroSpec('legacy;snap=0,25;stub=0.4;0;1;1');
  assert.equal(config.boardId, 'legacy');
  assert.equal(config.snapStep, 0.25);
  assert.equal(config.wireStub, 0.4);
  assert.equal(config.componentIds, null);
  assert.equal(config.restrictionIds.size, 0);
  assert.ok(SYMBOLS.every((symbol) => isComponentAllowed(config, symbol.id)));
});

test('component allowlists retain unknown ids and use zero as explicit empty selection', () => {
  const selected = parseElectroSpec(
    'id=profile;components=[100;220;9990];restrictions=[110;300;9999]',
  );
  assert.deepEqual([...selected.componentIds || []], [100, 220, 9990]);
  assert.equal(isComponentAllowed(selected, 'battery'), true);
  assert.equal(isComponentAllowed(selected, 'resistor'), false);
  assert.deepEqual([...selected.restrictionIds], [110, 300, 9999]);
  assert.equal(hasElectroRestriction(selected, ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked), true);

  const empty = parseElectroSpec('id=empty;components=[0]');
  assert.ok(empty.componentIds instanceof Set);
  assert.equal(empty.componentIds?.size, 0);
  assert.equal(isComponentAllowed(empty, 'battery'), false);

  assert.equal(parseElectroSpec('id=empty-list;components=[]').componentIds, null);
  assert.equal(parseElectroSpec('id=malformed;components=[nope]').componentIds, null);
  assert.equal(parseElectroSpec('id=plain;components=100').componentIds, null);
  assert.equal(parseElectroSpec('id=unbalanced;components=[100').componentIds, null);
  assert.equal(parseElectroSpec('id=mixed;components=[100;nope]').componentIds, null);
  assert.equal(parseElectroSpec('id=plain;restrictions=300').restrictionIds.size, 0);
  assert.equal(parseElectroSpec('id=unbalanced;restrictions=[300').restrictionIds.size, 0);
  assert.equal(parseElectroSpec('id=mixed;restrictions=[300;nope]').restrictionIds.size, 0);
});

test('global property lock wins over macro-only and selections are canonical', () => {
  const config = parseElectroSpec(
    'id=restricted;components=[720;100;720];restrictions=[400;110;100;9870]',
  );
  assert.deepEqual([...config.componentIds || []], [100, 720]);
  assert.deepEqual([...config.restrictionIds], [100, 400, 9870]);
  assert.equal(hasElectroRestriction(config, ELECTRO_RESTRICTIONS.componentPropertiesLocked), true);
  assert.equal(hasElectroRestriction(config, ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked), false);
  assert.deepEqual(canonicalElectroRestrictionIds([110, 100, 300]), [100, 300]);
  assert.equal(formatElectroIdSelection([]), '[0]');
  assert.equal(formatElectroIdSelection([720, 100, 720, -1]), '[100;720]');
});
