import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

import { ElectroController } from '../src/electro/controller.ts';
import { createEmptyCircuit, type CircuitDocument } from '../src/electro/model.ts';

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
  const dom = new JSDOM(
    '<!doctype html><html lang="de"><head></head><body><div id="board"></div></body></html>',
    { url: 'https://example.test/' },
  );
  const view = dom.window;
  Object.defineProperties(globalThis, {
    window: { value: view, configurable: true },
    document: { value: view.document, configurable: true },
    navigator: { value: view.navigator, configurable: true },
    Node: { value: view.Node, configurable: true },
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

function mount(spec: string, initial: CircuitDocument, uid: string) {
  const { dom, container } = installDom();
  const view = dom.window as typeof dom.window & Record<string, any>;
  view.__coord = {
    getNeutralColor: () => '#172033',
    getAccentColor: () => '#b41f65',
  };
  view.__electroDocuments = {};
  const board = fakeBoard(container);
  const controller = new ElectroController(uid, board, spec, 'de', initial);
  return { dom, container, board, controller };
}

function pointer(
  dom: JSDOM,
  container: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  clientX: number,
  clientY = 300,
): MouseEvent {
  const event = new dom.window.MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX,
    clientY,
  });
  container.dispatchEvent(event);
  return event;
}

function selectAt(dom: JSDOM, container: HTMLElement, clientX: number): void {
  pointer(dom, container, 'pointerdown', clientX);
  pointer(dom, container, 'pointerup', clientX);
}

function contextAt(dom: JSDOM, container: HTMLElement, clientX: number): MouseEvent {
  const event = new dom.window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY: 300,
  });
  container.dispatchEvent(event);
  return event;
}

function keyboardContext(dom: JSDOM, container: HTMLElement): KeyboardEvent {
  const event = new dom.window.KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'F10',
    shiftKey: true,
  });
  container.dispatchEvent(event);
  return event;
}

test('component allowlist keeps existing objects but guards every new placement', (t) => {
  const initial = createEmptyCircuit();
  initial.components.push({
    id: 'c_0001', kind: 'resistor', at: [-2, 0], rotation: 0, origin: 'macro',
  });
  const { dom, container, controller } = mount(
    'id=allowlist;components=[100]',
    initial,
    'allowlist',
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const components = container.querySelector<HTMLButtonElement>('button[data-action="components"]');
  const battery = container.querySelector<HTMLButtonElement>('.lia-electro-palette button[data-symbol="battery"]');
  const resistor = container.querySelector<HTMLButtonElement>('.lia-electro-palette button[data-symbol="resistor"]');
  assert.ok(components && battery && resistor);
  assert.equal(controller.document.components.length, 1);
  assert.equal(controller.document.components[0].kind, 'resistor');
  assert.equal(battery.hidden, false);
  assert.equal(battery.disabled, false);
  assert.equal(resistor.hidden, true);
  assert.equal(resistor.disabled, true);
  assert.equal(resistor.tabIndex, -1);
  assert.equal(resistor.getAttribute('aria-hidden'), 'true');

  selectAt(dom, container, 320);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'r' }));
  assert.equal(controller.document.components[0].rotation, 90);

  components.click();
  resistor.hidden = false;
  resistor.disabled = false;
  resistor.click();
  pointer(dom, container, 'pointerdown', 600);
  assert.equal(controller.document.components.length, 1);

  battery.click();
  pointer(dom, container, 'pointerdown', 600);
  assert.equal(controller.document.components.length, 2);
  assert.equal(controller.document.components[1].kind, 'battery');
  assert.equal(controller.document.components[1].origin, 'editor');
});

