import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

import { ELECTRO_COMPONENT_CAPABILITIES } from '../src/electro/config.ts';
import { ElectroController } from '../src/electro/controller.ts';
import { createEmptyCircuit } from '../src/electro/model.ts';
import { contrastRatio } from '../src/electro/theme.ts';

class FakeBoardObject {
  dataX: number[] = [];
  dataY: number[] = [];
  updateDataArray?: () => void;
  visible = true;
  readonly kind: string;
  readonly args: unknown[];
  readonly attributes: Record<string, unknown>;

  constructor(
    kind: string,
    args: unknown[],
    attributes: Record<string, unknown>,
  ) {
    this.kind = kind;
    this.args = args;
    this.attributes = attributes;
  }

  setAttribute(attributes: Record<string, unknown>): void {
    Object.assign(this.attributes, attributes);
    if (typeof attributes.visible === 'boolean') this.visible = attributes.visible;
  }

  showElement(): void { this.visible = true; }
  hideElement(): void { this.visible = false; }
  X(): number { return Number(typeof this.args[0] === 'function' ? this.args[0]() : this.args[0]); }
  Y(): number { return Number(typeof this.args[1] === 'function' ? this.args[1]() : this.args[1]); }
}

function installDom(): { dom: JSDOM; container: HTMLDivElement } {
  const dom = new JSDOM('<!doctype html><html lang="de"><head></head><body><div id="board"></div></body></html>', {
    url: 'https://example.test/',
  });
  const view = dom.window;
  Object.defineProperties(globalThis, {
    window: { value: view, configurable: true },
    document: { value: view.document, configurable: true },
    navigator: { value: view.navigator, configurable: true },
    HTMLElement: { value: view.HTMLElement, configurable: true },
    Element: { value: view.Element, configurable: true },
    Document: { value: view.Document, configurable: true },
    ShadowRoot: { value: view.ShadowRoot, configurable: true },
    getComputedStyle: { value: view.getComputedStyle.bind(view), configurable: true },
  });
  Object.defineProperty(view, 'confirm', { value: () => true, configurable: true });
  const container = view.document.getElementById('board') as HTMLDivElement;
  container.getBoundingClientRect = () => ({
    x: 0, y: 0, left: 0, top: 0, right: 800, bottom: 600,
    width: 800, height: 600, toJSON: () => ({}),
  });
  return { dom, container };
}

function fakeBoard(container: HTMLDivElement) {
  const objects: FakeBoardObject[] = [];
  return {
    containerObj: container,
    origin: { scrCoords: [1, 400, 300] },
    unitX: 40,
    unitY: 40,
    objects,
    create(kind: string, args: unknown[], attributes: Record<string, unknown>) {
      const object = new FakeBoardObject(kind, args, { ...attributes });
      objects.push(object);
      return object;
    },
    removeObject(object: FakeBoardObject) {
      const index = objects.indexOf(object);
      if (index >= 0) objects.splice(index, 1);
    },
    update() {
      objects.forEach((object) => object.updateDataArray?.());
    },
  };
}

