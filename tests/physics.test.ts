import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyCircuit, type CircuitDocument, type ComponentModel } from '../src/electro/model.ts';
import { analyzeDcCircuit, parseResistanceValue, parseVoltageValue } from '../src/electro/physics.ts';

test('physical values accept SI prefixes, decimal commas and TeX units', () => {
  assert.equal(parseVoltageValue('9 V'), 9);
  assert.equal(parseVoltageValue('250 mV'), 0.25);
  assert.equal(parseVoltageValue('$12\\,\\mathrm{V}$'), 12);
  assert.equal(parseResistanceValue('220 Ω'), 220);
  assert.equal(parseResistanceValue('4,7 kΩ'), 4700);
  assert.equal(parseResistanceValue('$4{,}7\\,\\mathrm{k}\\Omega$'), 4700);
  assert.equal(parseResistanceValue('0 Ω'), null);
  assert.equal(parseResistanceValue('12 V'), null);
});

test('one source and one resistor form a solved closed DC circuit', () => {
  const document = simpleLoop('9 V', ['220 Ω']);
  const analysis = analyzeDcCircuit(document);
  assert.equal(analysis.status, 'solved');
  assert.equal(analysis.circuits.length, 1);
  assert.ok(closeTo(analysis.circuits[0].currentA, 9 / 220));
  assert.ok(closeTo(analysis.circuits[0].equivalentResistanceOhm, 220));
  const resistor = analysis.components.find((result) => result.role === 'resistor');
  const source = analysis.components.find((result) => result.role === 'source');
  assert.ok(closeTo(Math.abs(resistor?.voltageV || 0), 9));
  assert.ok(closeTo(Math.abs(resistor?.currentA || 0), 9 / 220));
  assert.ok(closeTo((resistor?.powerW || 0) + (source?.powerW || 0), 0));
});

test('series and parallel resistor networks use nodal analysis', () => {
  const series = analyzeDcCircuit(simpleLoop('12 V', ['100 Ω', '200 Ω']));
  assert.equal(series.status, 'solved');
  assert.ok(closeTo(series.circuits[0].currentA, 0.04));
  const drops = series.components.filter((result) => result.role === 'resistor')
    .map((result) => Math.abs(result.voltageV || 0)).sort((left, right) => left - right);
  assert.ok(closeTo(drops[0], 4));
  assert.ok(closeTo(drops[1], 8));

  const parallel = analyzeDcCircuit(parallelLoop());
  assert.equal(parallel.status, 'solved');
  assert.ok(closeTo(parallel.circuits[0].currentA, 0.15));
  const currents = parallel.components.filter((result) => result.role === 'resistor')
    .map((result) => Math.abs(result.currentA || 0)).sort((left, right) => left - right);
  assert.ok(closeTo(currents[0], 0.05));
  assert.ok(closeTo(currents[1], 0.1));
});

test('open, shorted, incomplete and unsupported circuits are diagnosed', () => {
  const open = simpleLoop('9 V', ['220 Ω']);
  open.wires.pop();
  assert.equal(analyzeDcCircuit(open).status, 'open');
  assert.ok(analyzeDcCircuit(open).diagnostics.some((item) => item.code === 'open-circuit'));

  const shorted = createEmptyCircuit();
  shorted.components.push(source('c_0001', '9 V'));
  connect(shorted, 'c_0001', 'b', 'c_0001', 'a');
  assert.equal(analyzeDcCircuit(shorted).status, 'short-circuit');

  const incomplete = simpleLoop('9 V', ['']);
  assert.equal(analyzeDcCircuit(incomplete).status, 'incomplete');
  assert.ok(analyzeDcCircuit(incomplete).diagnostics.some((item) => item.code === 'missing-value'));

  const unsupported = createEmptyCircuit();
  unsupported.components.push(source('c_0001', '9 V'), component('c_0002', 'lamp'));
  connect(unsupported, 'c_0001', 'b', 'c_0002', 'a');
  connect(unsupported, 'c_0002', 'b', 'c_0001', 'a');
  assert.equal(analyzeDcCircuit(unsupported).status, 'unsupported');
  assert.ok(analyzeDcCircuit(unsupported).diagnostics.some((item) => item.componentId === 'c_0002'));

  unsupported.components.push(component('c_0003', 'motor'));
  assert.equal(analyzeDcCircuit(unsupported).diagnostics.filter((item) => item.componentId === 'c_0003').length, 0);
});

