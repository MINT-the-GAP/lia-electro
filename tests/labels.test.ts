import assert from 'node:assert/strict';
import test from 'node:test';

import { renderComponentLabel } from '../src/electro/labels.ts';

test('component labels keep normal text and convert explicit TeX delimiters', () => {
  assert.equal(renderComponentLabel('Widerstand 1'), 'Widerstand 1');
  assert.equal(renderComponentLabel('$R_1$'), '\\(R_1\\)');
  assert.equal(renderComponentLabel('R_1'), '\\(R_1\\)');
  assert.equal(renderComponentLabel('220\\,\\Omega'), '\\(220\\,\\Omega\\)');
  assert.equal(renderComponentLabel('$220\\,\\Omega$'), '\\(220\\,\\Omega\\)');
  assert.equal(renderComponentLabel('220 Ω'), '\\(220\\,\\Omega\\)');
  assert.equal(renderComponentLabel('4,7 kΩ'), '\\(4{,}7\\,\\mathrm{k}\\Omega\\)');
  assert.equal(renderComponentLabel('9 V'), '\\(9\\,\\mathrm{V}\\)');
  assert.equal(renderComponentLabel('$$U = R \\cdot I$$'), '\\[U = R \\cdot I\\]');
  assert.equal(renderComponentLabel('Preis: \\$5'), 'Preis: $5');
});

test('component labels escape HTML before JSXGraph renders them as HTML text', () => {
  assert.equal(
    renderComponentLabel('<img src=x onerror="alert(1)">'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
  );
  assert.equal(renderComponentLabel('$x < 2$'), '\\(x &lt; 2\\)');
});