test('controller mounts the complete palette and supports place, rotate, undo, import and cleanup', (t) => {
  const { dom, container } = installDom();
  const view = dom.window as typeof dom.window & Record<string, unknown>;
  let neutral = '#000';
  let accent = '#b41f65';
  view.__coord = {
    getNeutralColor: () => neutral,
    getAccentColor: () => accent,
  };
  view.__electroDocuments = {};
  const board = fakeBoard(container);
  const controller = new ElectroController(
    'smoke',
    board,
    'id=smoke;snap=0.5;stub=0.35',
    'de',
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const palette = container.querySelector<HTMLDivElement>('.lia-electro-palette');
  const componentsToggle = container.querySelector<HTMLButtonElement>('button[data-action="components"]');
  assert.ok(palette && componentsToggle);
  assert.equal(palette.hidden, true);
  assert.equal(componentsToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(
    container.querySelector<HTMLElement>('.lia-electro-toolbar')?.style.colorScheme,
    'light',
  );
  assert.equal(container.dataset.liaElectroMode, 'light');
  assert.equal(
    container.querySelector<HTMLElement>('.lia-electro-toolbar')?.style.getPropertyValue('--lia-electro-surface'),
    '#ffffff',
  );
  componentsToggle.click();
  assert.equal(palette.hidden, false);
  assert.equal(componentsToggle.getAttribute('aria-expanded'), 'true');
  const paletteButtons = [...container.querySelectorAll<HTMLButtonElement>('.lia-electro-palette button[data-symbol]')];
  assert.equal(paletteButtons.length, 20);
  assert.ok(paletteButtons.every((button) => button.getAttribute('aria-label')));

  const battery = container.querySelector<HTMLButtonElement>('button[data-symbol="battery"]');
  assert.ok(battery);
  battery.click();
  assert.equal(battery.getAttribute('aria-pressed'), 'true');
  assert.equal(palette.hidden, true);
  assert.equal(componentsToggle.getAttribute('aria-expanded'), 'false');
  container.dispatchEvent(new dom.window.MouseEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: 400,
    clientY: 300,
  }));
  assert.equal(controller.document.components.length, 1);
  assert.deepEqual(controller.document.components[0].at, [0, 0]);

  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'r' }));
  assert.equal(controller.document.components[0].rotation, 90);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'z', ctrlKey: true }));
  assert.equal(controller.document.components[0].rotation, 0);

  const emptyContextMenu = new dom.window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 780,
    clientY: 580,
  });
  container.dispatchEvent(emptyContextMenu);
  assert.equal(emptyContextMenu.defaultPrevented, false);

  const componentContextMenu = new dom.window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 400,
    clientY: 300,
  });
  container.dispatchEvent(componentContextMenu);
  assert.equal(componentContextMenu.defaultPrevented, true);
  const propertiesClip = container.querySelector<HTMLDivElement>('.lia-electro-properties-clip');
  const propertiesPanel = container.querySelector<HTMLDivElement>('.lia-electro-properties');
  const propertiesButton = container.querySelector<HTMLButtonElement>('button[data-action="properties"]');
  const propertiesClose = container.querySelector<HTMLButtonElement>('.lia-electro-properties-close');
  const nameInput = container.querySelector<HTMLInputElement>('.lia-electro-properties input[name="name"]');
  const valueInput = container.querySelector<HTMLInputElement>('.lia-electro-properties input[name="value"]');
  assert.ok(propertiesClip && propertiesPanel && propertiesButton && propertiesClose && nameInput && valueInput);
  assert.equal(propertiesPanel.dataset.open, '1');
  assert.equal(propertiesPanel.getAttribute('aria-hidden'), 'false');
  assert.equal(propertiesPanel.getAttribute('role'), 'dialog');
  assert.equal(propertiesPanel.getAttribute('aria-label'), 'Bauteileigenschaften');
  assert.equal(propertiesPanel.hasAttribute('aria-modal'), false);
  assert.equal(propertiesPanel.querySelector('form'), null);
  assert.equal(propertiesButton.disabled, false);
  assert.equal(propertiesButton.getAttribute('aria-expanded'), 'true');
  assert.equal(container.dataset.liaElectroPropertiesOpen, 'true');
  assert.equal(nameInput.maxLength, 120);
  assert.equal(valueInput.maxLength, 120);
  assert.equal(nameInput.tabIndex, 0);
  assert.equal(valueInput.tabIndex, 0);
  assert.equal(propertiesClose.tabIndex, 0);
  nameInput.value = ' R1 ';
  nameInput.dispatchEvent(new dom.window.FocusEvent('blur'));
  assert.equal(controller.document.components[0].name, 'R1');
  valueInput.value = '220 Ω';
  const valueEnter = new dom.window.KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Enter',
  });
  valueInput.dispatchEvent(valueEnter);
  assert.equal(valueEnter.defaultPrevented, true);
  assert.equal(propertiesPanel.dataset.open, '1');
  assert.equal(propertiesButton.getAttribute('aria-expanded'), 'true');
  assert.equal(controller.document.components[0].value, '220 Ω');
  assert.match(controller.exportJSON(), /"name": "R1"/);
  assert.match(controller.exportJSON(), /"value": "220 Ω"/);
  const batteryLabels = board.objects.filter((object) => object.kind === 'text');
  assert.equal(batteryLabels.length, 2);
  assert.ok(batteryLabels.every((object) =>
    object.attributes.display === 'html' &&
    object.attributes.parse === false &&
    object.attributes.useMathJax === true));
  const labelText = () => batteryLabels.map((object) => {
    const content = object.args[2];
    return typeof content === 'function' ? content() : content;
  });
  assert.deepEqual(labelText(), ['R1', '\\(220\\,\\Omega\\)']);

  nameInput.value = 'Entwurf';
  nameInput.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Escape',
  }));
  assert.equal(nameInput.value, 'R1');
  assert.equal(controller.document.components[0].name, 'R1');
  assert.equal(propertiesPanel.dataset.open, '1');
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
  assert.equal(propertiesPanel.dataset.open, '1');
  propertiesClose.click();
  assert.equal(propertiesPanel.dataset.open, '0');
  assert.equal(propertiesPanel.getAttribute('aria-hidden'), 'true');
  assert.equal(propertiesButton.getAttribute('aria-expanded'), 'false');
  assert.equal(container.dataset.liaElectroPropertiesOpen, undefined);
  assert.equal(nameInput.tabIndex, -1);
  assert.equal(valueInput.tabIndex, -1);
  assert.equal(propertiesClose.tabIndex, -1);

  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'z', ctrlKey: true }));
  assert.equal(controller.document.components[0].name, 'R1');
  assert.equal(controller.document.components[0].value, undefined);
  assert.deepEqual(labelText(), ['R1', '']);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'z', ctrlKey: true }));
  assert.equal(controller.document.components[0].name, undefined);
  assert.equal(controller.document.components[0].value, undefined);
  assert.deepEqual(labelText(), ['', '']);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'y', ctrlKey: true }));
  assert.equal(controller.document.components[0].name, 'R1');
  assert.equal(controller.document.components[0].value, undefined);
  assert.deepEqual(labelText(), ['R1', '']);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'y', ctrlKey: true }));
  assert.equal(controller.document.components[0].name, 'R1');
  assert.equal(controller.document.components[0].value, '220 Ω');
  assert.deepEqual(labelText(), ['R1', '\\(220\\,\\Omega\\)']);

  const reopenContextMenu = new dom.window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 400,
    clientY: 300,
  });
  container.dispatchEvent(reopenContextMenu);
  assert.equal(reopenContextMenu.defaultPrevented, true);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Escape',
  }));
  assert.equal(propertiesPanel.dataset.open, '1');
  const emptyContextMenuWhileOpen = new dom.window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 780,
    clientY: 580,
  });
  container.dispatchEvent(emptyContextMenuWhileOpen);
  assert.equal(emptyContextMenuWhileOpen.defaultPrevented, true);
  assert.equal(propertiesPanel.dataset.open, '0');
  const keyboardContextMenu = new dom.window.KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'F10',
    shiftKey: true,
  });
  container.dispatchEvent(keyboardContextMenu);
  assert.equal(keyboardContextMenu.defaultPrevented, true);
  assert.equal(propertiesPanel.dataset.open, '1');
  propertiesClose.click();
  propertiesButton.click();
  assert.equal(propertiesPanel.dataset.open, '1');
  assert.equal(nameInput.value, 'R1');
  assert.equal(valueInput.value, '220 Ω');
  propertiesClose.click();

  const resistor = container.querySelector<HTMLButtonElement>('button[data-symbol="resistor"]');
  assert.ok(resistor);
  resistor.click();
  container.dispatchEvent(new dom.window.MouseEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: 560,
    clientY: 300,
  }));
  assert.equal(controller.document.components.length, 2);

  const wireTool = container.querySelector<HTMLButtonElement>('button[data-action="wire"]');
  assert.ok(wireTool);
  wireTool.click();
  for (const clientX of [456, 504]) {
    container.dispatchEvent(new dom.window.MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX,
      clientY: 300,
    }));
  }
  assert.equal(controller.document.wires.length, 1);

  const imported = createEmptyCircuit();
  imported.components.push(
    { id: 'c_0001', kind: 'battery', at: [-2, 0], rotation: 0 },
    { id: 'c_0002', kind: 'lamp', at: [2, 0], rotation: 0 },
  );
  imported.wires.push({
    id: 'w_0001',
    from: { componentId: 'c_0001', portId: 'b' },
    to: { componentId: 'c_0002', portId: 'a' },
    route: 'horizontal-first',
  });
  controller.importJSON(JSON.stringify(imported));
  assert.equal(controller.document.components.length, 2);
  assert.equal(controller.document.wires.length, 1);
  assert.equal(
    board.objects.filter((object) => object.kind === 'curve' && object.attributes.layer === 9).length,
    2,
  );
  assert.equal(
    board.objects.filter((object) => object.kind === 'curve' && object.attributes.layer === 6).length,
    1,
  );

  neutral = '#fff';
  accent = 'rgb(6, 106, 114)';
  controller.refreshTheme();
  const themedElements = [
    container.querySelector<HTMLElement>('.lia-electro-toolbar'),
    container.querySelector<HTMLElement>('.lia-electro-palette'),
    container.querySelector<HTMLElement>('.lia-electro-status'),
    container.querySelector<HTMLElement>('.lia-electro-object-list-clip'),
    container.querySelector<HTMLElement>('.lia-electro-properties-clip'),
    container.querySelector<HTMLElement>('.lia-electro-dialog-backdrop'),
  ];
  themedElements.forEach((element) => {
    assert.ok(element);
    assert.equal(element.dataset.liaElectroMode, 'dark');
    assert.equal(element.style.colorScheme, 'dark');
    assert.equal(element.style.getPropertyValue('--lia-electro-neutral'), '#fff');
    assert.equal(element.style.getPropertyValue('--lia-electro-surface'), '#151a1c');
    assert.ok(contrastRatio(
      element.style.getPropertyValue('--lia-electro-action'),
      element.style.getPropertyValue('--lia-electro-surface'),
    ) >= 4.5);
  });
  assert.equal(container.dataset.liaElectroMode, 'dark');
  assert.equal(dom.window.getComputedStyle(container.querySelector('.lia-electro-status')!).fontSize, '14px');
  assert.equal(dom.window.getComputedStyle(container.querySelector('.lia-electro-status')!).right, '36px');
  const darkAction = themedElements[0]!.style.getPropertyValue('--lia-electro-action');
  assert.ok(board.objects
    .filter((object) => object.kind === 'curve' && object.attributes.layer === 9)
    .every((object) => object.attributes.strokeColor === '#fff' && Number(object.attributes.strokeWidth) >= 3));
  assert.ok(board.objects
    .filter((object) => object.kind === 'point' && object.attributes.layer === 12)
    .every((object) => object.attributes.strokeColor === darkAction && object.attributes.fillColor === '#151a1c'));
  assert.ok(board.objects
    .filter((object) => object.kind === 'curve' && object.attributes.layer === 6)
    .every((object) => object.attributes.strokeColor === '#fff'));
  assert.ok(board.objects
    .filter((object) => object.kind === 'text' && object.attributes.layer === 10)
    .every((object) => object.attributes.strokeColor === '#fff'));

  controller.destroy();
  assert.equal(container.querySelector('.lia-electro-toolbar'), null);
  assert.equal(container.querySelector('.lia-electro-palette'), null);
  assert.equal(container.querySelector('.lia-electro-status'), null);
  assert.equal(container.querySelector('.lia-electro-object-list-clip'), null);
  assert.equal(container.querySelector('.lia-electro-properties-clip'), null);
  assert.equal(container.querySelector('.lia-electro-dialog-backdrop'), null);
  assert.equal(container.dataset.liaElectroUid, undefined);
  assert.equal(container.dataset.liaElectroBoard, undefined);
  assert.equal(container.dataset.liaElectroMode, undefined);
  assert.equal(container.dataset.liaElectroObjectListOpen, undefined);
  assert.equal(container.style.getPropertyValue('--lia-electro-object-list-inset'), '');
  assert.equal(container.style.getPropertyValue('--lia-electro-right-inset'), '');
  assert.equal(board.objects.length, 0);
  const contextMenuAfterDestroy = new dom.window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 400,
    clientY: 300,
  });
  container.dispatchEvent(contextMenuAfterDestroy);
  assert.equal(contextMenuAfterDestroy.defaultPrevented, false);
});

