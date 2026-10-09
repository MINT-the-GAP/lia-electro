import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildElectroMacroBlock, circuitFromMacroElements, COMPONENT_MACRO_NAMES, parseComponentMacro, parseWireMacro } from '../src/electro/macros.ts';
import { ELECTRO_KNOWN_COMPONENT_IDS } from '../src/electro/config.ts';
import { createEmptyCircuit } from '../src/electro/model.ts';
import { validateCircuit } from '../src/electro/serialization.ts';
import { SYMBOLS } from '../src/electro/symbols.ts';

function macroSpec(line: string): string {
  const tick = String.fromCharCode(96);
  const start = line.indexOf(tick);
  const end = line.lastIndexOf(tick);
  assert.ok(start >= 0 && end > start, `missing macro code span: ${line}`);
  return line.slice(start + 1, end);
}

test('macro export emits every component separately and round-trips through declarations', () => {
  const circuit = createEmptyCircuit({ snapStep: 0.25, wireStub: 0.4 });
  circuit.components = SYMBOLS.map((symbol, index) => ({
    id: `c_${String(index + 1).padStart(4, '0')}`,
    kind: symbol.id,
    at: [index - 10, (index % 5) - 2],
    rotation: [0, 90, 180, 270][index % 4] as 0 | 90 | 180 | 270,
    name: index === 0 ? 'B; eins & zwei' : `$${symbol.id}_${index + 1}$`,
    value: index === 0 ? '$9\\,\\mathrm{V}$' : `${index + 1} Ω`,
    ...(symbol.id === 'resistor' ? { locked: true } : {}),
    ...(symbol.id === 'ammeter' ? { showMeasurement: false, locked: true } : {}),
  }));
  circuit.wires.push({
    id: 'w_0001',
    from: { componentId: 'c_0001', portId: 'b' },
    to: { componentId: 'c_0002', portId: 'a' },
    route: 'horizontal-first',
  });

  const block = buildElectroMacroBlock(
    circuit,
    'xmin=-10;xmax=10;ymin=-6;ymax=6;width=900;id=source;snap=0.5;stub=0.35;0;1;1',
    'de',
    'macro_demo',
  );
  const lines = block.split('\n');
  assert.equal(lines.length, SYMBOLS.length + 3);
  assert.match(lines[0], /^@Koordinatensystem\(`/);
  assert.match(lines[0], /id=macro_demo/);
  assert.doesNotMatch(lines[0], /id=source/);
  assert.match(lines[0], /snap=0.25;stub=0.4/);
  SYMBOLS.forEach((symbol, index) => {
    assert.match(lines[index + 1], new RegExp(`^@${COMPONENT_MACRO_NAMES[symbol.id].de}\\(`));
  });
  assert.match(lines[SYMBOLS.length + 1], /^@ElectroKabel\(`/);
  assert.match(lines[SYMBOLS.length + 2], /^@ElectroOn\(`/);
  assert.match(lines[1], /%3B/);
  assert.match(lines[1], /%26/);
  const resistorLine = lines[SYMBOLS.findIndex((symbol) => symbol.id === 'resistor') + 1];
  const ammeterLine = lines[SYMBOLS.findIndex((symbol) => symbol.id === 'ammeter') + 1];
  assert.match(resistorLine, /;2 Ω;;1`\)$/);
  assert.match(ammeterLine, /;0;1`\)$/);
  assert.doesNotMatch(block, /"schema"|"components"|"wires"/);

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  SYMBOLS.forEach((symbol, index) => {
    const span = dom.window.document.createElement('span');
    span.className = 'lia-electro-component-spec';
    span.dataset.kind = symbol.id;
    span.dataset.spec = macroSpec(lines[index + 1]);
    dom.window.document.body.appendChild(span);
  });
  const wire = dom.window.document.createElement('span');
  wire.className = 'lia-electro-wire-spec';
  wire.dataset.spec = macroSpec(lines[SYMBOLS.length + 1]);
  dom.window.document.body.appendChild(wire);

  const reconstructed = circuitFromMacroElements(
    dom.window.document,
    'macro_demo',
    { snapStep: 0.25, wireStub: 0.4 },
  );
  const expected = validateCircuit(circuit);
  expected.components.forEach((component) => { component.origin = 'macro'; });
  assert.deepEqual(reconstructed, expected);
  assert.equal(circuitFromMacroElements(dom.window.document, 'other_board'), null);
  dom.window.close();
});

test('English and empty exports use the expected macro frame', () => {
  const empty = createEmptyCircuit();
  assert.equal(
    buildElectroMacroBlock(empty, 'id=source', 'en', 'target'),
    '@CoordinateSystem(`id=target;snap=0.5;stub=0.35`)\n' +
      `@ElectroOn(\`id=target;snap=0.5;stub=0.35;components=[${ELECTRO_KNOWN_COMPONENT_IDS.join(';')}]\`)`,
  );
  empty.components.push({
    id: 'c_0001', kind: 'variable-resistor', at: [1, -2], rotation: 270,
  });
  assert.match(
    buildElectroMacroBlock(empty, 'id=source', 'en', 'target'),
    /@ElectroVariableResistor\(`target;c_0001;1;-2;270;;`\)/,
  );
  const legacy = parseComponentMacro('variable-resistor', 'target;c_0001;1;-2;270');
  assert.equal(Object.prototype.hasOwnProperty.call(legacy.component, 'locked'), false);
  assert.equal(legacy.component.origin, 'macro');
  empty.components[0].locked = true;
  assert.match(
    buildElectroMacroBlock(empty, 'id=source', 'en', 'target'),
    /@ElectroVariableResistor\(`target;c_0001;1;-2;270;;;;1`\)/,
  );
});

test('export profiles stay off the coordinate macro and round-trip unknown capability ids', () => {
  const empty = createEmptyCircuit();
  const preserved = buildElectroMacroBlock(
    empty,
    'xmin=-5;xmax=5;id=source;components=[100;9990];restrictions=[110;300;9870]',
    'de',
    'profiled',
  );
  const lines = preserved.split('\n');
  assert.doesNotMatch(lines[0], /components=|restrictions=/);
  assert.match(lines.at(-1) || '', /components=\[100;9990\]/);
  assert.match(lines.at(-1) || '', /restrictions=\[110;300;9870\]/);

  const overridden = buildElectroMacroBlock(
    empty,
    'id=source;components=[100];restrictions=[400]',
    'en',
    'override',
    {
      componentIds: new Set<number>(),
      restrictionIds: new Set([110, 100, 300, 9990]),
    },
  );
  assert.match(overridden, /@CoordinateSystem\(`id=override;snap=0.5;stub=0.35`\)/);
  assert.match(
    overridden,
    /@ElectroOn\(`id=override;snap=0.5;stub=0.35;components=\[0\];restrictions=\[100;300;9990\]`\)/,
  );
  assert.doesNotMatch(overridden, /restrictions=\[[^\]]*110/);
});

test('macro parsers reject malformed measurements, rotations, routes and dangling wires', () => {
  assert.throws(
    () => parseComponentMacro('resistor', 'board;c_0001;0;0;45'),
    /rotation must be 0, 90, 180 or 270/,
  );
  assert.throws(
    () => parseComponentMacro('resistor', 'board;c_0001;0;0;0;;;0'),
    /only valid for ammeters and voltmeters/,
  );
  assert.throws(
    () => parseComponentMacro('resistor', 'board;c_0001;0;0;0;;;1'),
    /only valid for ammeters and voltmeters/,
  );
  assert.throws(
    () => parseComponentMacro('ammeter', 'board;c_0001;0;0;0;;;maybe'),
    /showMeasurement must be 0, 1 or empty/,
  );
  assert.throws(
    () => parseComponentMacro('resistor', 'board;c_0001;0;0;0;;;;maybe'),
    /locked must be 0, 1 or empty/,
  );
  const unlocked = parseComponentMacro('resistor', 'board;c_0001;0;0;0;;;;0').component;
  const locked = parseComponentMacro('resistor', 'board;c_0001;0;0;0;;;;1').component;
  assert.equal(Object.prototype.hasOwnProperty.call(unlocked, 'locked'), false);
  assert.equal(locked.locked, true);
  assert.throws(
    () => parseWireMacro('board;w_0001;c_0001;a;c_0002;b;diagonal'),
    /route must be horizontal-first or vertical-first/,
  );

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const component = dom.window.document.createElement('span');
  component.className = 'lia-electro-component-spec';
  component.dataset.kind = 'battery';
  component.dataset.spec = 'board;c_0001;0;0;0;B;9 V';
  const wire = dom.window.document.createElement('span');
  wire.className = 'lia-electro-wire-spec';
  wire.dataset.spec = 'board;w_0001;c_0001;b;c_missing;a;horizontal-first';
  dom.window.document.body.append(component, wire);
  assert.throws(
    () => circuitFromMacroElements(dom.window.document, 'board'),
    /references missing component c_missing/,
  );
  dom.window.close();
});

test('README exposes every generated macro name through quoted declaration holders', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const names = new Set<string>();
  SYMBOLS.forEach((symbol) => {
    names.add(COMPONENT_MACRO_NAMES[symbol.id].de);
    names.add(COMPONENT_MACRO_NAMES[symbol.id].en);
  });
  names.forEach((name) => assert.match(readme, new RegExp(`^@${name}:`, 'm')));
  assert.match(readme, /^@ElectroKabel:/m);
  assert.match(readme, /^@ElectroWire:/m);
  assert.match(readme, /class="lia-electro-component-spec"/);
  assert.match(readme, /data-kind="@1"/);
  assert.match(readme, /data-spec="@2"/);
  assert.match(readme, /class="lia-electro-wire-spec"/);
  assert.match(readme, /data-spec="@1"/);
  assert.match(readme, /showMeasurement;locked/);
});