test('ideal ammeter and voltmeter report current and voltage without entering JSON', () => {
  const document = createEmptyCircuit();
  document.components.push(
    source('c_0001', '6 V'),
    resistor('c_0002', '300 Ω'),
    component('c_0003', 'ammeter'),
    component('c_0004', 'voltmeter'),
  );
  connect(document, 'c_0001', 'b', 'c_0003', 'a');
  connect(document, 'c_0003', 'b', 'c_0002', 'a');
  connect(document, 'c_0002', 'b', 'c_0001', 'a');
  connect(document, 'c_0004', 'a', 'c_0001', 'b');
  connect(document, 'c_0004', 'b', 'c_0001', 'a');
  const analysis = analyzeDcCircuit(document);
  assert.equal(analysis.status, 'solved');
  const ammeter = analysis.components.find((result) => result.role === 'ammeter');
  const voltmeter = analysis.components.find((result) => result.role === 'voltmeter');
  assert.ok(closeTo(ammeter?.currentA, 0.02));
  assert.ok(closeTo(voltmeter?.voltageV, 6));
  assert.equal(Object.prototype.hasOwnProperty.call(document.components[2], 'currentA'), false);
});

test('meter signs follow the fixed a-to-b terminal direction', () => {
  const document = createEmptyCircuit();
  document.components.push(
    source('c_0001', '6 V'),
    resistor('c_0002', '300 Ω'),
    component('c_0003', 'ammeter'),
    component('c_0004', 'voltmeter'),
  );
  connect(document, 'c_0001', 'b', 'c_0003', 'b');
  connect(document, 'c_0003', 'a', 'c_0002', 'a');
  connect(document, 'c_0002', 'b', 'c_0001', 'a');
  connect(document, 'c_0004', 'a', 'c_0001', 'a');
  connect(document, 'c_0004', 'b', 'c_0001', 'b');
  const analysis = analyzeDcCircuit(document);
  const ammeter = analysis.components.find((result) => result.role === 'ammeter');
  const voltmeter = analysis.components.find((result) => result.role === 'voltmeter');
  assert.equal(analysis.status, 'solved');
  assert.ok(closeTo(ammeter?.currentA, -0.02));
  assert.ok(closeTo(voltmeter?.voltageV, -6));
});

test('rotation changes drawing geometry but not electrical port roles', () => {
  const document = simpleLoop('9 V', ['180 Ω']);
  document.components[0].rotation = 90;
  document.components[1].rotation = 270;
  const analysis = analyzeDcCircuit(document);
  assert.equal(analysis.status, 'solved');
  assert.ok(closeTo(analysis.circuits[0].currentA, 0.05));
});

function simpleLoop(voltage: string, resistances: string[]): CircuitDocument {
  const document = createEmptyCircuit();
  document.components.push(source('c_0001', voltage));
  resistances.forEach((value, index) => document.components.push(resistor(`c_${String(index + 2).padStart(4, '0')}`, value)));
  const resistorIds = document.components.slice(1).map((item) => item.id);
  connect(document, 'c_0001', 'b', resistorIds[0], 'a');
  for (let index = 1; index < resistorIds.length; index += 1) {
    connect(document, resistorIds[index - 1], 'b', resistorIds[index], 'a');
  }
  connect(document, resistorIds[resistorIds.length - 1], 'b', 'c_0001', 'a');
  return document;
}

function parallelLoop(): CircuitDocument {
  const document = createEmptyCircuit();
  document.components.push(source('c_0001', '10 V'), resistor('c_0002', '100 Ω'), resistor('c_0003', '200 Ω'));
  for (const id of ['c_0002', 'c_0003']) {
    connect(document, 'c_0001', 'b', id, 'a');
    connect(document, id, 'b', 'c_0001', 'a');
  }
  return document;
}

function source(id: string, value: string): ComponentModel {
  return { ...component(id, 'battery'), value };
}

function resistor(id: string, value: string): ComponentModel {
  return { ...component(id, 'resistor'), value };
}

function component(id: string, kind: ComponentModel['kind']): ComponentModel {
  return { id, kind, at: [0, 0], rotation: 0 };
}

function connect(
  document: CircuitDocument,
  fromComponent: string,
  fromPort: string,
  toComponent: string,
  toPort: string,
): void {
  document.wires.push({
    id: `w_${String(document.wires.length + 1).padStart(4, '0')}`,
    from: { componentId: fromComponent, portId: fromPort },
    to: { componentId: toComponent, portId: toPort },
    route: 'horizontal-first',
  });
}

function closeTo(actual: number | undefined, expected: number, tolerance = 1e-9): boolean {
  return actual != null && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected));
}
