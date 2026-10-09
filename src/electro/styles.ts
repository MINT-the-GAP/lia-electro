const STYLE_ID = 'lia-electro-styles-v5';

export function ensureElectroStyles(root: Document | ShadowRoot): void {
  if (root.getElementById?.(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.lia-electro-toolbar,
.lia-electro-palette,
.lia-electro-status,
.lia-electro-object-list-panel,
.lia-electro-properties,
.lia-electro-dialog {
  box-sizing: border-box;
  color: var(--lia-electro-neutral, #172033);
  font: 14px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color-scheme: inherit;
}
.lia-electro-toolbar {
  position: absolute;
  z-index: 40;
  top: 8px;
  left: 50%;
  display: flex;
  max-width: calc(100% - 16px);
  gap: 4px;
  align-items: center;
  padding: 5px;
  border: 1px solid color-mix(in srgb, var(--lia-electro-neutral, #172033) 34%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--lia-electro-surface, white) 96%, transparent);
  box-shadow: 0 6px 24px var(--lia-electro-shadow, rgba(15, 23, 42, .2));
  transform: translateX(-50%);
  backdrop-filter: blur(8px);
  transition:
    left 220ms cubic-bezier(.2, .8, .2, 1),
    max-width 220ms cubic-bezier(.2, .8, .2, 1);
  user-select: none;
}
.lia-electro-toolbar button,
.lia-electro-palette button,
.lia-electro-properties button,
.lia-electro-dialog button {
  box-sizing: border-box;
  min-width: 38px;
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: 7px;
  color: inherit;
  background: transparent;
  cursor: pointer;
  font: inherit;
}
.lia-electro-toolbar button:hover,
.lia-electro-toolbar button:focus-visible,
.lia-electro-palette button:hover,
.lia-electro-palette button:focus-visible,
.lia-electro-properties button:hover,
.lia-electro-properties button:focus-visible,
.lia-electro-dialog button:hover,
.lia-electro-dialog button:focus-visible {
  border-color: var(--lia-electro-action, #b41f65);
  background: color-mix(in srgb, var(--lia-electro-action, #b41f65) 16%, transparent);
}
.lia-electro-toolbar button:focus-visible,
.lia-electro-palette button:focus-visible,
.lia-electro-properties button:focus-visible,
.lia-electro-dialog button:focus-visible {
  outline: 2px solid var(--lia-electro-neutral, #172033);
  outline-offset: 2px;
}
.lia-electro-toolbar button[aria-pressed="true"],
.lia-electro-palette button[aria-pressed="true"] {
  border-color: color-mix(in srgb, var(--lia-electro-on-accent, white) 54%, transparent);
  color: var(--lia-electro-on-accent, white);
  background: var(--lia-electro-accent, #b41f65);
}
.lia-electro-toolbar button:disabled {
  opacity: .48;
  cursor: default;
}
.lia-electro-toolbar .lia-electro-separator {
  width: 1px;
  height: 27px;
  margin: 0 2px;
  background: color-mix(in srgb, var(--lia-electro-neutral, #172033) 30%, transparent);
}
.lia-electro-toolbar svg {
  display: block;
  width: 20px;
  height: 20px;
  margin: auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.lia-electro-toolbar button[data-action="objectList"] circle {
  fill: currentColor;
  stroke: none;
}
.lia-electro-palette {
  position: absolute;
  z-index: 45;
  top: 62px;
  left: 50%;
  display: grid;
  width: min(640px, calc(100% - 16px));
  max-height: min(430px, calc(100% - 80px));
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  gap: 5px;
  overflow: auto;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--lia-electro-neutral, #172033) 34%, transparent);
  border-radius: 10px;
  background: var(--lia-electro-surface, white);
  box-shadow: 0 10px 34px var(--lia-electro-shadow, rgba(15, 23, 42, .24));
  transform: translateX(-50%);
}
.lia-electro-palette[hidden] { display: none; }
.lia-electro-palette button[hidden] { display: none !important; }
.lia-electro-palette button {
  display: grid;
  min-height: 84px;
  grid-template-rows: 50px auto;
  gap: 3px;
  align-items: center;
  padding: 5px;
  text-align: center;
}
.lia-electro-palette button svg {
  width: 94px;
  height: 48px;
  margin: auto;
}
.lia-electro-palette button span { font-size: 13px; line-height: 1.25; }
.lia-electro-status {
  position: absolute;
  z-index: 35;
  right: 36px;
  bottom: 8px;
  max-width: min(560px, calc(100% - 52px));
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--lia-electro-neutral, #172033) 28%, transparent);
  border-radius: 7px;
  color: var(--lia-electro-neutral, #172033);
  background: color-mix(in srgb, var(--lia-electro-surface, white) 96%, transparent);
  box-shadow: 0 2px 10px var(--lia-electro-shadow, rgba(15, 23, 42, .16));
  transition:
    right 220ms cubic-bezier(.2, .8, .2, 1),
    max-width 220ms cubic-bezier(.2, .8, .2, 1);
  pointer-events: none;
  user-select: none;
}
[data-lia-electro-object-list-open="true"] > .lia-electro-toolbar,
[data-lia-electro-properties-open="true"] > .lia-electro-toolbar {
  left: calc((100% - var(--lia-electro-right-inset, 0px)) / 2);
  max-width: max(0px, calc(100% - var(--lia-electro-right-inset, 0px) - 16px));
}
[data-lia-electro-object-list-open="true"] > .lia-electro-status,
[data-lia-electro-properties-open="true"] > .lia-electro-status {
  right: calc(36px + var(--lia-electro-right-inset, 0px));
  max-width: max(0px, min(560px, calc(100% - var(--lia-electro-right-inset, 0px) - 52px)));
}
.lia-electro-object-list-clip {
  position: absolute;
  z-index: 48;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}
.lia-electro-object-list-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(170px, calc(100% - 24px));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 10px 8px 12px;
  border-left: 2px solid currentColor;
  background: var(--lia-electro-surface, white);
  box-shadow: -6px 0 16px var(--lia-electro-shadow, rgba(15, 23, 42, .2));
  transform: translateX(calc(100% + 2px));
  transition: transform 220ms cubic-bezier(.2, .8, .2, 1);
  pointer-events: none;
}
.lia-electro-object-list-panel[data-open="1"],
.lia-electro-object-list-panel.is-open {
  transform: translateX(0);
  pointer-events: auto;
}
.lia-electro-object-list-header {
  min-height: 28px;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 2px solid var(--lia-electro-accent, currentColor);
  font-size: 13px;
  font-weight: 700;
}
.lia-electro-object-list-panel .lia-electro-object-list-close {
  display: grid;
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  place-items: center;
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: 999px;
  color: inherit;
  background: transparent;
  font: inherit;
  font-size: 21px;
  line-height: 1;
  cursor: pointer;
}
.lia-electro-object-list-panel .lia-electro-object-list-close:hover,
.lia-electro-object-list-panel .lia-electro-object-list-close:focus-visible {
  background: color-mix(in srgb, var(--lia-electro-accent, currentColor) 22%, transparent);
  outline: 2px solid var(--lia-electro-action, currentColor);
  outline-offset: 1px;
}
.lia-electro-object-list-content {
  min-height: 0;
  flex: 1 1 auto;
  display: grid;
  align-content: start;
  gap: 6px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}
.lia-electro-object-list-content > [role="listitem"] {
  min-width: 0;
}
.lia-electro-object-list-empty {
  padding: 12px 6px;
  opacity: .7;
  font-size: 13px;
  text-align: center;
}
.lia-electro-object-list-entry {
  width: 100%;
  min-height: 44px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  padding: 5px 6px;
  border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
  border-radius: 7px;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.lia-electro-object-list-entry:hover,
.lia-electro-object-list-entry:focus-visible,
.lia-electro-object-list-entry.is-selected,
.lia-electro-object-list-entry[aria-current="true"] {
  border-color: var(--lia-electro-action, currentColor);
  background: color-mix(in srgb, var(--lia-electro-action, currentColor) 13%, transparent);
  outline: none;
}
.lia-electro-object-list-entry:focus-visible {
  box-shadow: inset 0 0 0 1px var(--lia-electro-action, currentColor);
}
.lia-electro-object-list-icon {
  width: 38px;
  height: 30px;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: currentColor;
}
.lia-electro-object-list-icon svg {
  display: block;
  width: 38px;
  height: 30px;
  max-width: 100%;
  max-height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.lia-electro-object-list-copy {
  min-width: 0;
  display: grid;
  gap: 1px;
}
.lia-electro-object-list-name,
.lia-electro-object-list-type {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lia-electro-object-list-name {
  font-size: 13px;
  font-weight: 700;
}
.lia-electro-object-list-type {
  font-size: 11px;
  opacity: .72;
}
.lia-electro-object-list-footer {
  flex: 0 0 auto;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 2px solid var(--lia-electro-accent, currentColor);
}
.lia-electro-object-list-footer[hidden] { display: none !important; }
.lia-electro-object-list-export {
  width: 100%;
  min-height: 34px;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 5px 8px;
  border: 2px solid var(--lia-electro-accent, currentColor);
  border-radius: 8px;
  color: inherit;
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.lia-electro-object-list-export:hover,
.lia-electro-object-list-export:focus-visible {
  border-color: var(--lia-electro-action, currentColor);
  background: color-mix(in srgb, var(--lia-electro-action, currentColor) 15%, transparent);
  outline: none;
}
.lia-electro-object-list-export:focus-visible {
  box-shadow: 0 0 0 2px var(--lia-electro-surface, white), 0 0 0 4px var(--lia-electro-action, currentColor);
}
.lia-electro-properties-clip {
  position: absolute;
  z-index: 48;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}
.lia-electro-properties {
  position: absolute;
  top: 0;
  right: var(--lia-electro-object-list-inset, 0px);
  bottom: 0;
  width: min(190px, calc(100% - var(--lia-electro-object-list-inset, 0px) - 24px));
  padding: 10px 12px;
  overflow-y: auto;
  border-left: 2px solid currentColor;
  background: var(--lia-electro-surface, white);
  box-shadow: -6px 0 16px rgba(0, 0, 0, .18);
  transform: translateX(calc(100% + 2px));
  transition:
    transform 220ms cubic-bezier(.2, .8, .2, 1),
    right 220ms cubic-bezier(.2, .8, .2, 1),
    width 220ms cubic-bezier(.2, .8, .2, 1);
  pointer-events: none;
}
.lia-electro-properties[data-open="1"] {
  transform: translateX(0);
  pointer-events: auto;
}
.lia-electro-properties-header {
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 2px solid var(--lia-electro-accent, currentColor);
  font-size: 15px;
  font-weight: 700;
}
.lia-electro-properties-title {
  min-width: 0;
  display: flex;
  flex: 1;
  align-items: center;
  gap: 5px;
}
.lia-electro-properties-title > span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lia-electro-properties-name {
  flex: 0 0 82px;
  width: 82px;
  height: 25px;
  box-sizing: border-box;
  min-width: 0;
  padding: 2px 5px;
  border: 1px solid currentColor;
  border-radius: 5px;
  color: inherit;
  background: transparent;
  font: inherit;
  font-weight: 600;
}
.lia-electro-properties .lia-electro-properties-close {
  display: grid;
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  place-items: center;
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: 999px;
  color: inherit;
  background: transparent;
  font: inherit;
  font-size: 21px;
  line-height: 1;
  cursor: pointer;
}
.lia-electro-properties .lia-electro-properties-close:hover,
.lia-electro-properties .lia-electro-properties-close:focus-visible {
  border-color: transparent;
  background: color-mix(in srgb, var(--lia-electro-accent, currentColor) 22%, transparent);
  outline: none;
}
.lia-electro-properties-field {
  display: grid;
  gap: 3px;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 700;
}
.lia-electro-properties-field input {
  min-width: 0;
  width: 100%;
  height: 28px;
  box-sizing: border-box;
  padding: 3px 5px;
  border: 1px solid currentColor;
  border-radius: 5px;
  color: inherit;
  background: transparent;
  font: inherit;
}
.lia-electro-properties input:focus-visible {
  border-color: var(--lia-electro-action, currentColor);
  outline: 1px solid var(--lia-electro-action, currentColor);
  outline-offset: 0;
}
.lia-electro-properties input[aria-invalid="true"] {
  border-color: #d93232;
  box-shadow: 0 0 0 1px #d93232;
}
.lia-electro-toggle-field {
  min-height: 32px;
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
.lia-electro-toggle-field[hidden] {
  display: none !important;
}
.lia-electro-toggle-field input[type="checkbox"] {
  flex: 0 0 17px;
  width: 17px;
  height: 17px;
  min-width: 17px;
  margin: 0;
  padding: 0;
  border-radius: 3px;
  accent-color: var(--lia-electro-action, var(--lia-electro-accent, currentColor));
  background: transparent;
  cursor: pointer;
}
.lia-electro-properties .lia-electro-toggle-field input[type="checkbox"]:focus-visible {
  border-color: currentColor;
  outline: 2px solid var(--lia-electro-action, currentColor);
  outline-offset: 2px;
}
.lia-electro-physics {
  display: grid;
  gap: 7px;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--lia-electro-neutral, #172033) 28%, transparent);
}
.lia-electro-physics-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .02em;
}
.lia-electro-physics-status {
  padding: 6px 7px;
  border-left: 3px solid var(--lia-electro-action, currentColor);
  border-radius: 4px;
  background: var(--lia-electro-surface-muted, #f2f5f7);
  font-size: 11px;
  line-height: 1.35;
}
.lia-electro-physics-status[data-status="short-circuit"],
.lia-electro-physics-status[data-status="invalid"],
.lia-electro-physics-status[data-status="incomplete"],
.lia-electro-physics-status[data-status="unsupported"] {
  border-left-color: var(--lia-electro-accent, currentColor);
}
.lia-electro-physics-values {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 5px 8px;
  align-items: baseline;
  margin: 0;
  font-size: 11px;
}
.lia-electro-physics-values dt {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}
.lia-electro-physics-values dd {
  margin: 0;
  text-align: right;
  white-space: nowrap;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}
.lia-electro-dialog-backdrop {
  position: absolute;
  z-index: 60;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  background: var(--lia-electro-backdrop, rgba(15, 23, 42, .42));
}
.lia-electro-dialog-backdrop[hidden] { display: none; }
.lia-electro-dialog {
  display: grid;
  width: min(620px, 100%);
  max-height: 100%;
  gap: 9px;
  overflow: auto;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--lia-electro-neutral, #172033) 30%, transparent);
  border-radius: 12px;
  background: var(--lia-electro-surface, white);
  box-shadow: 0 16px 50px var(--lia-electro-shadow, rgba(15, 23, 42, .32));
}
.lia-electro-export-dialog {
  width: min(920px, 100%);
  max-height: min(82vh, calc(100% - 32px));
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
}
.lia-electro-dialog h3 { margin: 0; font-size: 17px; }
.lia-electro-dialog h4 { margin: 0; font-size: 12px; }
.lia-electro-dialog p { margin: 0; }
.lia-electro-export-step {
  min-width: 0;
  min-height: 0;
}
.lia-electro-export-step[hidden],
.lia-electro-export-dialog [hidden] {
  display: none !important;
}
.lia-electro-export-components-step {
  display: grid;
  gap: 10px;
  padding-right: 3px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.lia-electro-export-hint {
  font-size: 13px;
  line-height: 1.35;
  opacity: .82;
}
.lia-electro-export-component-groups {
  display: flex;
  min-width: 0;
  max-height: min(43vh, 370px);
  align-items: stretch;
  gap: 10px;
  padding: 3px 8px 9px 3px;
  overflow: auto;
  overscroll-behavior: contain;
}
.lia-electro-export-component-group {
  flex: 0 0 auto;
  display: grid;
  align-content: start;
  gap: 7px;
  min-width: 54px;
}
.lia-electro-export-component-group + .lia-electro-export-component-group {
  padding-left: 10px;
  border-left: 2px solid var(--lia-electro-accent, currentColor);
}
.lia-electro-export-component-grid {
  display: grid;
  grid-template-columns: repeat(2, 44px);
  grid-auto-rows: 44px;
  gap: 8px;
}
.lia-electro-export-component-grid:has(> :only-child) {
  grid-template-columns: 44px;
}
.lia-electro-dialog .lia-electro-export-component {
  position: relative;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 3px;
  border-color: color-mix(in srgb, var(--lia-electro-neutral, #172033) 34%, transparent);
  border-radius: 10px;
  overflow: visible;
}
.lia-electro-export-component-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  transition: opacity 140ms ease, filter 140ms ease;
  pointer-events: none;
}
.lia-electro-export-component-icon > svg {
  display: block;
  width: 36px;
  height: 28px;
  overflow: visible;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.lia-electro-export-component[data-enabled="0"] .lia-electro-export-component-icon {
  opacity: .32;
  filter: grayscale(1);
}
.lia-electro-export-component-status {
  position: absolute;
  z-index: 2;
  right: -6px;
  bottom: -6px;
  display: grid;
  width: 18px;
  height: 18px;
  box-sizing: border-box;
  place-items: center;
  border: 1.5px solid var(--lia-electro-surface, white);
  border-radius: 50%;
  color: white;
  background: #248a3d;
  font: 750 13px/1 Arial, sans-serif;
  pointer-events: none;
}
.lia-electro-export-component[data-enabled="0"] .lia-electro-export-component-status {
  background: #c92a2a;
}
.lia-electro-export-restrictions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(245px, 100%), 1fr));
  gap: 7px 18px;
  min-width: 0;
  margin: 0;
  padding: 10px 0 0;
  border: 0;
  border-top: 2px solid var(--lia-electro-accent, currentColor);
}
.lia-electro-export-restrictions legend {
  width: 100%;
  box-sizing: border-box;
  padding: 0 0 7px;
  font-size: 13px;
  font-weight: 750;
}
.lia-electro-export-restriction-option {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.3;
  cursor: pointer;
  user-select: none;
}
.lia-electro-export-restriction-option input {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  margin: 0;
  accent-color: var(--lia-electro-action, var(--lia-electro-accent, currentColor));
  cursor: pointer;
}
.lia-electro-export-quiz-step {
  display: grid;
  align-content: start;
  gap: 12px;
  padding-right: 3px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.lia-electro-export-quiz-toggle,
.lia-electro-export-quiz-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.35;
  cursor: pointer;
}
.lia-electro-export-quiz-toggle {
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--lia-electro-accent, currentColor) 48%, transparent);
  border-radius: 9px;
  font-weight: 750;
  background: color-mix(in srgb, var(--lia-electro-accent-soft, #dff4f3) 58%, transparent);
}
.lia-electro-export-quiz-toggle input,
.lia-electro-export-quiz-option input,
.lia-electro-export-quiz-required-option input[type='checkbox'] {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  margin: 0;
  accent-color: var(--lia-electro-action, var(--lia-electro-accent, currentColor));
}
.lia-electro-export-quiz-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  transition: opacity 140ms ease;
}
.lia-electro-export-quiz-fields[data-disabled] { opacity: .5; }
.lia-electro-export-quiz-field {
  display: grid;
  min-width: 0;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
}
.lia-electro-export-quiz-field input,
.lia-electro-export-quiz-field select,
.lia-electro-export-quiz-count input {
  box-sizing: border-box;
  min-width: 0;
  min-height: 34px;
  padding: 6px 8px;
  border: 1px solid color-mix(in srgb, var(--lia-electro-neutral, #172033) 30%, transparent);
  border-radius: 7px;
  color: inherit;
  background: var(--lia-electro-surface-muted, #f2f5f7);
  font: inherit;
}
.lia-electro-export-quiz-required,
.lia-electro-export-quiz-policies,
.lia-electro-export-quiz-magnitude {
  grid-column: 1 / -1;
}
.lia-electro-export-quiz-required {
  min-width: 0;
  margin: 2px 0 0;
  padding: 10px 0 0;
  border: 0;
  border-top: 2px solid var(--lia-electro-accent, currentColor);
}
.lia-electro-export-quiz-required legend {
  width: 100%;
  box-sizing: border-box;
  padding: 0 0 5px;
  font-size: 13px;
  font-weight: 750;
}
.lia-electro-export-quiz-required-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
  gap: 7px 16px;
  margin-top: 9px;
}
.lia-electro-export-quiz-required-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.lia-electro-export-quiz-required-option > label:first-child {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  cursor: pointer;
}
.lia-electro-export-quiz-count {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 650;
}
.lia-electro-export-quiz-count input { width: 58px; }
.lia-electro-export-quiz-policies {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: 8px 16px;
}
.lia-electro-export-quiz-error {
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, #c92a2a 55%, transparent);
  border-radius: 7px;
  color: #9f1717;
  background: color-mix(in srgb, #c92a2a 9%, var(--lia-electro-surface, white));
  font-size: 13px;
}
.lia-electro-export-macro-step {
  display: grid;
  gap: 10px;
  overflow: auto;
}
.lia-electro-dialog textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 240px;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--lia-electro-neutral, #172033) 30%, transparent);
  border-radius: 7px;
  color: inherit;
  background: var(--lia-electro-surface-muted, #f2f5f7);
  font: 12px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace;
  resize: vertical;
}
.lia-electro-export-dialog .lia-electro-export-textarea {
  height: min(43vh, 330px);
  min-height: 160px;
  white-space: pre;
  overflow: auto;
}
.lia-electro-export-textarea:focus-visible,
.lia-electro-export-restriction-option input:focus-visible,
.lia-electro-export-quiz-step input:focus-visible,
.lia-electro-export-quiz-step select:focus-visible {
  outline: 2px solid var(--lia-electro-action, var(--lia-electro-accent, currentColor));
  outline-offset: 2px;
}
.lia-electro-dialog .lia-electro-dialog-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
.lia-electro-dialog .lia-electro-dialog-actions button {
  min-width: auto;
  padding: 5px 10px;
  border-color: color-mix(in srgb, var(--lia-electro-neutral, #172033) 24%, transparent);
}
.lia-electro-dialog .lia-electro-dialog-actions button[data-primary="1"] {
  border-color: var(--lia-electro-accent, currentColor);
  color: var(--lia-electro-on-accent, white);
  background: var(--lia-electro-accent, currentColor);
}
@media (max-width: 620px) {
  .lia-electro-dialog-backdrop { padding: 8px; }
  .lia-electro-export-dialog {
    width: 100%;
    max-height: calc(100% - 4px);
  }
  .lia-electro-export-component-groups { max-height: min(46vh, 330px); }
  .lia-electro-export-quiz-fields { grid-template-columns: 1fr; }
  .lia-electro-toolbar {
    left: 8px;
    max-width: calc(100% - 16px);
    overflow-x: auto;
    transform: none;
  }
  [data-lia-electro-object-list-open="true"] > .lia-electro-toolbar,
  [data-lia-electro-properties-open="true"] > .lia-electro-toolbar {
    left: 8px;
    max-width: max(0px, calc(100% - var(--lia-electro-right-inset, 0px) - 16px));
  }
  .lia-electro-palette { left: 8px; transform: none; grid-template-columns: repeat(2, minmax(112px, 1fr)); }
}
@media (max-width: 420px) {
  .lia-electro-object-list-panel {
    width: min(170px, calc(100% - 12px));
    padding-inline: 7px;
  }
  .lia-electro-properties {
    width: min(190px, calc(100% - var(--lia-electro-object-list-inset, 0px) - 12px));
    padding-inline: 10px;
  }
  [data-lia-electro-object-list-open="true"][data-lia-electro-properties-open="true"]
    > .lia-electro-properties-clip .lia-electro-properties-title {
    display: grid;
    align-items: stretch;
    gap: 3px;
  }
  [data-lia-electro-object-list-open="true"][data-lia-electro-properties-open="true"]
    > .lia-electro-properties-clip .lia-electro-properties-name {
    width: 100%;
    height: 27px;
    flex-basis: auto;
  }
}
@media (prefers-reduced-motion: reduce) {
  .lia-electro-toolbar,
  .lia-electro-status,
  .lia-electro-object-list-panel,
  .lia-electro-properties {
    transition: none;
  }
}
@media (forced-colors: active) {
  .lia-electro-toolbar,
  .lia-electro-palette,
  .lia-electro-status,
  .lia-electro-object-list-panel,
  .lia-electro-properties,
  .lia-electro-dialog {
    border-color: CanvasText;
    color: CanvasText;
    background: Canvas;
    box-shadow: none;
  }
  .lia-electro-properties input {
    border-color: CanvasText;
    color: CanvasText;
    background: Canvas;
  }
  .lia-electro-object-list-entry,
  .lia-electro-object-list-export {
    border-color: CanvasText;
    color: CanvasText;
    background: Canvas;
  }
  .lia-electro-object-list-entry:hover,
  .lia-electro-object-list-entry:focus-visible,
  .lia-electro-object-list-entry.is-selected,
  .lia-electro-object-list-entry[aria-current="true"] {
    border-color: Highlight;
    color: HighlightText;
    background: Highlight;
    box-shadow: none;
  }
  .lia-electro-object-list-panel .lia-electro-object-list-close:focus-visible,
  .lia-electro-object-list-export:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
    box-shadow: none;
  }
  .lia-electro-toggle-field input[type="checkbox"] {
    accent-color: Highlight;
    forced-color-adjust: auto;
  }
  .lia-electro-export-component,
  .lia-electro-export-textarea,
  .lia-electro-export-restrictions,
  .lia-electro-export-quiz-toggle,
  .lia-electro-export-quiz-required,
  .lia-electro-export-quiz-field input,
  .lia-electro-export-quiz-field select,
  .lia-electro-export-quiz-count input,
  .lia-electro-export-quiz-error {
    border-color: CanvasText;
    color: CanvasText;
    background: Canvas;
  }
  .lia-electro-export-component-status {
    border-color: Canvas;
    color: HighlightText;
    background: Highlight;
    forced-color-adjust: auto;
  }
  .lia-electro-export-component[data-enabled="0"] .lia-electro-export-component-status {
    color: Canvas;
    background: CanvasText;
  }
  .lia-electro-export-restriction-option input,
  .lia-electro-export-quiz-step input[type='checkbox'] {
    accent-color: Highlight;
    forced-color-adjust: auto;
  }
  .lia-electro-physics,
  .lia-electro-physics-status {
    border-color: CanvasText;
    background: Canvas;
  }
  .lia-electro-toolbar button[aria-pressed="true"],
  .lia-electro-palette button[aria-pressed="true"] {
    border-color: Highlight;
    color: HighlightText;
    background: Highlight;
  }
}
`;
  if (root instanceof Document) {
    (root.head || root.documentElement).appendChild(style);
  } else {
    root.appendChild(style);
  }
}