test('restriction 110 blocks macro component properties on canvas, object list, toolbar and keyboard only', (t) => {
  const initial = createEmptyCircuit();
  initial.components.push(
    { id: 'c_macro', kind: 'resistor', at: [-2, 0], rotation: 0, origin: 'macro', name: '$R_M$' },
    { id: 'c_editor', kind: 'lamp', at: [2, 0], rotation: 0, origin: 'editor', name: '$L_E$' },
  );
  const { dom, container, controller } = mount(
    'id=macro-only;restrictions=[110]',
    initial,
    'macro-only',
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const panel = container.querySelector<HTMLElement>('.lia-electro-properties');
  const close = container.querySelector<HTMLButtonElement>('.lia-electro-properties-close');
  const properties = container.querySelector<HTMLButtonElement>('button[data-action="properties"]');
  const objectList = container.querySelector<HTMLButtonElement>('button[data-action="objectList"]');
  assert.ok(panel && close && properties && objectList);

  assert.equal(contextAt(dom, container, 320).defaultPrevented, true);
  assert.equal(panel.dataset.open, '0');
  assert.equal(properties.disabled, true);
  assert.equal(keyboardContext(dom, container).defaultPrevented, true);
  assert.equal(panel.dataset.open, '0');
  properties.click();
  assert.equal(panel.dataset.open, '0');

  objectList.click();
  const macroEntry = container.querySelector<HTMLButtonElement>('[data-object-key="component:c_macro"]');
  const editorEntry = container.querySelector<HTMLButtonElement>('[data-object-key="component:c_editor"]');
  assert.ok(macroEntry && editorEntry);
  assert.equal(macroEntry.getAttribute('aria-disabled'), 'true');
  assert.equal(editorEntry.getAttribute('aria-disabled'), 'false');
  macroEntry.click();
  assert.equal(panel.dataset.open, '0');
  assert.equal(properties.disabled, true);
  editorEntry.click();
  assert.equal(panel.dataset.open, '1');
  assert.equal(properties.disabled, false);
  close.click();

  assert.equal(contextAt(dom, container, 480).defaultPrevented, true);
  assert.equal(panel.dataset.open, '1');
  close.click();
  selectAt(dom, container, 480);
  assert.equal(properties.disabled, false);
  properties.click();
  assert.equal(panel.dataset.open, '1');
  close.click();
  selectAt(dom, container, 480);
  assert.equal(keyboardContext(dom, container).defaultPrevented, true);
  assert.equal(panel.dataset.open, '1');
});

test('restriction 120 protects the exact baseline while editor additions stay fully editable', (t) => {
  const baseline = createEmptyCircuit();
  baseline.components.push(
    {
      id: 'c_base_resistor',
      kind: 'resistor',
      at: [-4, 0],
      rotation: 0,
      origin: 'macro',
      name: '$R_0$',
      value: '100 Ω',
    },
    {
      id: 'c_base_lamp',
      kind: 'lamp',
      at: [0, 0],
      rotation: 0,
      origin: 'macro',
      name: '$L_0$',
    },
  );
  baseline.wires.push({
    id: 'w_base',
    from: { componentId: 'c_base_resistor', portId: 'b' },
    to: { componentId: 'c_base_lamp', portId: 'a' },
    route: 'horizontal-first',
  });

  const { dom, container, controller } = mount(
    'id=baseline-lock',
    baseline,
    'baseline-lock',
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const panel = container.querySelector<HTMLElement>('.lia-electro-properties');
  const properties = container.querySelector<HTMLButtonElement>('button[data-action=properties]');
  const propertiesClose = container.querySelector<HTMLButtonElement>('.lia-electro-properties-close');
  const nameInput = container.querySelector<HTMLInputElement>('.lia-electro-properties input[name=name]');
  const rotate = container.querySelector<HTMLButtonElement>('button[data-action=rotate]');
  const remove = container.querySelector<HTMLButtonElement>('button[data-action=remove]');
  const objectList = container.querySelector<HTMLButtonElement>('button[data-action=objectList]');
  const components = container.querySelector<HTMLButtonElement>('button[data-action=components]');
  const battery = container.querySelector<HTMLButtonElement>('.lia-electro-palette button[data-symbol=battery]');
  const wireTool = container.querySelector<HTMLButtonElement>('button[data-action=wire]');
  const clear = container.querySelector<HTMLButtonElement>('button[data-action=clear]');
  assert.ok(
    panel && properties && propertiesClose && nameInput && rotate && remove && objectList &&
    components && battery && wireTool && clear,
  );

  // A restriction activated at runtime also closes an already-open baseline editor.
  assert.equal(contextAt(dom, container, 240).defaultPrevented, true);
  assert.equal(panel.dataset.open, '1');
  controller.update('id=baseline-lock;restrictions=[120]', 'de', baseline);
  assert.equal(panel.dataset.open, '0');
  nameInput.value = 'Manipuliert';
  nameInput.dispatchEvent(new dom.window.FocusEvent('blur'));
  assert.equal(
    controller.document.components.find((component) => component.id === 'c_base_resistor')?.name,
    '$R_0$',
  );

  // Canvas context menu and object list cannot reopen properties for baseline components.
  assert.equal(contextAt(dom, container, 240).defaultPrevented, true);
  assert.equal(panel.dataset.open, '0');
  assert.equal(properties.disabled, true);
  properties.click();
  assert.equal(panel.dataset.open, '0');

  objectList.click();
  const objectEntries = [...container.querySelectorAll<HTMLButtonElement>('[data-object-key]')];
  const baselineComponentEntry = objectEntries.find((entry) =>
    entry.dataset.objectKey === 'component:c_base_resistor');
  const baselineWireEntry = objectEntries.find((entry) => entry.dataset.objectKey === 'wire:w_base');
  assert.ok(baselineComponentEntry && baselineWireEntry);
  assert.equal(baselineComponentEntry.getAttribute('aria-disabled'), 'true');
  assert.match(baselineComponentEntry.textContent || '', /vorgegeben/i);
  baselineComponentEntry.click();
  assert.equal(panel.dataset.open, '0');
  assert.equal(properties.disabled, true);
  assert.equal(rotate.disabled, true);
  assert.equal(remove.disabled, true);
  rotate.click();
  remove.click();
  assert.deepEqual(controller.document, baseline);

  baselineWireEntry.click();
  assert.equal(rotate.disabled, true);
  assert.equal(remove.disabled, true);
  rotate.click();
  remove.click();
  assert.deepEqual(controller.document, baseline);
  objectList.click();

  // Delete, rotation and drag attempts on the baseline component are all ignored.
  selectAt(dom, container, 240);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'r' }));
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }));
  pointer(dom, container, 'pointerdown', 240);
  pointer(dom, container, 'pointermove', 280);
  pointer(dom, container, 'pointerup', 280);
  assert.deepEqual(controller.document, baseline);

  // The baseline wire is selectable from the canvas, but its route and existence stay fixed.
  selectAt(dom, container, 320);
  assert.equal(rotate.disabled, true);
  assert.equal(remove.disabled, true);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'r' }));
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }));
  assert.deepEqual(controller.document, baseline);

  // Place a real editor component and connect it to the baseline through the wire tool.
  components.click();
  battery.click();
  pointer(dom, container, 'pointerdown', 560);
  const addedComponent = controller.document.components.find((component) =>
    !baseline.components.some((preset) => preset.id === component.id));
  assert.ok(addedComponent);
  assert.equal(addedComponent.origin, 'editor');
  assert.deepEqual(addedComponent.at, [4, 0]);

  wireTool.click();
  pointer(dom, container, 'pointerdown', 456);
  pointer(dom, container, 'pointerdown', 504);
  const addedWire = controller.document.wires.find((wire) => wire.id !== 'w_base');
  assert.ok(addedWire);
  const originalAddedRoute = addedWire.route;
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'r' }));
  assert.notEqual(
    controller.document.wires.find((wire) => wire.id === addedWire.id)?.route,
    originalAddedRoute,
  );
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }));
  assert.equal(controller.document.wires.some((wire) => wire.id === addedWire.id), false);
  controller.undo();
  assert.equal(controller.document.wires.some((wire) => wire.id === addedWire.id), true);

  // Editor components remain editable, rotatable and draggable.
  assert.equal(contextAt(dom, container, 560).defaultPrevented, true);
  assert.equal(panel.dataset.open, '1');
  nameInput.value = '$B_1$';
  nameInput.dispatchEvent(new dom.window.FocusEvent('blur'));
  assert.equal(
    controller.document.components.find((component) => component.id === addedComponent.id)?.name,
    '$B_1$',
  );
  propertiesClose.click();
  selectAt(dom, container, 560);
  assert.equal(rotate.disabled, false);
  assert.equal(remove.disabled, false);
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'r' }));
  assert.equal(
    controller.document.components.find((component) => component.id === addedComponent.id)?.rotation,
    90,
  );
  pointer(dom, container, 'pointerdown', 560);
  pointer(dom, container, 'pointermove', 600);
  pointer(dom, container, 'pointerup', 600);
  assert.deepEqual(
    controller.document.components.find((component) => component.id === addedComponent.id)?.at,
    [5, 0],
  );

  // Editor additions can be deleted; undo restores them for the clear/reset assertion.
  container.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'Delete' }));
  assert.equal(controller.document.components.some((component) => component.id === addedComponent.id), false);
  assert.equal(controller.document.wires.some((wire) => wire.id === addedWire.id), false);
  controller.undo();
  assert.equal(controller.document.components.some((component) => component.id === addedComponent.id), true);
  assert.equal(controller.document.wires.some((wire) => wire.id === addedWire.id), true);

  // Clear restores exact baseline model equality under restriction 120.
  clear.click();
  assert.deepEqual(controller.document, baseline);
});