test('DGS-style Fixieren blocks dragging and rotation while remaining undoable and deletable', (t) => {
  const { dom, container } = installDom();
  const view = dom.window as typeof dom.window & Record<string, any>;
  view.__coord = {
    getNeutralColor: () => '#172033',
    getAccentColor: () => '#b41f65',
  };
  view.__electroDocuments = {};
  const initial = createEmptyCircuit();
  initial.components.push({
    id: 'c_0001', kind: 'resistor', at: [0, 0], rotation: 0, name: '$R_1$', value: '220 Ω',
  });
  const controller = new ElectroController(
    'component-lock',
    fakeBoard(container),
    'id=component-lock;snap=0.5;stub=0.35',
    'de',
    initial,
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const dispatchPointer = (type: string, clientX: number, clientY: number) => {
    container.dispatchEvent(new dom.window.MouseEvent(type, {
      bubbles: true, cancelable: true, button: 0, clientX, clientY,
    }));
  };
  container.dispatchEvent(new dom.window.MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, clientX: 400, clientY: 300,
  }));
  const lockField = container.querySelector<HTMLLabelElement>('.lia-electro-lock-field');
  const lockInput = container.querySelector<HTMLInputElement>('input[name="locked"]');
  const rotate = container.querySelector<HTMLButtonElement>('button[data-action="rotate"]');
  const close = container.querySelector<HTMLButtonElement>('.lia-electro-properties-close');
  const status = container.querySelector<HTMLElement>('.lia-electro-status');
  assert.ok(lockField && lockInput && rotate && close && status);
  assert.match(lockField.textContent || '', /Fixieren/);
  assert.equal(lockInput.checked, false);
  assert.equal(lockInput.disabled, false);
  assert.equal(lockInput.tabIndex, 0);

  lockInput.checked = true;
  lockInput.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(controller.document.components[0].locked, true);
  assert.equal(rotate.disabled, true);
  assert.match(status.textContent || '', /fixiert/i);
  assert.match(controller.exportJSON(), /"locked": true/);
  assert.match(
    controller.exportMacros('fixed_macro'),
    /@ElectroWiderstand\(`fixed_macro;c_0001;0;0;0;\$R_1\$;220 Ω;;1`\)/,
  );

  controller.undo();
  assert.equal(Object.prototype.hasOwnProperty.call(controller.document.components[0], 'locked'), false);
  assert.equal(lockInput.checked, false);
  assert.equal(container.querySelector<HTMLElement>('.lia-electro-properties')?.dataset.open, '0');
  assert.equal(rotate.disabled, true);
  controller.redo();
  assert.equal(controller.document.components[0].locked, true);
  assert.equal(lockInput.checked, false);
  assert.equal(rotate.disabled, true);
  container.dispatchEvent(new dom.window.MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, clientX: 400, clientY: 300,
  }));
  assert.equal(lockInput.checked, true);
  assert.equal(rotate.disabled, true);

  close.click();
  assert.equal(lockInput.tabIndex, -1);
  dispatchPointer('pointerdown', 400, 300);
  dispatchPointer('pointermove', 480, 300);
  dispatchPointer('pointerup', 480, 300);
  assert.deepEqual(controller.document.components[0].at, [0, 0]);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'r' }));
  assert.equal(controller.document.components[0].rotation, 0);

  container.dispatchEvent(new dom.window.MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, clientX: 400, clientY: 300,
  }));
  assert.equal(lockInput.checked, true);
  lockInput.checked = false;
  lockInput.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(Object.prototype.hasOwnProperty.call(controller.document.components[0], 'locked'), false);
  assert.equal(rotate.disabled, false);
  close.click();

  dispatchPointer('pointerdown', 400, 300);
  dispatchPointer('pointermove', 480, 300);
  dispatchPointer('pointerup', 480, 300);
  assert.deepEqual(controller.document.components[0].at, [2, 0]);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'r' }));
  assert.equal(controller.document.components[0].rotation, 90);

  container.dispatchEvent(new dom.window.MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, clientX: 480, clientY: 300,
  }));
  lockInput.checked = true;
  lockInput.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  close.click();
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }));
  assert.equal(controller.document.components.length, 0);
});

