import assert from 'node:assert/strict';
import test from 'node:test';

import type { ComponentModel, WireModel } from '../src/electro/model.ts';
import {
  isOrthogonalRoute,
  resolvePort,
  routeWire,
} from '../src/electro/routing.ts';

const components: ComponentModel[] = [
  { id: 'c_0001', kind: 'battery', at: [-3, 1], rotation: 0 },
  { id: 'c_0002', kind: 'resistor', at: [3, -2], rotation: 90 },
];

function makeWire(route: WireModel['route']): WireModel {
  return {
    id: 'w_0001',
    from: { componentId: 'c_0001', portId: 'b' },
    to: { componentId: 'c_0002', portId: 'a' },
    route,
  };
}

for (const route of ['horizontal-first', 'vertical-first'] as const) {
  test(`${route} produces an exact orthogonal route`, () => {
    const wire = makeWire(route);
    const points = routeWire(components, wire, 0.35);
    const from = resolvePort(components, wire.from);
    const to = resolvePort(components, wire.to);
    assert.ok(from && to);
    assert.deepEqual(points[0], from.point);
    assert.deepEqual(points.at(-1), to.point);
    assert.ok(isOrthogonalRoute(points));
    points.slice(1).forEach((point, index) => assert.notDeepEqual(point, points[index]));
  });
}

test('wire endpoint follows a rotated and moved component', () => {
  const wire = makeWire('horizontal-first');
  const before = routeWire(components, wire);
  const moved: ComponentModel[] = components.map((component) =>
    component.id === 'c_0002'
      ? { ...component, at: [5, 3], rotation: 180 }
      : component);
  const after = routeWire(moved, wire);
  const target = resolvePort(moved, wire.to);
  assert.ok(target);
  assert.notDeepEqual(before.at(-1), after.at(-1));
  assert.deepEqual(after.at(-1), target.point);
  assert.ok(isOrthogonalRoute(after));
});

test('missing references do not produce a partial cable', () => {
  const wire = makeWire('horizontal-first');
  wire.to.componentId = 'missing';
  assert.deepEqual(routeWire(components, wire), []);
});