test('restriction 100 blocks properties for macro and editor components globally', (t) => {
  const initial = createEmptyCircuit();
  initial.components.push(
    { id: 'c_macro', kind: 'resistor', at: [-2, 0], rotation: 0, origin: 'macro' },
    { id: 'c_editor', kind: 'lamp', at: [2, 0], rotation: 0, origin: 'editor' },
  );
  const { dom, container, controller } = mount(
    'id=global-lock;restrictions=[100;110]',
    initial,
    'global-lock',
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const panel = container.querySelector<HTMLElement>('.lia-electro-properties');
  const properties = container.querySelector<HTMLButtonElement>('button[data-action="properties"]');
  const objectList = container.querySelector<HTMLButtonElement>('button[data-action="objectList"]');
  assert.ok(panel && properties && objectList);

  for (const clientX of [320, 480]) {
    assert.equal(contextAt(dom, container, clientX).defaultPrevented, true);
    assert.equal(panel.dataset.open, '0');
    assert.equal(properties.disabled, true);
    assert.equal(keyboardContext(dom, container).defaultPrevented, true);
    assert.equal(panel.dataset.open, '0');
  }

  objectList.click();
  const entries = [...container.querySelectorAll<HTMLButtonElement>('[data-object-key^="component:"]')];
  assert.equal(entries.length, 2);
  assert.ok(entries.every((entry) => entry.getAttribute('aria-disabled') === 'true'));
  entries.forEach((entry) => entry.click());
  assert.equal(panel.dataset.open, '0');
  assert.equal(properties.disabled, true);
});

test('restriction 300 suppresses meter reading and control without mutating showMeasurement', (t) => {
  const initial = createEmptyCircuit();
  initial.components.push(
    { id: 'battery', kind: 'battery', at: [-4, 0], rotation: 0, value: '6 V', origin: 'macro' },
    { id: 'resistor', kind: 'resistor', at: [0, 0], rotation: 0, value: '300 Ω', origin: 'macro' },
    { id: 'meter', kind: 'ammeter', at: [4, 0], rotation: 0, name: '$A_1$', origin: 'macro' },
  );
  initial.wires.push(
    {
      id: 'w_1',
      from: { componentId: 'battery', portId: 'b' },
      to: { componentId: 'meter', portId: 'a' },
      route: 'horizontal-first',
    },
    {
      id: 'w_2',
      from: { componentId: 'meter', portId: 'b' },
      to: { componentId: 'resistor', portId: 'a' },
      route: 'horizontal-first',
    },
    {
      id: 'w_3',
      from: { componentId: 'resistor', portId: 'b' },
      to: { componentId: 'battery', portId: 'a' },
      route: 'horizontal-first',
    },
  );
  const { dom, container, board, controller } = mount(
    'id=measurements;restrictions=[300]',
    initial,
    'measurements',
  );
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const meterLabels = board.objects.filter((object) =>
    object.kind === 'text' && object.attributes.layer === 10 && Math.abs(object.X() - 4) < 1e-9);
  const labelCallbacks = meterLabels
    .map((object) => object.args[2])
    .filter((content): content is () => unknown => typeof content === 'function');
  assert.equal(labelCallbacks.length, 2);
  assert.equal(labelCallbacks.some((content) => content() === '\\(20\\,\\mathrm{mA}\\)'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(controller.document.components[2], 'showMeasurement'), false);

  assert.equal(contextAt(dom, container, 560).defaultPrevented, true);
  const field = container.querySelector<HTMLLabelElement>('.lia-electro-measurement-field');
  const input = container.querySelector<HTMLInputElement>('input[name="showMeasurement"]');
  assert.ok(field && input);
  assert.equal(field.hidden, true);
  assert.equal(input.disabled, true);
  assert.equal(input.tabIndex, -1);
  assert.equal(input.checked, true);

  input.checked = false;
  input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(input.checked, true);
  assert.equal(Object.prototype.hasOwnProperty.call(controller.document.components[2], 'showMeasurement'), false);
  assert.doesNotMatch(controller.exportJSON(), /showMeasurement/);

  controller.update('id=measurements', 'de');
  assert.equal(field.hidden, false);
  assert.equal(input.disabled, false);
  assert.equal(input.tabIndex, 0);
  assert.equal(labelCallbacks.some((content) => content() === '\\(20\\,\\mathrm{mA}\\)'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(controller.document.components[2], 'showMeasurement'), false);
});

test('restriction 400 hides and disables export and closes an open export dialog on update', (t) => {
  const initial = createEmptyCircuit();
  initial.components.push({
    id: 'c_0001', kind: 'battery', at: [0, 0], rotation: 0, origin: 'macro',
  });
  const { dom, container, controller } = mount('id=export-lock', initial, 'export-lock');
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });

  const objectList = container.querySelector<HTMLButtonElement>('button[data-action="objectList"]');
  const exportButton = container.querySelector<HTMLButtonElement>('.lia-electro-object-list-export');
  const backdrop = container.querySelector<HTMLDivElement>('.lia-electro-dialog-backdrop');
  assert.ok(objectList && exportButton && backdrop);
  objectList.click();
  assert.equal(exportButton.hidden, false);
  assert.equal(exportButton.disabled, false);
  assert.equal(exportButton.tabIndex, 0);
  exportButton.click();
  assert.equal(backdrop.hidden, false);
  assert.equal(backdrop.inert, false);
  assert.equal(exportButton.getAttribute('aria-expanded'), 'true');

  controller.update('id=export-lock;restrictions=[400]', 'de');
  assert.equal(backdrop.hidden, true);
  assert.equal(backdrop.inert, true);
  assert.equal(backdrop.getAttribute('aria-hidden'), 'true');
  assert.equal(exportButton.getAttribute('aria-expanded'), 'false');
  assert.equal(exportButton.hidden, true);
  assert.equal(exportButton.disabled, true);
  assert.equal(exportButton.tabIndex, -1);
  assert.equal(exportButton.parentElement?.hidden, true);
});