test('properties panel reports live DC values for a closed source-resistor circuit', (t) => {
  const { dom, container } = installDom();
  const view = dom.window as typeof dom.window & Record<string, any>;
  view.__coord = {
    getNeutralColor: () => '#172033',
    getAccentColor: () => '#b41f65',
  };
  view.__electroDocuments = {};
  const board = fakeBoard(container);
  const initial = createEmptyCircuit();
  initial.components.push(
    { id: 'c_0001', kind: 'battery', at: [-2, 0], rotation: 0, name: '$B_1$', value: '9 V' },
    { id: 'c_0002', kind: 'resistor', at: [2, 0], rotation: 0, name: '$R_1$', value: '220 Ω' },
  );
  initial.wires.push(
    {
      id: 'w_0001',
      from: { componentId: 'c_0001', portId: 'b' },
      to: { componentId: 'c_0002', portId: 'a' },
      route: 'horizontal-first',
    },
    {
      id: 'w_0002',
      from: { componentId: 'c_0002', portId: 'b' },
      to: { componentId: 'c_0001', portId: 'a' },
      route: 'vertical-first',
    },
  );
  const controller = new ElectroController(
    'physics-panel',
    board,
    'id=physics-panel;snap=0.5;stub=0.35',
    'de',
    initial,
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  assert.equal(controller.analyzeDC().status, 'solved');
  assert.match(container.querySelector('.lia-electro-status')?.textContent || '', /Geschlossener Stromkreis/);
  const resistorContextMenu = new dom.window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 480,
    clientY: 300,
  });
  container.dispatchEvent(resistorContextMenu);
  assert.equal(resistorContextMenu.defaultPrevented, true);
  const physicsStatus = container.querySelector<HTMLElement>('.lia-electro-physics-status');
  const physicsValues = container.querySelector<HTMLDListElement>('.lia-electro-physics-values');
  const valueLabel = container.querySelector<HTMLElement>('[data-role="properties-value-label"]');
  const valueInput = container.querySelector<HTMLInputElement>('.lia-electro-properties input[name="value"]');
  assert.ok(physicsStatus && physicsValues && valueLabel && valueInput);
  assert.equal(physicsStatus.dataset.status, 'solved');
  assert.match(physicsStatus.textContent || '', /Geschlossener Stromkreis/);
  assert.equal(valueLabel.textContent, 'Widerstand R');
  assert.match(physicsValues.textContent || '', /40,9\s*mA/);
  assert.match(physicsValues.textContent || '', /220\s*Ω/);

  valueInput.value = '12 V';
  valueInput.dispatchEvent(new dom.window.FocusEvent('blur'));
  assert.equal(controller.analyzeDC().status, 'incomplete');
  assert.equal(valueInput.getAttribute('aria-invalid'), 'true');
  assert.match(physicsStatus.textContent || '', /gültiger elektrischer Wert/);

  valueInput.value = '$180\\,\\Omega$';
  valueInput.dispatchEvent(new dom.window.FocusEvent('blur'));
  assert.equal(valueInput.getAttribute('aria-invalid'), 'false');
  assert.equal(controller.document.components[1].value, '$180\\,\\Omega$');
  assert.ok(Math.abs((controller.analyzeDC().circuits[0].currentA || 0) - 0.05) < 1e-10);
  assert.match(physicsValues.textContent || '', /50\s*mA/);
  assert.doesNotMatch(controller.exportJSON(), /currentA|voltageV|powerW/);

  const renderedLabels = board.objects.filter((object) => object.kind === 'text');
  const renderedText = renderedLabels.map((object) => {
    const content = object.args[2];
    return typeof content === 'function' ? content() : content;
  });
  assert.ok(renderedText.includes('\\(R_1\\)'));
  assert.ok(renderedText.includes('\\(180\\,\\Omega\\)'));

  container.dispatchEvent(new dom.window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 320,
    clientY: 300,
  }));
  assert.equal(valueLabel.textContent, 'Quellspannung U');
  assert.equal(valueInput.value, '9 V');
});

