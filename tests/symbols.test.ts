import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeRotation,
  rotateDirection,
  rotateVector,
  SYMBOL_BY_ID,
  SYMBOLS,
  symbolToSvg,
  type Direction,
  type Vec2,
} from '../src/electro/symbols.ts';

const EPSILON = 1e-9;

function assertPointClose(actual: Vec2, expected: Vec2, message: string): void {
  assert.ok(Math.abs(actual[0] - expected[0]) <= EPSILON, `${message}: x`);
  assert.ok(Math.abs(actual[1] - expected[1]) <= EPSILON, `${message}: y`);
}

test('catalog contains all 20 requested symbols exactly once', () => {
  const expected = [
    'battery', 'resistor', 'variable-resistor', 'capacitor', 'inductor',
    'iron-core-inductor', 'voltmeter', 'ammeter', 'motor', 'lamp', 'diode',
    'photodiode', 'led', 'voltage-source', 'switch', 'changeover-switch',
    'ground', 'antenna', 'transistor', 'transformer',
  ];
  assert.deepEqual(SYMBOLS.map((symbol) => symbol.id).sort(), expected.sort());
  assert.equal(new Set(SYMBOLS.map((symbol) => symbol.id)).size, 20);
});

test('symbols expose the expected number of unique terminals', () => {
  const specialCounts = new Map([
    ['changeover-switch', 3],
    ['ground', 1],
    ['antenna', 1],
    ['transistor', 3],
    ['transformer', 4],
  ]);
  SYMBOLS.forEach((symbol) => {
    const expected = specialCounts.get(symbol.id) ?? 2;
    assert.equal(symbol.terminals.length, expected, symbol.id);
    assert.equal(new Set(symbol.terminals.map((terminal) => terminal.id)).size, expected, symbol.id);
  });
});

test('all vector paths contain finite coordinates', () => {
  SYMBOLS.forEach((symbol) => {
    assert.ok(symbol.paths.length > 0, symbol.id);
    symbol.paths.flat().forEach(([x, y]) => {
      assert.ok(Number.isFinite(x), `${symbol.id}: x`);
      assert.ok(Number.isFinite(y), `${symbol.id}: y`);
    });
  });
});

test('all paths and terminals stay inside their declared symbol bounds', () => {
  SYMBOLS.forEach((symbol) => {
    const [minX, minY, maxX, maxY] = symbol.bounds;
    const assertInside = ([x, y]: Vec2, label: string) => {
      assert.ok(x >= minX - EPSILON && x <= maxX + EPSILON, `${symbol.id} ${label}: x`);
      assert.ok(y >= minY - EPSILON && y <= maxY + EPSILON, `${symbol.id} ${label}: y`);
    };
    symbol.paths.forEach((path, pathIndex) => path.forEach((point, pointIndex) =>
      assertInside(point, `path ${pathIndex} point ${pointIndex}`)));
    symbol.terminals.forEach((terminal) => assertInside(terminal.point, `terminal ${terminal.id}`));
  });
});

test('iron-core inductor has one continuous core line above the coil', () => {
  const coil = SYMBOL_BY_ID.inductor;
  const iron = SYMBOL_BY_ID['iron-core-inductor'];
  assert.deepEqual(iron.bounds, [-1.5, -0.45, 1.5, 0.55]);
  assert.deepEqual(iron.terminals, coil.terminals);
  assert.deepEqual(iron.paths.slice(0, coil.paths.length), coil.paths);
  assert.deepEqual(iron.paths.slice(coil.paths.length), [
    [[-0.82, 0.43], [0.82, 0.43]],
  ]);

  const svg = symbolToSvg(iron);
  assert.match(svg, /points="-0\.82,-0\.43 0\.82,-0\.43"/);
  assert.doesNotMatch(svg, /points="-0\.82,0\.43 0\.82,0\.43"/);
});

test('transformer has connected inward-facing coils, clear core lines and symmetric terminals', () => {
  const transformer = SYMBOL_BY_ID.transformer;
  assert.deepEqual(transformer.bounds, [-1.52, -1.38, 1.52, 1.38]);
  assert.deepEqual(transformer.terminals.map(({ id, point, direction }) => ({ id, point, direction })), [
    { id: 'primary-top', point: [-1.4, 1.25], direction: 'left' },
    { id: 'primary-bottom', point: [-1.4, -1.25], direction: 'left' },
    { id: 'secondary-top', point: [1.4, 1.25], direction: 'right' },
    { id: 'secondary-bottom', point: [1.4, -1.25], direction: 'right' },
  ]);
  assert.equal(transformer.paths.length, 8);

  const [primaryTop, primaryBottom, secondaryTop, secondaryBottom] = transformer.paths.slice(0, 4);
  const primaryCoil = transformer.paths[4];
  const secondaryCoil = transformer.paths[5];
  const coreLines = transformer.paths.slice(6);
  assert.equal(primaryCoil.length, 57);
  assert.equal(secondaryCoil.length, 57);

  assertPointClose(primaryTop[0], transformer.terminals[0].point, 'primary top terminal');
  assertPointClose(primaryBottom[0], transformer.terminals[1].point, 'primary bottom terminal');
  assertPointClose(secondaryTop[0], transformer.terminals[2].point, 'secondary top terminal');
  assertPointClose(secondaryBottom[0], transformer.terminals[3].point, 'secondary bottom terminal');
  assertPointClose(primaryTop[primaryTop.length - 1], primaryCoil[0], 'primary top lead');
  assertPointClose(primaryBottom[primaryBottom.length - 1], primaryCoil[primaryCoil.length - 1], 'primary bottom lead');
  assertPointClose(secondaryTop[secondaryTop.length - 1], secondaryCoil[0], 'secondary top lead');
  assertPointClose(secondaryBottom[secondaryBottom.length - 1], secondaryCoil[secondaryCoil.length - 1], 'secondary bottom lead');

  const turnBoundaryY = [0.62, 0.31, 0, -0.31, -0.62];
  turnBoundaryY.forEach((y, index) => {
    assertPointClose(primaryCoil[index * 14], [-0.45, y], `primary turn ${index}`);
    assertPointClose(secondaryCoil[index * 14], [0.45, y], `secondary turn ${index}`);
  });
  primaryCoil.forEach((point, index) => {
    const mirrored = secondaryCoil[index];
    assert.ok(point[0] >= -0.45 - EPSILON, `primary coil point ${index} bulges inward`);
    assert.ok(mirrored[0] <= 0.45 + EPSILON, `secondary coil point ${index} bulges inward`);
    assert.ok(Math.abs(point[0] + mirrored[0]) <= EPSILON, `coil point ${index}: mirrored x`);
    assert.ok(Math.abs(point[1] - mirrored[1]) <= EPSILON, `coil point ${index}: mirrored y`);
  });
  assert.deepEqual(coreLines, [
    [[-0.11, -0.76], [-0.11, 0.76]],
    [[0.11, -0.76], [0.11, 0.76]],
  ]);
});

test('four quarter turns restore vectors and directions', () => {
  let point: Vec2 = [1.25, -0.5];
  let direction: Direction = 'right';
  for (let index = 0; index < 4; index += 1) {
    point = rotateVector(point, 90);
    direction = rotateDirection(direction, 90);
  }
  assert.deepEqual(point, [1.25, -0.5]);
  assert.equal(direction, 'right');
  assert.equal(normalizeRotation(-90), 270);
  assert.equal(normalizeRotation(450), 90);
});
