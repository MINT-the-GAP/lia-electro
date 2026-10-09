import assert from 'node:assert/strict';
import test from 'node:test';

import {
  contrastRatio,
  parseCssColor,
  resolveElectroTheme,
} from '../src/electro/theme.ts';

test('CSS color parsing accepts lia-coordinate short hex and computed RGB colors', () => {
  assert.deepEqual(parseCssColor('#fff'), { red: 255, green: 255, blue: 255 });
  assert.deepEqual(parseCssColor('#000000'), { red: 0, green: 0, blue: 0 });
  assert.deepEqual(parseCssColor('rgb(6, 106, 114)'), { red: 6, green: 106, blue: 114 });
  assert.deepEqual(parseCssColor('rgb(100% 50% 0% / 80%)'), { red: 255, green: 127.5, blue: 0 });
});

test('light mode uses a light surface and a grid-independent action color', () => {
  const theme = resolveElectroTheme('#000', 'rgb(6, 106, 114)');
  assert.equal(theme.mode, 'light');
  assert.equal(theme.surface, '#ffffff');
  assert.equal(theme.foreground, '#000');
  assert.notEqual(theme.action, theme.accent);
  assert.ok(contrastRatio(theme.action, theme.surface) >= 4.5);
});

test('dark mode recognizes #fff and provides a contrasting dark surface', () => {
  const theme = resolveElectroTheme('#fff', 'rgb(6, 106, 114)');
  assert.equal(theme.mode, 'dark');
  assert.equal(theme.surface, '#151a1c');
  assert.equal(theme.foreground, '#fff');
  assert.notEqual(theme.action, theme.accent);
  assert.ok(contrastRatio(theme.foreground, theme.surface) >= 7);
  assert.ok(contrastRatio(theme.action, theme.surface) >= 4.5);
});