test('ammeter and voltmeter show live computed readings at their symbols', (t) => {
  const { dom, container } = installDom();
  const view = dom.window as typeof dom.window & Record<string, any>;
  view.__coord = {
    getNeutralColor: () => '#172033',
    getAccentColor: () => '#b41f65',
  };
  view.__electroDocuments = {};
  const board = fakeBoard(container);
  const initial = createEmptyCircuit();
  initial.components.push(
    { id: 'c_0001', kind: 'battery', at: [-4, 0], rotation: 0, name: '$B_1$', value: '6.00 V' },
    { id: 'c_0002', kind: 'resistor', at: [0, 0], rotation: 0, name: '$R_1$', value: '300 Ω' },
    { id: 'c_0003', kind: 'ammeter', at: [4, 0], rotation: 0, name: '$A_1$', value: '999 A' },
    { id: 'c_0004', kind: 'voltmeter', at: [0, 3], rotation: 0, name: '$V_1$', value: '999 V' },
  );
  initial.wires.push(
    {
      id: 'w_0001',
      from: { componentId: 'c_0001', portId: 'b' },
      to: { componentId: 'c_0003', portId: 'a' },
      route: 'horizontal-first',
    },
    {
      id: 'w_0002',
      from: { componentId: 'c_0003', portId: 'b' },
      to: { componentId: 'c_0002', portId: 'a' },
      route: 'horizontal-first',
    },
    {
      id: 'w_0003',
      from: { componentId: 'c_0002', portId: 'b' },
      to: { componentId: 'c_0001', portId: 'a' },
      route: 'horizontal-first',
    },
    {
      id: 'w_0004',
      from: { componentId: 'c_0004', portId: 'a' },
      to: { componentId: 'c_0001', portId: 'b' },
      route: 'vertical-first',
    },
    {
      id: 'w_0005',
      from: { componentId: 'c_0004', portId: 'b' },
      to: { componentId: 'c_0001', portId: 'a' },
      route: 'vertical-first',
    },
  );
  const controller = new ElectroController(
    'meter-labels',
    board,
    'id=meter-labels;snap=0.5;stub=0.35',
    'de',
    initial,
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const labelCallbacks = board.objects
    .filter((object) => object.kind === 'text' && object.attributes.layer === 10)
    .map((object) => object.args[2])
    .filter((content): content is () => unknown => typeof content === 'function');
  const ammeterLabel = labelCallbacks.find((content) => content() === '\\(20\\,\\mathrm{mA}\\)');
  const voltmeterLabel = labelCallbacks.find((content) => content() === '\\(6\\,\\mathrm{V}\\)');
  assert.ok(ammeterLabel && voltmeterLabel);
  assert.equal(labelCallbacks.some((content) => content() === '\\(999\\,\\mathrm{A}\\)'), false);
  assert.equal(labelCallbacks.some((content) => content() === '\\(999\\,\\mathrm{V}\\)'), false);

  const ammeterContextMenu = new dom.window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 560,
    clientY: 300,
  });
  container.dispatchEvent(ammeterContextMenu);
  assert.equal(ammeterContextMenu.defaultPrevented, true);
  const measurementField = container.querySelector<HTMLLabelElement>('.lia-electro-measurement-field');
  const measurementInput = container.querySelector<HTMLInputElement>('input[name="showMeasurement"]');
  assert.ok(measurementField && measurementInput);
  assert.equal(measurementField.hidden, false);
  assert.equal(measurementInput.checked, true);
  assert.equal(measurementInput.disabled, false);
  assert.equal(measurementInput.tabIndex, 0);
  assert.match(measurementField.textContent || '', /Messwert.*Symbol anzeigen/);

  measurementInput.checked = false;
  measurementInput.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const hiddenAmmeter = controller.document.components.find((component) => component.id === 'c_0003');
  assert.equal(hiddenAmmeter?.showMeasurement, false);
  assert.match(controller.exportJSON(), /"showMeasurement": false/);
  assert.equal(ammeterLabel(), '');
  assert.equal(voltmeterLabel(), '\\(6\\,\\mathrm{V}\\)');

  controller.undo();
  const restoredAmmeter = controller.document.components.find((component) => component.id === 'c_0003');
  assert.equal(Object.prototype.hasOwnProperty.call(restoredAmmeter, 'showMeasurement'), false);
  assert.equal(ammeterLabel(), '\\(20\\,\\mathrm{mA}\\)');

  controller.redo();
  assert.equal(controller.document.components.find((component) => component.id === 'c_0003')?.showMeasurement, false);
  assert.equal(ammeterLabel(), '');

  container.dispatchEvent(new dom.window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 560,
    clientY: 300,
  }));
  assert.equal(measurementInput.checked, false);
  measurementInput.checked = true;
  measurementInput.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const visibleAmmeter = controller.document.components.find((component) => component.id === 'c_0003');
  assert.equal(Object.prototype.hasOwnProperty.call(visibleAmmeter, 'showMeasurement'), false);
  assert.doesNotMatch(controller.exportJSON(), /showMeasurement/);
  assert.equal(ammeterLabel(), '\\(20\\,\\mathrm{mA}\\)');

  const changedResistance = controller.document;
  changedResistance.components.find((component) => component.id === 'c_0002')!.value = '600 Ω';
  controller.importJSON(JSON.stringify(changedResistance));
  assert.equal(ammeterLabel(), '\\(10\\,\\mathrm{mA}\\)');
  assert.equal(voltmeterLabel(), '\\(6\\,\\mathrm{V}\\)');

  const openCircuit = controller.document;
  openCircuit.wires = openCircuit.wires.filter((wire) => wire.id !== 'w_0003');
  controller.importJSON(JSON.stringify(openCircuit));
  assert.equal(ammeterLabel(), '');
  assert.equal(voltmeterLabel(), '');
  assert.doesNotMatch(controller.exportJSON(), /currentA|voltageV|powerW/);
});

