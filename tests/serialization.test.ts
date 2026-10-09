import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyCircuit } from '../src/electro/model.ts';
import {
  CircuitFormatError,
  parseCircuitJSON,
  stringifyCircuit,
  validateCircuit,
} from '../src/electro/serialization.ts';

test('JSON export and import are canonical and lossless', () => {
  const document = createEmptyCircuit();
  document.components.push(
    { id: 'c_0002', kind: 'resistor', at: [3, 0], rotation: 90 },
    { id: 'c_0001', kind: 'battery', at: [-3, 0], rotation: 0 },
  );
  document.wires.push({
    id: 'w_0001',
    from: { componentId: 'c_0001', portId: 'b' },
    to: { componentId: 'c_0002', portId: 'a' },
    route: 'horizontal-first',
  });
  const json = stringifyCircuit(document);
  const parsed = parseCircuitJSON(json);
  assert.equal(stringifyCircuit(parsed), json);
  assert.equal(parsed.components[0].id, 'c_0001');
});

test('legacy version 1 components without optional text stay unchanged', () => {
  const legacy = createEmptyCircuit();
  legacy.components.push({ id: 'c_0001', kind: 'resistor', at: [0, 0], rotation: 0 });

  const parsed = parseCircuitJSON(JSON.stringify(legacy));

  assert.equal(parsed.version, 1);
  assert.deepEqual(parsed.components[0], {
    id: 'c_0001',
    kind: 'resistor',
    at: [0, 0],
    rotation: 0,
  });
  assert.equal(Object.prototype.hasOwnProperty.call(parsed.components[0], 'name'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(parsed.components[0], 'value'), false);
  assert.deepEqual(JSON.parse(stringifyCircuit(parsed)), parsed);
});

test('meter reading visibility is optional, canonical and meter-only', () => {
  const document = createEmptyCircuit();
  document.components.push(
    { id: 'c_0001', kind: 'ammeter', at: [-2, 0], rotation: 0, showMeasurement: false },
    { id: 'c_0002', kind: 'voltmeter', at: [2, 0], rotation: 0, showMeasurement: true },
  );

  const parsed = parseCircuitJSON(stringifyCircuit(document));
  assert.equal(parsed.components[0].showMeasurement, false);
  assert.equal(Object.prototype.hasOwnProperty.call(parsed.components[1], 'showMeasurement'), false);
  assert.equal(stringifyCircuit(parseCircuitJSON(stringifyCircuit(parsed))), stringifyCircuit(parsed));

  for (const invalid of ['false', 0, null]) {
    assert.throws(() => validateCircuit({
      ...createEmptyCircuit(),
      components: [{
        id: 'c_0001', kind: 'ammeter', at: [0, 0], rotation: 0, showMeasurement: invalid,
      }],
    }), /showMeasurement: must be a boolean/);
  }
  assert.throws(() => validateCircuit({
    ...createEmptyCircuit(),
    components: [{
      id: 'c_0001', kind: 'resistor', at: [0, 0], rotation: 0, showMeasurement: false,
    }],
  }), /showMeasurement: is only valid for ammeters and voltmeters/);
});

test('component locking is optional, canonical and validated', () => {
  const document = createEmptyCircuit();
  document.components.push(
    { id: 'c_0001', kind: 'resistor', at: [-2, 0], rotation: 0, locked: true },
    { id: 'c_0002', kind: 'lamp', at: [2, 0], rotation: 0, locked: false },
  );

  const parsed = parseCircuitJSON(stringifyCircuit(document));
  assert.equal(parsed.components[0].locked, true);
  assert.equal(Object.prototype.hasOwnProperty.call(parsed.components[1], 'locked'), false);
  assert.match(stringifyCircuit(parsed), /"locked": true/);

  for (const invalid of ['true', 1, null]) {
    assert.throws(() => validateCircuit({
      ...createEmptyCircuit(),
      components: [{
        id: 'c_0001', kind: 'resistor', at: [0, 0], rotation: 0, locked: invalid,
      }],
    }), /locked: must be a boolean/);
  }
});

test('component origin is optional, canonical and limited to macro or editor', () => {
  const document = createEmptyCircuit();
  document.components.push(
    { id: 'c_0001', kind: 'battery', at: [-2, 0], rotation: 0, origin: 'macro' },
    { id: 'c_0002', kind: 'resistor', at: [0, 0], rotation: 0, origin: 'editor' },
    { id: 'c_0003', kind: 'lamp', at: [2, 0], rotation: 0 },
  );

  const parsed = parseCircuitJSON(stringifyCircuit(document));
  assert.equal(parsed.components[0].origin, 'macro');
  assert.equal(parsed.components[1].origin, 'editor');
  assert.equal(Object.prototype.hasOwnProperty.call(parsed.components[2], 'origin'), false);

  for (const invalid of ['user', '', false, null]) {
    assert.throws(() => validateCircuit({
      ...createEmptyCircuit(),
      components: [{
        id: 'c_0001', kind: 'battery', at: [0, 0], rotation: 0, origin: invalid,
      }],
    }), /origin: must equal macro or editor/);
  }
});

test('component name and value preserve Unicode while trimming and omitting empty text', () => {
  const document = createEmptyCircuit();
  document.components.push(
    {
      id: 'c_0001',
      kind: 'resistor',
      at: [-2, 0],
      rotation: 0,
      name: '  RΩ  ',
      value: '  47 µF  ',
    },
    {
      id: 'c_0002',
      kind: 'capacitor',
      at: [2, 0],
      rotation: 90,
      name: '   ',
      value: '',
    },
  );

  const parsed = parseCircuitJSON(stringifyCircuit(document));

  assert.equal(parsed.components[0].name, 'RΩ');
  assert.equal(parsed.components[0].value, '47 µF');
  assert.deepEqual(parsed.components[1], {
    id: 'c_0002',
    kind: 'capacitor',
    at: [2, 0],
    rotation: 90,
  });
  assert.equal(stringifyCircuit(parseCircuitJSON(stringifyCircuit(parsed))), stringifyCircuit(parsed));
});

test('component name and value reject invalid types, control characters and text over 120 characters', () => {
  const invalidCases: Array<{
    field: 'name' | 'value';
    value: unknown;
    expected: RegExp;
  }> = [
    { field: 'name', value: 42, expected: /components\[0\]\.name: must be a string/ },
    { field: 'value', value: null, expected: /components\[0\]\.value: must be a string/ },
    { field: 'name', value: 'R1\nunsafe', expected: /components\[0\]\.name: must contain a single line/ },
    { field: 'value', value: '10\u0000Ω', expected: /components\[0\]\.value: must contain a single line/ },
    { field: 'name', value: 'N'.repeat(121), expected: /components\[0\]\.name: must contain at most 120/ },
    { field: 'value', value: 'µ'.repeat(121), expected: /components\[0\]\.value: must contain at most 120/ },
  ];

  invalidCases.forEach(({ field, value, expected }) => {
    const raw = {
      ...createEmptyCircuit(),
      components: [{
        id: 'c_0001',
        kind: 'resistor',
        at: [0, 0],
        rotation: 0,
        [field]: value,
      }],
    };
    assert.throws(() => validateCircuit(raw), expected);
  });
});

test('dangling ports are rejected atomically', () => {
  const document = createEmptyCircuit();
  document.components.push({ id: 'c_0001', kind: 'battery', at: [0, 0], rotation: 0 });
  document.wires.push({
    id: 'w_0001',
    from: { componentId: 'c_0001', portId: 'a' },
    to: { componentId: 'missing', portId: 'b' },
    route: 'vertical-first',
  });
  assert.throws(() => validateCircuit(document), CircuitFormatError);
});

test('unknown symbols, invalid rotations and non-finite positions are rejected', () => {
  const base = createEmptyCircuit() as unknown as Record<string, unknown>;
  base.components = [{ id: 'c_0001', kind: 'unknown', at: [0, 0], rotation: 45 }];
  assert.throws(() => validateCircuit(base), /known symbol|rotation/);

  base.components = [{ id: 'c_0001', kind: 'battery', at: [Number.NaN, 0], rotation: 0 }];
  assert.throws(() => validateCircuit(base), /finite number/);

  base.components = [{ id: 'c_0001', kind: 'battery', at: ['0', 0], rotation: 0 }];
  assert.throws(() => validateCircuit(base), /finite number/);
});

test('malformed and oversized JSON is rejected', () => {
  assert.throws(() => parseCircuitJSON('{ nope'), CircuitFormatError);
  assert.throws(() => parseCircuitJSON(' '.repeat(1_000_001)), /character limit/);
});