test('DGS-style object list selects objects and exports LiaScript macros', (t) => {
  const { dom, container } = installDom();
  const view = dom.window as typeof dom.window & Record<string, any>;
  view.__coord = {
    getNeutralColor: () => '#172033',
    getAccentColor: () => '#b41f65',
  };
  view.__electroDocuments = {};
  let downloadedName = '';
  let downloadedBlob: Blob | null = null;
  let revokedUrl = '';
  Object.defineProperty(view.URL, 'createObjectURL', {
    configurable: true,
    value: (blob: Blob) => {
      downloadedBlob = blob;
      return 'blob:electro-test';
    },
  });
  Object.defineProperty(view.URL, 'revokeObjectURL', {
    configurable: true,
    value: (url: string) => { revokedUrl = url; },
  });
  Object.defineProperty(view.HTMLAnchorElement.prototype, 'click', {
    configurable: true,
    value(this: HTMLAnchorElement) { downloadedName = this.download; },
  });

  const initial = createEmptyCircuit();
  initial.components.push(
    { id: 'c_0001', kind: 'battery', at: [-2, 0], rotation: 0, name: '$B_1$', value: '9 V' },
    { id: 'c_0002', kind: 'resistor', at: [2, 0], rotation: 0, name: '$R_1$', value: '220 Ω' },
  );
  initial.wires.push({
    id: 'w_0001',
    from: { componentId: 'c_0001', portId: 'b' },
    to: { componentId: 'c_0002', portId: 'a' },
    route: 'horizontal-first',
  });
  const controller = new ElectroController(
    'object-list',
    fakeBoard(container),
    'id=object-list;snap=0.5;stub=0.35',
    'de',
    initial,
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const toggle = container.querySelector<HTMLButtonElement>('button[data-action="objectList"]');
  const panel = container.querySelector<HTMLElement>('.lia-electro-object-list-panel');
  const close = container.querySelector<HTMLButtonElement>('.lia-electro-object-list-close');
  const footer = container.querySelector<HTMLButtonElement>('.lia-electro-object-list-export');
  assert.ok(toggle && panel && close && footer);
  assert.equal(footer.getAttribute('aria-haspopup'), 'dialog');
  const controlledDialog = dom.window.document.getElementById(footer.getAttribute('aria-controls') || '');
  assert.ok(controlledDialog);
  assert.equal(controlledDialog.getAttribute('role'), 'dialog');
  assert.equal(controlledDialog.getAttribute('aria-modal'), 'true');
  assert.ok(dom.window.document.getElementById(controlledDialog.getAttribute('aria-labelledby') || ''));
  assert.ok(dom.window.document.getElementById(controlledDialog.getAttribute('aria-describedby') || ''));
  assert.equal(panel.getAttribute('role'), 'complementary');
  assert.equal(panel.dataset.open, '0');
  assert.equal(panel.getAttribute('aria-hidden'), 'true');
  assert.equal(panel.inert, true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(footer.tabIndex, -1);

  toggle.click();
  assert.equal(panel.dataset.open, '1');
  assert.equal(panel.getAttribute('aria-hidden'), 'false');
  assert.equal(panel.inert, false);
  assert.equal(toggle.getAttribute('aria-pressed'), 'true');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(container.dataset.liaElectroObjectListOpen, 'true');
  assert.equal(container.style.getPropertyValue('--lia-electro-object-list-inset'), '170px');
  assert.equal(container.style.getPropertyValue('--lia-electro-right-inset'), '170px');
  const entries = [...panel.querySelectorAll<HTMLButtonElement>('button[data-object-key]')];
  assert.equal(entries.length, 3);
  assert.equal(panel.querySelectorAll('[role="listitem"]').length, 3);
  const resistorEntry = panel.querySelector<HTMLButtonElement>('[data-object-key="component:c_0002"]');
  const wireEntry = panel.querySelector<HTMLButtonElement>('[data-object-key="wire:w_0001"]');
  assert.ok(resistorEntry && wireEntry);
  assert.match(resistorEntry.textContent || '', /R_1/);
  assert.doesNotMatch(resistorEntry.textContent || '', /\$/);
  assert.match(wireEntry.textContent || '', /Kabel 1/);

  resistorEntry.click();
  const properties = container.querySelector<HTMLElement>('.lia-electro-properties');
  const propertiesClose = container.querySelector<HTMLButtonElement>('.lia-electro-properties-close');
  assert.ok(properties && propertiesClose);
  assert.equal(panel.dataset.open, '1');
  assert.equal(properties.dataset.open, '1');
  assert.equal(resistorEntry.getAttribute('aria-current'), 'true');
  assert.equal(container.style.getPropertyValue('--lia-electro-right-inset'), '360px');
  propertiesClose.click();
  assert.equal(properties.dataset.open, '0');
  assert.equal(dom.window.document.activeElement, resistorEntry);

  wireEntry.click();
  assert.equal(wireEntry.getAttribute('aria-current'), 'true');
  assert.equal(resistorEntry.hasAttribute('aria-current'), false);
  footer.click();
  const backdrop = container.querySelector<HTMLDivElement>('.lia-electro-dialog-backdrop');
  const componentsStep = container.querySelector<HTMLDivElement>('.lia-electro-export-components-step');
  const quizStep = container.querySelector<HTMLDivElement>('.lia-electro-export-quiz-step');
  const macroStep = container.querySelector<HTMLDivElement>('.lia-electro-export-macro-step');
  const textarea = container.querySelector<HTMLTextAreaElement>('.lia-electro-dialog textarea');
  const copy = container.querySelector<HTMLButtonElement>('[data-dialog-action="copy"]');
  const back = container.querySelector<HTMLButtonElement>('[data-dialog-action="back"]');
  const download = container.querySelector<HTMLButtonElement>('[data-dialog-action="download"]');
  const dialogClose = container.querySelector<HTMLButtonElement>('[data-dialog-action="close"]');
  const componentChoices = [...container.querySelectorAll<HTMLButtonElement>('.lia-electro-export-component[data-component-kind]')];
  const resistorChoice = container.querySelector<HTMLButtonElement>('.lia-electro-export-component[data-component-kind="resistor"]');
  const transformerChoice = container.querySelector<HTMLButtonElement>('.lia-electro-export-component[data-component-kind="transformer"]');
  const restrictAll = container.querySelector<HTMLInputElement>('input[data-restriction-id="100"]');
  const restrictMacro = container.querySelector<HTMLInputElement>('input[data-restriction-id="110"]');
  const restrictBaseline = container.querySelector<HTMLInputElement>('input[data-restriction-id="120"]');
  const restrictMeasurements = container.querySelector<HTMLInputElement>('input[data-restriction-id="300"]');
  const restrictExport = container.querySelector<HTMLInputElement>('input[data-restriction-id="400"]');
  const quizEnabled = container.querySelector<HTMLInputElement>('.lia-electro-export-quiz-toggle input');
  const quizFields = container.querySelector<HTMLElement>('[data-role="dialog-quiz-fields"]');
  const quizCondition = container.querySelector<HTMLSelectElement>('select[name="completion-condition"]');
  const quizTarget = container.querySelector<HTMLInputElement>('input[name="completion-target"]');
  const quizTolerance = container.querySelector<HTMLInputElement>('input[name="completion-tolerance"]');
  const requiredResistor = container.querySelector<HTMLInputElement>('input[data-required-kind="resistor"]');
  const requiredResistorCount = container.querySelector<HTMLInputElement>('input[data-required-kind-count="resistor"]');
  assert.ok(
    backdrop && componentsStep && quizStep && macroStep && textarea && copy && back && download && dialogClose &&
    resistorChoice && transformerChoice && restrictAll && restrictMacro && restrictBaseline &&
    restrictMeasurements && restrictExport && quizEnabled && quizFields && quizCondition &&
    quizTarget && quizTolerance && requiredResistor && requiredResistorCount,
  );
  assert.equal(backdrop.hidden, false);
  assert.equal(backdrop.getAttribute('aria-hidden'), 'false');
  assert.equal(footer.getAttribute('aria-expanded'), 'true');
  assert.equal(textarea.readOnly, true);
  assert.equal(container.querySelector('[data-dialog-action="import"]'), null);
  assert.equal(componentsStep.hidden, false);
  assert.equal(componentsStep.inert, false);
  assert.equal(quizStep.hidden, true);
  assert.equal(quizStep.inert, true);
  assert.equal(macroStep.hidden, true);
  assert.equal(macroStep.inert, true);
  assert.equal(textarea.tabIndex, -1);
  assert.equal(copy.textContent, 'Weiter');
  assert.equal(back.hidden, true);
  assert.equal(download.hidden, true);
  assert.equal(componentChoices.length, 20);
  assert.ok(componentChoices.every((button) =>
    button.dataset.enabled === '1' &&
    button.getAttribute('aria-pressed') === 'true' &&
    button.getAttribute('aria-label')?.includes('verf\u00fcgbar') &&
    Number(button.dataset.componentId) === ELECTRO_COMPONENT_CAPABILITIES[button.dataset.componentKind as keyof typeof ELECTRO_COMPONENT_CAPABILITIES],
  ));

  transformerChoice.click();
  resistorChoice.click();
  assert.equal(transformerChoice.dataset.enabled, '0');
  assert.equal(transformerChoice.getAttribute('aria-pressed'), 'false');
  assert.equal(transformerChoice.querySelector('.lia-electro-export-component-status')?.textContent, '\u00d7');
  assert.equal(resistorChoice.dataset.enabled, '0');
  restrictAll.click();
  assert.equal(restrictAll.checked, true);
  restrictMacro.click();
  assert.equal(restrictAll.checked, false);
  assert.equal(restrictMacro.checked, true);
  restrictMeasurements.click();
  restrictExport.click();

  copy.click();
  assert.equal(componentsStep.hidden, true);
  assert.equal(componentsStep.inert, true);
  assert.equal(quizStep.hidden, false);
  assert.equal(quizStep.inert, false);
  assert.equal(macroStep.hidden, true);
  assert.equal(macroStep.inert, true);
  assert.equal(textarea.tabIndex, -1);
  assert.equal(copy.textContent, 'Weiter');
  assert.equal(back.hidden, false);
  assert.equal(download.hidden, true);
  assert.equal(quizEnabled.checked, false);
  assert.equal(quizFields.getAttribute('aria-disabled'), 'true');
  assert.equal(quizCondition.disabled, true);
  assert.equal(requiredResistor.disabled, true);

  quizEnabled.click();
  assert.equal(quizEnabled.checked, true);
  assert.equal(quizFields.getAttribute('aria-disabled'), 'false');
  quizCondition.value = 'total-current';
  quizCondition.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  quizTarget.value = '20 mA';
  quizTolerance.value = '0.5 mA';
  requiredResistor.click();
  requiredResistorCount.value = '1';
  assert.equal(requiredResistor.checked, true);
  assert.equal(requiredResistorCount.disabled, false);

  copy.click();
  assert.equal(quizStep.hidden, true);
  assert.equal(quizStep.inert, true);
  assert.equal(macroStep.hidden, false);
  assert.equal(macroStep.inert, false);
  assert.equal(textarea.tabIndex, 0);
  assert.equal(copy.textContent, 'Kopieren');
  assert.equal(download.hidden, false);
  assert.match(textarea.value, /^@Koordinatensystem\(`/);
  assert.match(textarea.value, /\n@ElectroBatterie\(`/);
  assert.match(textarea.value, /\n@ElectroWiderstand\(`/);
  assert.match(textarea.value, /\n@ElectroKabel\(`/);
  assert.match(textarea.value, /\n@ElectroOn\(`/);
  assert.match(textarea.value, /\n@ElectroErgaenzungsquiz\(`/);
  assert.doesNotMatch(textarea.value.split('\n')[0], /components=|restrictions=/);
  const electroOnLine = textarea.value.split('\n').find((line) => line.startsWith('@ElectroOn(')) || '';
  assert.match(electroOnLine, /components=\[100;110;200;210;220;230;240;300;310;320;400;410;500;510;600;610;700;710;800\]/);
  assert.match(electroOnLine, /restrictions=\[110;120;300;400\]/);
  const quizLine = textarea.value.split('\n').at(-1) || '';
  assert.match(
    quizLine,
    /condition=total-current;target=0\.02;tolerance=0\.0005;required=\[resistor:1\];preserve=1;changed=1/,
  );
  assert.equal(resistorChoice.dataset.enabled, '1');
  assert.doesNotMatch(textarea.value, /"schema"|"components"|"wires"/);
  const fixedExport = controller.exportMacros('macro_test');
  assert.match(fixedExport, /id=macro_test/);
  assert.match(fixedExport, /@ElectroBatterie\(`macro_test;c_0001;-2;0;0;\$B_1\$;9 V`\)/);

  back.click();
  assert.equal(quizStep.hidden, false);
  assert.equal(macroStep.hidden, true);
  assert.equal(quizEnabled.checked, true);
  assert.equal(quizCondition.value, 'total-current');
  assert.equal(quizTarget.value, '20 mA');
  assert.equal(quizTolerance.value, '0.5 mA');
  assert.equal(requiredResistor.checked, true);
  assert.equal(requiredResistorCount.value, '1');
  back.click();
  assert.equal(componentsStep.hidden, false);
  assert.equal(quizStep.hidden, true);
  assert.equal(transformerChoice.dataset.enabled, '0');
  assert.equal(resistorChoice.dataset.enabled, '1');
  assert.equal(restrictAll.checked, false);
  assert.equal(restrictMacro.checked, true);
  assert.equal(restrictBaseline.checked, true);
  assert.equal(restrictMeasurements.checked, true);
  assert.equal(restrictExport.checked, true);
  copy.click();
  assert.equal(quizStep.hidden, false);
  quizEnabled.click();
  assert.equal(quizEnabled.checked, false);
  assert.equal(quizFields.getAttribute('aria-disabled'), 'true');
  copy.click();
  assert.equal(macroStep.hidden, false);
  assert.doesNotMatch(textarea.value, /@ElectroErgaenzungsquiz\(/);

  copy.focus();
  const forwardTab = new dom.window.KeyboardEvent('keydown', {
    bubbles: true, cancelable: true, key: 'Tab',
  });
  copy.dispatchEvent(forwardTab);
  assert.equal(forwardTab.defaultPrevented, true);
  assert.equal(dom.window.document.activeElement, textarea);
  textarea.focus();
  const backwardTab = new dom.window.KeyboardEvent('keydown', {
    bubbles: true, cancelable: true, key: 'Tab', shiftKey: true,
  });
  textarea.dispatchEvent(backwardTab);
  assert.equal(backwardTab.defaultPrevented, true);
  assert.equal(dom.window.document.activeElement, copy);
  download.click();
  assert.equal(downloadedName, 'object-list.lia.md');
  assert.ok(downloadedBlob);
  assert.equal(downloadedBlob.type, 'text/markdown;charset=utf-8');
  dialogClose.click();
  assert.equal(backdrop.hidden, true);
  assert.equal(backdrop.getAttribute('aria-hidden'), 'true');
  assert.equal(footer.getAttribute('aria-expanded'), 'false');
  assert.equal(dom.window.document.activeElement, footer);

  footer.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Escape',
  }));
  assert.equal(panel.dataset.open, '0');
  assert.equal(panel.getAttribute('aria-hidden'), 'true');
  assert.equal(panel.inert, true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(dom.window.document.activeElement, toggle);
  dom.window.dispatchEvent(new dom.window.Event('load'));
  return new Promise<void>((resolve) => dom.window.setTimeout(() => {
    assert.equal(revokedUrl, 'blob:electro-test');
    resolve();
  }, 0));
});

test('component labels move beside visually vertical symbols', (t) => {
  const { dom, container } = installDom();
  const view = dom.window as typeof dom.window & Record<string, any>;
  view.__coord = {
    getNeutralColor: () => '#172033',
    getAccentColor: () => '#b41f65',
  };
  view.__electroDocuments = {};
  const board = fakeBoard(container);
  const initial = createEmptyCircuit();
  initial.components.push({
    id: 'c_0001',
    kind: 'resistor',
    at: [1.5, -2],
    rotation: 0,
    name: '$R_1$',
    value: '220 Ω',
  });
  const controller = new ElectroController(
    'rotated-labels',
    board,
    'id=rotated-labels;snap=0.5;stub=0.35',
    'de',
    initial,
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const labels = board.objects.filter((object) =>
    object.kind === 'text' && object.attributes.layer === 10);
  assert.equal(labels.length, 2);
  const [nameLabel, valueLabel] = labels;
  assert.equal(nameLabel.attributes.anchorX, 'middle');
  assert.equal(valueLabel.attributes.anchorX, 'middle');
  assert.equal(nameLabel.X(), 1.5);
  assert.equal(valueLabel.X(), 1.5);
  assert.ok(nameLabel.Y() > -2);
  assert.ok(valueLabel.Y() < -2);

  for (const rotation of [90, 270] as const) {
    const vertical = controller.document;
    vertical.components[0].rotation = rotation;
    controller.importJSON(JSON.stringify(vertical));
    const nameOnLeft = rotation === 90;
    assert.equal(nameLabel.attributes.anchorX, nameOnLeft ? 'right' : 'left');
    assert.equal(valueLabel.attributes.anchorX, nameOnLeft ? 'left' : 'right');
    assert.equal(nameLabel.attributes.anchorY, 'middle');
    assert.equal(valueLabel.attributes.anchorY, 'middle');
    assert.equal(nameLabel.X() < 1.5, nameOnLeft);
    assert.equal(valueLabel.X() > 1.5, nameOnLeft);
    assert.equal(nameLabel.Y(), -2);
    assert.equal(valueLabel.Y(), -2);
  }

  const horizontal = controller.document;
  horizontal.components[0].rotation = 180;
  controller.importJSON(JSON.stringify(horizontal));
  assert.equal(nameLabel.attributes.anchorX, 'middle');
  assert.equal(valueLabel.attributes.anchorX, 'middle');
  assert.equal(nameLabel.X(), 1.5);
  assert.equal(valueLabel.X(), 1.5);
  assert.equal(nameLabel.attributes.anchorY, 'top');
  assert.equal(valueLabel.attributes.anchorY, 'bottom');
  assert.ok(nameLabel.Y() < -2);
  assert.ok(valueLabel.Y() > -2);
});
