!function(e,t,i,o,r){var n="u">typeof globalThis?globalThis:"u">typeof self?self:"u">typeof window?window:"u">typeof global?global:{},s="function"==typeof n[o]&&n[o],a=s.i||{},l=s.cache||{},c="u">typeof module&&"function"==typeof module.require&&module.require.bind(module);function d(t,i){if(!l[t]){if(!e[t]){if(r[t])return r[t];var a="function"==typeof n[o]&&n[o];if(!i&&a)return a(t,!0);if(s)return s(t,!0);if(c&&"string"==typeof t)return c(t);var p=Error("Cannot find module '"+t+"'");throw p.code="MODULE_NOT_FOUND",p}h.resolve=function(i){var o=e[t][1][i];return null!=o?o:i},h.cache={};var u=l[t]=new d.Module(t);e[t][0].call(u.exports,h,u,u.exports,n)}return l[t].exports;function h(e){var t=h.resolve(e);if(!1===t)return{};if(Array.isArray(t)){var i={__esModule:!0};return t.forEach(function(e){var t=e[0],o=e[1],r=e[2]||e[0],n=d(o);"*"===t?Object.keys(n).forEach(function(e){"default"===e||"__esModule"===e||Object.prototype.hasOwnProperty.call(i,e)||Object.defineProperty(i,e,{enumerable:!0,get:function(){return n[e]}})}):"*"===r?Object.defineProperty(i,t,{enumerable:!0,value:n}):Object.defineProperty(i,t,{enumerable:!0,get:function(){return"default"===r?n.__esModule?n.default:n:n[r]}})}),i}return d(t)}}d.isParcelRequire=!0,d.Module=function(e){this.id=e,this.bundle=d,this.require=c,this.exports={}},d.modules=e,d.cache=l,d.parent=s,d.distDir=void 0,d.publicUrl=void 0,d.devServer=void 0,d.i=a,d.register=function(t,i){e[t]=[function(e,t){t.exports=i},{}]},Object.defineProperty(d,"root",{get:function(){return n[o]}}),n[o]=d;for(var p=0;p<t.length;p++)d(t[p]);if(i){var u=d(i);"object"==typeof exports&&"u">typeof module?module.exports=u:"function"==typeof define&&define.amd&&define(function(){return u})}}({btjAh:[function(e,t,i,o){var r=e("./electro/config.ts"),n=e("./electro/controller.ts"),s=e("./electro/macros.ts"),a=e("./electro/model.ts"),l=e("./electro/quiz.ts"),c=e("./electro/symbols.ts");let d={},p={},u={},h={},m=!1;function g(e,t,i){var o;x();let l=(0,r.parseElectroSpec)(t);if(!e||!l.boardId){e&&b(e),console.warn("[lia-electro] @Electro requires a board id.");return}let c=window.__boards&&window.__boards[l.boardId];if(o=c,!o?.containerObj||!1===o.containerObj.isConnected)return void function(e,t,i){if(h[e]={spec:t,language:i},null!=u[e])return;let o=(p[e]||0)+1;if(p[e]=o,o>180){delete p[e],delete u[e],delete h[e],console.warn(`[lia-electro] Board for ${e} did not become available.`);return}u[e]=window.setTimeout(()=>{delete u[e];let t=h[e];t&&g(e,t.spec,t.language)},60)}(e,t,i);b(e);let m=document.getElementById(`electro-ui-${e}`);m&&(m.style.display="none",m.setAttribute("aria-hidden","true"));let f=null,v=null;try{f=(0,s.circuitFromMacroElements)(document,l.boardId,{snapStep:l.snapStep,wireStub:l.wireStub}),v=(0,s.completionQuizSpecFromMacroElements)(document,l.boardId)}catch(e){console.error("[lia-electro] Could not read the circuit macro declarations.",e);return}let y=d[e];if(y&&y.board===c&&y.boardId===l.boardId)return void y.update(t,i,f||void 0,v);y&&y.destroy(),Object.keys(d).forEach(t=>{let i=d[t];t!==e&&i.boardId===l.boardId&&(i.destroy(),delete d[t])});try{let o=window.__electroDocuments||{},r=Object.prototype.hasOwnProperty.call(o,l.boardId)?(0,a.cloneCircuit)(o[l.boardId]):f||void 0;d[e]=new(0,n.ElectroController)(e,c,t,i,r,f||void 0,v||void 0)}catch(e){console.error("[lia-electro] Could not initialize the circuit editor.",e)}}function b(e){null!=u[e]&&window.clearTimeout(u[e]),delete u[e],delete p[e],delete h[e]}function f(){let e=Array.from(document.querySelectorAll('[id^="electro-ui-"]')),t=new Set(e.map(e=>e.id.slice(11)));Object.keys(d).forEach(e=>{t.has(e)||(d[e].destroy(),delete d[e],b(e))}),Object.keys(u).forEach(e=>{t.has(e)||b(e)}),e.forEach(e=>{null==e.dataset.spec||g(e.id.slice(11),e.dataset.spec||"",e.dataset.language)})}function x(){window.__liaElectroThemeBridgeRegistered||"function"!=typeof window.__registerLiaThemeListener||(window.__liaElectroThemeBridgeRegistered=!0,window.__registerLiaThemeListener(()=>{Object.values(window.__electroControllers||{}).forEach(e=>{e.refreshTheme()})}))}function v(e){if(!(e instanceof Element))return!1;let t="[id^=electro-ui-], .lia-electro-completion-spec, .jxgbox";return e.matches(t)||!!e.querySelector(t)}function y(e){return Object.values(d).find(t=>t.boardId===e)||null}window.__electroControllers=d,window.__electroDocuments=window.__electroDocuments||{},window.__setupElectro=g,window.__bootstrapElectro=f,window.__electro={version:"0.9.0",setup:g,bootstrap:f,exportJSON:e=>y(e)?.exportJSON()||null,exportMacros:e=>y(e)?.exportMacros()||null,downloadMacros:e=>y(e)?.downloadMacros()||null,downloadJSON:e=>y(e)?.downloadJSON()||null,importJSON:(e,t)=>y(e)?.importJSON(t)||null,analyzeDC:e=>y(e)?.analyzeDC()||null,checkCompletion(e){let t=(0,l.parseCompletionRule)(e);return y(t.boardId)?.checkCompletion(t)||null},getController:y,symbols:c.SYMBOLS},(Array.isArray(window.__liaElectroHooks)?window.__liaElectroHooks.slice():[]).forEach(e=>{try{e()}catch(e){}}),window.__liaElectroHooks={push(e){try{e()}catch(e){}}},x(),function(){let e=document.documentElement||document.body;if(!e||"function"!=typeof MutationObserver)return;window.__liaElectroObserver?.disconnect();let t=new MutationObserver(e=>{e.some(e=>{let t=!1;return e.addedNodes.forEach(e=>{t||=v(e)}),e.removedNodes.forEach(e=>{t||=v(e)}),t})&&!m&&(m=!0,window.setTimeout(()=>{m=!1,f()},0))});t.observe(e,{childList:!0,subtree:!0}),window.__liaElectroObserver=t}(),f()},{"./electro/config.ts":"73RYQ","./electro/controller.ts":"aiaoR","./electro/model.ts":"freun","./electro/symbols.ts":"9hsna","./electro/macros.ts":"jaabZ","./electro/quiz.ts":"92woF"}],"73RYQ":[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"ELECTRO_COMPONENT_CAPABILITIES",()=>n),r.export(i,"ELECTRO_KNOWN_COMPONENT_IDS",()=>s),r.export(i,"ELECTRO_RESTRICTIONS",()=>a),r.export(i,"ELECTRO_KNOWN_RESTRICTION_IDS",()=>l),r.export(i,"parseElectroSpec",()=>c),r.export(i,"isComponentAllowed",()=>d),r.export(i,"hasElectroRestriction",()=>p),r.export(i,"canonicalElectroIds",()=>u),r.export(i,"canonicalElectroRestrictionIds",()=>h),r.export(i,"formatElectroIdSelection",()=>m),r.export(i,"splitElectroSpec",()=>g),r.export(i,"resolveLanguage",()=>b);let n=Object.freeze({battery:100,"voltage-source":110,resistor:200,"variable-resistor":210,capacitor:220,inductor:230,"iron-core-inductor":240,diode:300,photodiode:310,led:320,switch:400,"changeover-switch":410,lamp:500,motor:510,voltmeter:600,ammeter:610,ground:700,antenna:710,transistor:800,transformer:900}),s=Object.freeze(Array.from(new Set(Object.values(n))).sort((e,t)=>e-t)),a=Object.freeze({componentPropertiesLocked:100,macroComponentPropertiesLocked:110,baselineLocked:120,measurementControlsLocked:300,exportLocked:400}),l=Object.freeze([a.componentPropertiesLocked,a.macroComponentPropertiesLocked,a.baselineLocked,a.measurementControlsLocked,a.exportLocked]);function c(e){let t=g(e),i=new Map,o="";t.forEach(e=>{let t=e.indexOf("=");t>0?i.set(e.slice(0,t).trim().toLowerCase(),e.slice(t+1).trim()):o||/^[01]$/.test(e)||(o=x(e))});let r=i.has("components")?i.get("components")||"":null,n=f(r),s=null==r||null==n||0===n.length?null:new Set(u(n)),a=new Set(h(f(i.has("restrictions")?i.get("restrictions")||"":null)||[]));return{boardId:x(i.get("id")||i.get("board")||o),snapStep:v(i.get("snap")||i.get("raster"),.5),wireStub:v(i.get("stub"),.35),componentIds:s,restrictionIds:a}}function d(e,t){return null==e.componentIds||e.componentIds.has(n[t])}function p(e,t){return e.restrictionIds.has(t)}function u(e){return Array.from(new Set(Array.from(e).map(e=>Number(e)).filter(e=>Number.isSafeInteger(e)&&e>0))).sort((e,t)=>e-t)}function h(e){let t=new Set(u(e));return t.has(a.componentPropertiesLocked)&&t.delete(a.macroComponentPropertiesLocked),Array.from(t).sort((e,t)=>e-t)}function m(e){let t=u(e);return`[${t.length?t.join(";"):"0"}]`}function g(e){let t=[],i="",o=0,r="",n=String(e||"").trim();for(let e=0;e<n.length;e+=1){let s=n[e];if(r){i+=s,s===r&&"\\"!==n[e-1]&&(r="");continue}if('"'===s||"'"===s||"`"===s){r=s,i+=s;continue}if("["===s&&(o+=1),"]"===s&&o>0&&(o-=1),";"===s&&0===o){i.trim()&&t.push(i.trim()),i="";continue}i+=s}return i.trim()&&t.push(i.trim()),t}function b(e){return/^de(?:-|$)/i.test(String(e||""))?"de":"en"}function f(e){if(null==e)return null;let t=x(e).match(/^\s*\[([\s\S]*)\]\s*$/);if(!t)return null;let i=String(t[1]||"").trim();if(!i)return[];let o=i.split(/[;,\s]+/).map(e=>e.trim()).filter(Boolean);if(!o.length||o.some(e=>!/^\d+$/.test(e)))return null;let r=o.map(e=>Number(e));return r.every(e=>Number.isSafeInteger(e)&&e>=0)?r:null}function x(e){let t=String(e||"").trim();if(t.length<2)return t;let i=t[0];return i===t[t.length-1]&&('"'===i||"'"===i||"`"===i)?t.slice(1,-1).trim():t}function v(e,t){let i=Number(String(e??"").replace(",","."));return Number.isFinite(i)&&i>0&&i<=10?i:t}},{"@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}],gC6AD:[function(e,t,i,o){i.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},i.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},i.exportAll=function(e,t){return Object.keys(e).forEach(function(i){"default"===i||"__esModule"===i||Object.prototype.hasOwnProperty.call(t,i)||Object.defineProperty(t,i,{enumerable:!0,get:function(){return e[i]}})}),t},i.export=function(e,t,i){Object.defineProperty(e,t,{enumerable:!0,get:i})}},{}],aiaoR:[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"ElectroController",()=>w),r.export(i,"controllerFromSpec",()=>E);var n=e("./config.ts"),s=e("./history.ts"),a=e("./labels.ts"),l=e("./macros.ts"),c=e("./physics.ts"),d=e("./quiz.ts"),p=e("./model.ts"),u=e("./routing.ts"),h=e("./serialization.ts"),m=e("./symbols.ts"),g=e("./styles.ts"),b=e("./theme.ts");let f=[{id:"sources",kinds:["battery","voltage-source"]},{id:"passive",kinds:["resistor","variable-resistor","capacitor","inductor","iron-core-inductor"]},{id:"semiconductors",kinds:["diode","photodiode","led","transistor"]},{id:"switches",kinds:["switch","changeover-switch"]},{id:"loads",kinds:["lamp","motor"]},{id:"meters",kinds:["voltmeter","ammeter"]},{id:"other",kinds:["ground","antenna","transformer"]}],x=["closed","ammeter-current","voltmeter-voltage","total-current","equivalent-resistance"],v=["battery","voltage-source","resistor","variable-resistor","ammeter","voltmeter","ground"],y={de:{components:"Bauteile",select:"Auswählen und verschieben (V)",wire:"Kabel zeichnen (W)",rotate:"Auswahl um 90° drehen (R)",properties:"Bauteileigenschaften bearbeiten",remove:"Auswahl löschen (Entf)",undo:"Rückgängig (Strg+Z)",redo:"Wiederholen (Strg+Y)",exchange:"Schaltung als LiaScript-Makros exportieren",objectList:"Objektliste",closeObjectList:"Objektliste schließen",noObjects:"Noch keine Bauteile oder Kabel.",wireType:"Kabel",wireName:e=>`Kabel ${e}`,export:"Export",download:"Makroblock herunterladen",downloaded:e=>`${e} wurde exportiert.`,downloadFailed:"Der Makro-Download ist in diesem Browser nicht verfügbar.",readingHidden:"Messwert ausgeblendet",clear:"Schaltung leeren",clearBaseline:"Ergänzungen zurücksetzen",selectStatus:"Bauteil oder Kabel auswählen. Bauteile lassen sich ziehen.",wireStatus:"Ersten Anschluss anklicken.",wireEndStatus:"Zweiten Anschluss anklicken. Leertaste wechselt die Kabelroute.",placeStatus:e=>`${e} im Raster platzieren.`,emptyStatus:"Hier gibt es noch nichts zu löschen.",noAdditions:"Die vorgegebene Schaltung enthält keine Ergänzungen.",selectedComponent:e=>`${e} ausgew\xe4hlt. Ziehen, R zum Drehen, Entf zum L\xf6schen; Rechtsklick f\xfcr Eigenschaften.`,selectedLockedComponent:e=>`${e} ausgew\xe4hlt und fixiert. Rechtsklick \xf6ffnet die Eigenschaften; Entf l\xf6scht das Bauteil.`,selectedProtectedComponent:e=>`${e} ist vorgegeben und vollst\xe4ndig gesch\xfctzt.`,selectedWire:"Kabel ausgewählt. R wechselt die rechtwinklige Route.",selectedProtectedWire:"Dieses vorgegebene Kabel ist vollständig geschützt.",samePort:"Ein Kabel benötigt zwei verschiedene Anschlüsse.",duplicateWire:"Diese beiden Anschlüsse sind bereits verbunden.",propertiesTitle:"Bauteileigenschaften",componentType:e=>e,nameLabel:"Name",valueLabel:"Wert",valuePlaceholder:"z. B. 220 Ω",showMeasurement:"Messwert am Symbol anzeigen",lockComponent:"Fixieren",locked:"fixiert",protected:"vorgegeben",componentLocked:e=>`${e} fixiert.`,componentUnlocked:e=>`Fixierung f\xfcr ${e} aufgehoben.`,sourceValueLabel:"Quellspannung U",sourceValuePlaceholder:"z. B. 9 V",resistanceValueLabel:"Widerstand R",resistanceValuePlaceholder:"z. B. 220 Ω oder 4,7 kΩ",closeProperties:"Eigenschaften schließen",propertiesSaved:e=>`Eigenschaften f\xfcr ${e} gespeichert.`,physicsTitle:"Gleichstromanalyse",physicsSolved:"Geschlossener Stromkreis",physicsOpen:"Offener Stromkreis: Es fehlt ein leitender Rückweg.",physicsShort:"Kurzschluss: Die Spannungsquelle ist ohne Widerstand überbrückt.",physicsNoSource:"Keine Gleichspannungsquelle vorhanden.",physicsNotConnected:"Das Bauteil gehört zu keinem gespeisten Stromkreis.",physicsIncomplete:e=>`F\xfcr ${e} fehlt ein g\xfcltiger elektrischer Wert.`,physicsUnsupported:e=>`${e} wird in der DC-Analyse noch nicht unterst\xfctzt.`,physicsInvalid:"Das elektrische Netz ist nicht eindeutig lösbar.",totalVoltage:"Gesamtspannung U",totalResistance:"Gesamtwiderstand Rges",totalCurrent:"Gesamtstrom I",componentVoltage:"Spannung U",componentCurrent:"Strom I",deliveredCurrent:"Abgegebener Strom I",componentPower:"Leistung P",exportComponentsTitle:"Bauteile für den Import auswählen",exportComponentsHint:"Nur grün markierte Bauteile können im importierten Electro neu platziert werden. Bereits eingebaute Bauteile bleiben erhalten.",exportRestrictionsTitle:"Einschränkungen im importierten Electro",restrictAllProperties:"Bauteileigenschaften vollständig sperren (Rechtsklick)",restrictMacroProperties:"Bauteileigenschaften nur für per Makro eingebaute Bauteile sperren",restrictMeasurements:"Ändern und Anzeigen von Messwerten sperren",restrictExport:"Export in der Objektliste sperren",exportQuizTitle:"Ergänzungsaufgabe festlegen",exportQuizHint:"Optional wird aus der Schaltung ein automatisch geprüftes LiaScript-Quiz. Geprüft werden die elektrische Verbindung, die geforderten Ergänzungen und der Sollwert.",quizEnable:"Ergänzungsquiz exportieren",quizCondition:"Bedingung",quizConditions:{closed:"Stromkreis ist geschlossen","ammeter-current":"Amperemeter erreicht Sollstrom","voltmeter-voltage":"Voltmeter erreicht Sollspannung","total-current":"Gesamtstrom erreicht Sollwert","equivalent-resistance":"Ersatzwiderstand erreicht Sollwert"},quizMeter:"Ziel-Messgerät",quizNoMeter:"Kein passendes Messgerät in der Schaltung",quizTarget:"Sollwert mit Einheit",quizTolerance:"Toleranz mit Einheit",quizMagnitude:"Betrag statt Anschlussrichtung vergleichen",quizRequiredTitle:"Exakt geforderte neue Bauteile",quizRequiredHint:"Ohne Auswahl sind beliebige unterstützte Ergänzungen erlaubt.",quizCount:"Anzahl",quizPreserve:"Elektrische Vorgabe muss erhalten bleiben",quizChanged:"Unveränderte Abgabe nicht akzeptieren",quizInvalid:"Die Aufgabenbedingung ist noch nicht vollständig oder enthält einen ungültigen Wert.",quizMeterMissing:"Für diese Bedingung wird ein passendes Messgerät benötigt.",quizUnsupported:e=>`${e} wird in automatisch gepr\u00fcften Gleichstromaufgaben noch nicht unterst\u00fctzt.`,restrictBaseline:"Vorgegebene Bauteile und Kabel vollständig schützen",propertiesRestricted:"Die Eigenschaften dieses Bauteils sind gesperrt.",protectedObject:"Dieses vorgegebene Objekt ist vollständig geschützt.",exportGroups:{sources:"Quellen",passive:"Passive Bauteile",semiconductors:"Halbleiter",switches:"Schalter",loads:"Verbraucher",meters:"Messgeräte",other:"Weitere Bauteile"},available:"verfügbar",unavailable:"nicht verfügbar",dialogTitle:"Als LiaScript-Makros exportieren",dialogHelp:"Kopiere diesen Block in eine LiaScript-Datei. Jedes Bauteil und jedes Kabel wird als eigenes Makro ausgegeben.",next:"Weiter",back:"Zurück",copy:"Kopieren",close:"Schließen",copied:"Makroblock wurde kopiert.",copyFailed:"Kopieren nicht möglich; bitte den Text manuell markieren.",clearConfirm:"Wirklich alle Bauteile und Kabel entfernen?",clearBaselineConfirm:"Alle Ergänzungen entfernen und die vorgegebene Schaltung wiederherstellen?"},en:{components:"Components",select:"Select and move (V)",wire:"Draw wire (W)",rotate:"Rotate selection by 90° (R)",properties:"Edit component properties",remove:"Delete selection (Delete)",undo:"Undo (Ctrl+Z)",redo:"Redo (Ctrl+Y)",exchange:"Export circuit as LiaScript macros",objectList:"Object list",closeObjectList:"Close object list",noObjects:"No components or wires yet.",wireType:"Wire",wireName:e=>`Wire ${e}`,export:"Export",download:"Download macro block",downloaded:e=>`${e} was exported.`,downloadFailed:"Macro download is not available in this browser.",readingHidden:"Reading hidden",clear:"Clear circuit",clearBaseline:"Reset additions",selectStatus:"Select a component or wire. Drag components to move them.",wireStatus:"Select the first terminal.",wireEndStatus:"Select the second terminal. Space switches the wire route.",placeStatus:e=>`Place ${e} on the grid.`,emptyStatus:"There is nothing to delete yet.",noAdditions:"The preset circuit has no additions.",selectedComponent:e=>`${e} selected. Drag, press R to rotate, Delete to remove; right-click for properties.`,selectedLockedComponent:e=>`${e} selected and locked. Right-click for properties; Delete removes the component.`,selectedProtectedComponent:e=>`${e} is preset and fully protected.`,selectedWire:"Wire selected. R switches the orthogonal route.",selectedProtectedWire:"This preset wire is fully protected.",samePort:"A wire needs two different terminals.",duplicateWire:"Those terminals are already connected.",propertiesTitle:"Component properties",componentType:e=>e,nameLabel:"Name",valueLabel:"Value",valuePlaceholder:"e.g. 220 Ω",showMeasurement:"Show reading at the symbol",lockComponent:"Lock",locked:"locked",protected:"preset",componentLocked:e=>`${e} locked.`,componentUnlocked:e=>`${e} unlocked.`,sourceValueLabel:"Source voltage U",sourceValuePlaceholder:"e.g. 9 V",resistanceValueLabel:"Resistance R",resistanceValuePlaceholder:"e.g. 220 Ω or 4.7 kΩ",closeProperties:"Close properties",propertiesSaved:e=>`Properties saved for ${e}.`,physicsTitle:"DC analysis",physicsSolved:"Closed circuit",physicsOpen:"Open circuit: A conductive return path is missing.",physicsShort:"Short circuit: The voltage source is bypassed without resistance.",physicsNoSource:"No DC voltage source is present.",physicsNotConnected:"The component is not part of a powered circuit.",physicsIncomplete:e=>`${e} needs a valid electrical value.`,physicsUnsupported:e=>`${e} is not supported by the DC analysis yet.`,physicsInvalid:"The electrical network does not have a unique solution.",totalVoltage:"Total voltage U",totalResistance:"Total resistance Rtotal",totalCurrent:"Total current I",componentVoltage:"Voltage U",componentCurrent:"Current I",deliveredCurrent:"Delivered current I",componentPower:"Power P",exportComponentsTitle:"Choose components for the imported Electro",exportComponentsHint:"Only components marked in green can be placed in the imported Electro. Components already built into the circuit remain available.",exportRestrictionsTitle:"Restrictions in the imported Electro",restrictAllProperties:"Disable component properties completely (right-click)",restrictMacroProperties:"Disable component properties only for components inserted by macros",restrictBaseline:"Fully protect preset components and wires",restrictMeasurements:"Disable changing and displaying meter readings",restrictExport:"Disable export in the object list",exportQuizTitle:"Define completion task",exportQuizHint:"Optionally export the circuit as an automatically checked LiaScript quiz. The electrical connection, required additions and target value are validated.",quizEnable:"Export a completion quiz",quizCondition:"Condition",quizConditions:{closed:"Circuit is closed","ammeter-current":"Ammeter reaches target current","voltmeter-voltage":"Voltmeter reaches target voltage","total-current":"Total current reaches target","equivalent-resistance":"Equivalent resistance reaches target"},quizMeter:"Target meter",quizNoMeter:"No matching meter in the circuit",quizTarget:"Target value with unit",quizTolerance:"Tolerance with unit",quizMagnitude:"Compare magnitude instead of terminal direction",quizRequiredTitle:"Exact required new components",quizRequiredHint:"Without a selection, any supported additions are allowed.",quizCount:"Count",quizPreserve:"Preset electrical circuit must be preserved",quizChanged:"Reject an unchanged submission",quizInvalid:"The task condition is incomplete or contains an invalid value.",quizMeterMissing:"This condition needs a matching meter.",quizUnsupported:e=>`${e} is not yet supported in automatically checked DC tasks.`,propertiesRestricted:"The properties of this component are disabled.",protectedObject:"This preset object is fully protected.",exportGroups:{sources:"Sources",passive:"Passive components",semiconductors:"Semiconductors",switches:"Switches",loads:"Loads",meters:"Meters",other:"Other components"},available:"available",unavailable:"not available",dialogTitle:"Export as LiaScript macros",dialogHelp:"Copy this block into a LiaScript file. Every component and wire is emitted as its own macro.",next:"Continue",back:"Back",copy:"Copy",close:"Close",copied:"Macro block copied.",copyFailed:"Copy failed; select the text manually.",clearConfirm:"Remove every component and wire?",clearBaselineConfirm:"Remove all additions and restore the preset circuit?"}},C='<svg viewBox="0 0 24 24"><circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="M7 17h5V7h5"/></svg>';class w{uid;boardId;board;container;language;config;sourceSpec;baseline;completionQuizSpec;history;tool="select";placementKind=null;selection=null;pendingWire=null;pointerPreview=null;drag=null;transientPositions=new Map;componentRenders=new Map;wireRenders=new Map;previewCurve=null;toolbar;palette;status;objectListClip;objectListPanel;objectListTitle;objectListContent;objectListCloseButton;objectListExportButton;objectListSignature="";propertiesClip;propertiesPanel;propertiesType;propertiesCloseButton;propertiesNameInput;propertiesValueInput;propertiesLockField;propertiesLockInput;propertiesMeasurementField;propertiesMeasurementInput;propertiesPhysicsStatus;propertiesPhysicsValues;dialogBackdrop;dialog;dialogTitle;dialogComponentsHint;dialogComponentsStep;dialogQuizHint;dialogQuizStep;dialogQuizEnabledInput;dialogQuizConditionSelect;dialogQuizComponentField;dialogQuizComponentSelect;dialogQuizTargetField;dialogQuizTargetInput;dialogQuizToleranceField;dialogQuizToleranceInput;dialogQuizMagnitudeField;dialogQuizMagnitudeInput;dialogQuizPreserveInput;dialogQuizChangedInput;dialogQuizError;dialogMacroStep;dialogTextarea;dialogBackButton;dialogCopyButton;dialogDownloadButton;dialogCloseButton;dialogStep="components";dialogComponentButtons=new Map;dialogRestrictionInputs=new Map;dialogQuizRequiredInputs=new Map;dialogSelectedComponentIds=new Set;dialogSelectedRestrictionIds=new Set;dialogCompletionQuizSpec;dialogReturnFocus=null;buttons=new Map;propertyComponentId=null;propertyReturnFocus=null;propertyReturnObjectKey=null;dcAnalysis;destroyed=!1;handlePointerDown=e=>this.onPointerDown(e);handlePointerMove=e=>this.onPointerMove(e);handlePointerUp=e=>this.onPointerUp(e);handlePointerCancel=e=>this.onPointerCancel(e);handleContextMenu=e=>this.onContextMenu(e);handleKeyDown=e=>this.onKeyDown(e);constructor(e,t,i,o,r,a,l){this.uid=e,this.board=t,this.container=t.containerObj,this.config=(0,n.parseElectroSpec)(i),this.sourceSpec=i,this.boardId=this.config.boardId,this.language=(0,n.resolveLanguage)(o);let d=r?(0,h.validateCircuit)((0,p.cloneCircuit)(r)):(0,p.createEmptyCircuit)({snapStep:this.config.snapStep,wireStub:this.config.wireStub});this.baseline=a?(0,h.validateCircuit)((0,p.cloneCircuit)(a)):(0,p.cloneCircuit)(d),this.completionQuizSpec=S(l),this.isBaselineProtectionEnabled()&&(d=(0,h.validateCircuit)(this.restoreBaselineEntities(d))),this.history=new(0,s.CircuitHistory)(d),this.dcAnalysis=(0,c.analyzeDcCircuit)(d);const u=this.container.getRootNode?.()||window.document;(0,g.ensureElectroStyles)(u),this.prepareContainer(),this.createInterface(),this.createPreviewCurve(),this.bindEvents(),this.reconcileRenders(),this.applyTheme(),this.setTool("select"),this.persist()}get document(){return(0,p.cloneCircuit)(this.history.document)}update(e,t,i,o){let r=this.isBaselineProtectionEnabled();this.config=(0,n.parseElectroSpec)(e),this.sourceSpec=e,this.language=(0,n.resolveLanguage)(t);let s=null!=i&&!I(this.baseline,i);if(null!=i&&(this.baseline=(0,h.validateCircuit)((0,p.cloneCircuit)(i))),void 0!==o&&(this.completionQuizSpec=S(o)),this.isBaselineProtectionEnabled()&&(!r||s)){let e=(0,h.validateCircuit)(this.restoreBaselineEntities(this.history.document));this.history.replace(e),this.persist(),this.reconcileRenders()}this.refreshInterfaceText(),this.applyTheme()}refreshTheme(){this.destroyed||this.applyTheme()}exportJSON(){return(0,h.stringifyCircuit)(this.history.document)}exportMacros(e,t){let i=t?{...t,...void 0===t.completionQuizSpec&&this.completionQuizSpec?{completionQuizSpec:this.completionQuizSpec}:{}}:this.completionQuizSpec?{componentIds:new Set(null===this.config.componentIds?Object.values(n.ELECTRO_COMPONENT_CAPABILITIES):this.config.componentIds),restrictionIds:new Set(this.config.restrictionIds),completionQuizSpec:this.completionQuizSpec}:void 0;return(0,l.buildElectroMacroBlock)(this.history.document,this.sourceSpec,this.language,e,i)}downloadMacros(e=this.exportMacros()){let t=`${this.safeExportName()}.lia.md`;return this.downloadText(e,t,"text/markdown;charset=utf-8")}downloadJSON(){let e=`${this.safeExportName()}.electro.json`;return this.downloadText(this.exportJSON(),e,"application/json;charset=utf-8")}downloadText(e,t,i){let o=window.URL;if("function"!=typeof window.Blob||"function"!=typeof o?.createObjectURL)return this.setStatus(y[this.language].downloadFailed),null;let r=null,n=document.createElement("a");try{let s=new window.Blob([e],{type:i});return n.href=r=o.createObjectURL(s),n.download=t,n.hidden=!0,this.container.appendChild(n),n.click(),this.setStatus(y[this.language].downloaded(t)),t}catch(e){return this.setStatus(y[this.language].downloadFailed),null}finally{if(n.remove(),r){let e=r;window.setTimeout(()=>o.revokeObjectURL?.(e),0)}}}analyzeDC(){return(0,c.analyzeDcCircuit)(this.history.document)}checkCompletion(e=this.completionQuizSpec||""){let t="string"==typeof e?(0,d.parseCompletionRule)(e):e,i=(0,d.evaluateCircuitCompletion)(this.history.document,this.baseline,t,(0,c.analyzeDcCircuit)(this.history.document),this.language);return this.setStatus(i.message),i}importJSON(e){let t=(0,h.parseCircuitJSON)(e);return this.closeProperties(!1),this.selection=null,this.cancelPendingWire(),this.commit(t),this.document}undo(){this.closeProperties(!1),this.history.undo()&&(this.selection=null,this.cancelPendingWire(),this.persist(),this.reconcileRenders())}redo(){this.closeProperties(!1),this.history.redo()&&(this.selection=null,this.cancelPendingWire(),this.persist(),this.reconcileRenders())}destroy(){if(!this.destroyed){this.destroyed=!0,this.container.removeEventListener("pointerdown",this.handlePointerDown,!0),this.container.removeEventListener("pointermove",this.handlePointerMove,!0),this.container.removeEventListener("pointerup",this.handlePointerUp,!0),this.container.removeEventListener("pointercancel",this.handlePointerCancel,!0),this.container.removeEventListener("contextmenu",this.handleContextMenu,!0),this.container.removeEventListener("keydown",this.handleKeyDown,!0),this.componentRenders.forEach(e=>this.removeBoardObjects([e.curve,e.selection,...e.terminals,...e.labels])),this.wireRenders.forEach(e=>this.removeBoardObjects([e.curve])),this.componentRenders.clear(),this.wireRenders.clear(),this.removeBoardObjects([this.previewCurve]),this.previewCurve=null,this.toolbar.remove(),this.palette.remove(),this.status.remove(),this.objectListClip.remove(),this.propertiesClip.remove(),this.dialogBackdrop.remove(),this.container.dataset.liaElectroUid===this.uid&&(delete this.container.dataset.liaElectroUid,delete this.container.dataset.liaElectroBoard,delete this.container.dataset.liaElectroMode,delete this.container.dataset.liaElectroPropertiesOpen,delete this.container.dataset.liaElectroObjectListOpen),this.container.style.removeProperty("--lia-electro-object-list-inset"),this.container.style.removeProperty("--lia-electro-right-inset");try{this.board.update()}catch(e){}}}prepareContainer(){let e=getComputedStyle(this.container).position;e&&"static"!==e||(this.container.style.position="relative"),this.container.hasAttribute("tabindex")||(this.container.tabIndex=0),this.container.dataset.liaElectroUid=this.uid,this.container.dataset.liaElectroBoard=this.boardId}createInterface(){this.toolbar=document.createElement("div"),this.toolbar.className="lia-electro-toolbar",this.toolbar.setAttribute("role","toolbar"),this.addToolbarButton("components",'<svg viewBox="0 0 24 24"><path d="M3 12h4m10 0h4M7 8h10v8H7z"/></svg>'),this.addToolbarButton("select",'<svg viewBox="0 0 24 24"><path d="M5 3l12 9-6 1.5L9 20z"/></svg>',!0),this.addToolbarButton("wire",C,!0),this.addToolbarButton("rotate",'<svg viewBox="0 0 24 24"><path d="M19 8V3l-2 2a8 8 0 1 0 2.2 8"/><path d="M15 3h4v4"/></svg>'),this.addToolbarButton("properties",'<svg viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4zM13.5 6.5l4 4M4 12H2m4-6L4.5 4.5M12 4V2"/></svg>'),this.addToolbarButton("remove",'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-9 0l1 14h10l1-14M10 11v6m4-6v6"/></svg>'),this.addSeparator(),this.addToolbarButton("undo",'<svg viewBox="0 0 24 24"><path d="M9 7L4 12l5 5M5 12h8a6 6 0 0 1 6 6"/></svg>'),this.addToolbarButton("redo",'<svg viewBox="0 0 24 24"><path d="M15 7l5 5-5 5m4-5h-8a6 6 0 0 0-6 6"/></svg>'),this.addSeparator(),this.addToolbarButton("objectList",'<svg viewBox="0 0 24 24"><circle cx="5" cy="6" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="5" cy="18" r="1.6"/><path d="M9 6h12M9 12h12M9 18h12"/></svg>',!0),this.addToolbarButton("clear",'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-9 0l1 14h10l1-14"/></svg>'),this.toolbar.addEventListener("click",e=>this.onToolbarClick(e)),this.palette=document.createElement("div"),this.palette.className="lia-electro-palette",this.palette.id=`lia-electro-palette-${this.uid}`,this.palette.hidden=!0,this.palette.setAttribute("role","dialog"),this.palette.setAttribute("aria-label",y[this.language].components);let e=this.buttons.get("components");e?.setAttribute("aria-expanded","false"),e?.setAttribute("aria-controls",this.palette.id),m.SYMBOLS.forEach(e=>{let t=document.createElement("button");t.type="button",t.dataset.symbol=e.id,t.setAttribute("aria-pressed","false"),t.innerHTML=(0,m.symbolToSvg)(e);let i=document.createElement("span");i.textContent=e.label[this.language],t.appendChild(i),this.palette.appendChild(t)}),this.palette.addEventListener("click",e=>this.onPaletteClick(e)),this.status=document.createElement("div"),this.status.className="lia-electro-status",this.status.setAttribute("role","status"),this.status.setAttribute("aria-live","polite"),this.objectListClip=document.createElement("div"),this.objectListClip.className="lia-electro-object-list-clip",this.objectListPanel=document.createElement("aside"),this.objectListPanel.className="lia-electro-object-list-panel",this.objectListPanel.id=`lia-electro-object-list-${this.uid}`,this.objectListPanel.setAttribute("role","complementary"),this.objectListPanel.setAttribute("aria-hidden","true"),this.objectListPanel.dataset.open="0",this.objectListPanel.inert=!0;let t=document.createElement("div");t.className="lia-electro-object-list-header",this.objectListTitle=document.createElement("span"),this.objectListCloseButton=document.createElement("button"),this.objectListCloseButton.type="button",this.objectListCloseButton.className="lia-electro-object-list-close",this.objectListCloseButton.textContent="×",this.objectListCloseButton.tabIndex=-1,t.append(this.objectListTitle,this.objectListCloseButton),this.objectListContent=document.createElement("div"),this.objectListContent.className="lia-electro-object-list-content",this.objectListContent.setAttribute("role","list");let i=document.createElement("div");i.className="lia-electro-object-list-footer",this.objectListExportButton=document.createElement("button"),this.objectListExportButton.type="button",this.objectListExportButton.className="lia-electro-object-list-export",this.objectListExportButton.tabIndex=-1,i.appendChild(this.objectListExportButton),this.objectListPanel.append(t,this.objectListContent,i),this.objectListClip.appendChild(this.objectListPanel);let o=this.buttons.get("objectList");o?.setAttribute("aria-controls",this.objectListPanel.id),o?.setAttribute("aria-expanded","false"),this.objectListCloseButton.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),this.setObjectListOpen(!1,!0)}),this.objectListExportButton.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),this.openDialog(this.objectListExportButton)}),this.propertiesClip=document.createElement("div"),this.propertiesClip.className="lia-electro-properties-clip",this.propertiesPanel=document.createElement("div"),this.propertiesPanel.className="lia-electro-properties",this.propertiesPanel.id=`lia-electro-properties-${this.uid}`,this.propertiesPanel.setAttribute("role","dialog"),this.propertiesPanel.setAttribute("aria-label",y[this.language].propertiesTitle),this.propertiesPanel.setAttribute("aria-hidden","true"),this.propertiesPanel.dataset.open="0";let r=document.createElement("div");r.className="lia-electro-properties-header";let s=document.createElement("div");s.className="lia-electro-properties-title",this.propertiesType=document.createElement("span"),this.propertiesNameInput=document.createElement("input"),this.propertiesNameInput.name="name",this.propertiesNameInput.type="text",this.propertiesNameInput.className="lia-electro-properties-name",this.propertiesNameInput.maxLength=h.MAX_COMPONENT_TEXT_LENGTH,this.propertiesNameInput.autocomplete="off",this.propertiesNameInput.spellcheck=!1,this.propertiesNameInput.setAttribute("aria-invalid","false"),this.propertiesNameInput.tabIndex=-1,s.append(this.propertiesType,this.propertiesNameInput),this.propertiesCloseButton=document.createElement("button"),this.propertiesCloseButton.type="button",this.propertiesCloseButton.className="lia-electro-properties-close",this.propertiesCloseButton.textContent="×",this.propertiesCloseButton.tabIndex=-1,r.append(s,this.propertiesCloseButton);let a=document.createElement("label");a.className="lia-electro-properties-field";let l=document.createElement("span");l.dataset.role="properties-value-label",this.propertiesValueInput=document.createElement("input"),this.propertiesValueInput.name="value",this.propertiesValueInput.type="text",this.propertiesValueInput.maxLength=h.MAX_COMPONENT_TEXT_LENGTH,this.propertiesValueInput.autocomplete="off",this.propertiesValueInput.spellcheck=!1,this.propertiesValueInput.setAttribute("aria-invalid","false"),this.propertiesValueInput.tabIndex=-1,a.append(l,this.propertiesValueInput),this.propertiesLockField=document.createElement("label"),this.propertiesLockField.className="lia-electro-properties-field lia-electro-toggle-field lia-electro-lock-field",this.propertiesLockInput=document.createElement("input"),this.propertiesLockInput.name="locked",this.propertiesLockInput.type="checkbox",this.propertiesLockInput.tabIndex=-1;let c=document.createElement("span");c.dataset.role="properties-lock-label",this.propertiesLockField.append(this.propertiesLockInput,c),this.propertiesMeasurementField=document.createElement("label"),this.propertiesMeasurementField.className="lia-electro-properties-field lia-electro-toggle-field lia-electro-measurement-field",this.propertiesMeasurementField.hidden=!0,this.propertiesMeasurementInput=document.createElement("input"),this.propertiesMeasurementInput.name="showMeasurement",this.propertiesMeasurementInput.type="checkbox",this.propertiesMeasurementInput.tabIndex=-1;let d=document.createElement("span");d.dataset.role="properties-measurement-label",this.propertiesMeasurementField.append(this.propertiesMeasurementInput,d);let p=document.createElement("section");p.className="lia-electro-physics";let u=document.createElement("div");u.className="lia-electro-physics-title",u.id=`lia-electro-physics-title-${this.uid}`,u.dataset.role="physics-title",p.setAttribute("aria-labelledby",u.id),this.propertiesPhysicsStatus=document.createElement("div"),this.propertiesPhysicsStatus.className="lia-electro-physics-status",this.propertiesPhysicsStatus.id=`lia-electro-physics-status-${this.uid}`,this.propertiesPhysicsStatus.setAttribute("role","status"),this.propertiesPhysicsStatus.setAttribute("aria-live","polite"),this.propertiesPhysicsStatus.setAttribute("aria-atomic","true"),this.propertiesValueInput.setAttribute("aria-describedby",this.propertiesPhysicsStatus.id),this.propertiesPhysicsValues=document.createElement("dl"),this.propertiesPhysicsValues.className="lia-electro-physics-values",p.append(u,this.propertiesPhysicsStatus,this.propertiesPhysicsValues),this.propertiesPanel.append(r,a,this.propertiesLockField,this.propertiesMeasurementField,p),this.propertiesClip.appendChild(this.propertiesPanel),this.propertiesPanel.addEventListener("pointerdown",e=>e.stopPropagation()),this.propertiesPanel.addEventListener("contextmenu",e=>{e.preventDefault(),e.stopPropagation()}),this.propertiesCloseButton.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),this.closeProperties(!0)}),this.propertiesNameInput.addEventListener("blur",()=>this.applyPropertyInput("name")),this.propertiesValueInput.addEventListener("blur",()=>this.applyPropertyInput("value")),this.propertiesLockInput.addEventListener("change",()=>this.applyComponentLock()),this.propertiesMeasurementInput.addEventListener("change",()=>this.applyMeasurementVisibility()),this.propertiesNameInput.addEventListener("keydown",e=>this.onPropertyInputKeyDown(e,"name")),this.propertiesValueInput.addEventListener("keydown",e=>this.onPropertyInputKeyDown(e,"value"));let g=this.buttons.get("properties");g?.setAttribute("aria-haspopup","dialog"),g?.setAttribute("aria-controls",this.propertiesPanel.id),g?.setAttribute("aria-expanded","false"),g?.setAttribute("aria-keyshortcuts","Shift+F10"),this.dialogBackdrop=document.createElement("div"),this.dialogBackdrop.className="lia-electro-dialog-backdrop",this.dialogBackdrop.hidden=!0,this.dialogBackdrop.inert=!0,this.dialogBackdrop.setAttribute("aria-hidden","true"),this.dialogBackdrop.addEventListener("click",e=>{e.target===this.dialogBackdrop&&this.closeDialog()}),this.dialog=document.createElement("div"),this.dialog.className="lia-electro-dialog lia-electro-export-dialog",this.dialog.id=`lia-electro-export-dialog-${this.uid}`,this.dialog.setAttribute("role","dialog"),this.dialog.setAttribute("aria-modal","true"),this.dialogTitle=document.createElement("h3"),this.dialogTitle.id=`lia-electro-export-title-${this.uid}`,this.dialogTitle.dataset.role="dialog-title",this.dialog.setAttribute("aria-labelledby",this.dialogTitle.id),this.objectListExportButton.setAttribute("aria-haspopup","dialog"),this.objectListExportButton.setAttribute("aria-controls",this.dialog.id),this.objectListExportButton.setAttribute("aria-expanded","false"),this.dialogComponentsStep=document.createElement("div"),this.dialogComponentsStep.className="lia-electro-export-step lia-electro-export-components-step",this.dialogComponentsHint=document.createElement("p"),this.dialogComponentsHint.id=`lia-electro-export-components-help-${this.uid}`,this.dialogComponentsHint.className="lia-electro-export-hint",this.dialogComponentsHint.dataset.role="dialog-components-help";let b=document.createElement("div");b.className="lia-electro-export-component-groups",f.forEach(e=>{let t=document.createElement("section");t.className="lia-electro-export-component-group",t.setAttribute("role","group");let i=document.createElement("h4");i.id=`lia-electro-export-group-${e.id}-${this.uid}`,i.dataset.exportGroup=e.id,t.setAttribute("aria-labelledby",i.id);let o=document.createElement("div");o.className="lia-electro-export-component-grid",e.kinds.forEach(e=>{let t=m.SYMBOL_BY_ID[e],i=document.createElement("button");i.type="button",i.className="lia-electro-export-component",i.dataset.componentKind=e,i.dataset.componentId=String(n.ELECTRO_COMPONENT_CAPABILITIES[e]),i.dataset.enabled="1",i.setAttribute("aria-pressed","true");let r=document.createElement("span");r.className="lia-electro-export-component-icon",r.setAttribute("aria-hidden","true"),r.innerHTML=(0,m.symbolToSvg)(t);let s=document.createElement("span");s.className="lia-electro-export-component-status",s.setAttribute("aria-hidden","true"),s.textContent="✓",i.append(r,s),i.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.toggleDialogComponent(e)}),this.dialogComponentButtons.set(e,i),o.appendChild(i)}),t.append(i,o),b.appendChild(t)});let w=document.createElement("fieldset");w.className="lia-electro-export-restrictions";let E=document.createElement("legend");E.dataset.role="dialog-restrictions-title",w.appendChild(E),[{id:n.ELECTRO_RESTRICTIONS.componentPropertiesLocked,role:"all-properties"},{id:n.ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked,role:"macro-properties"},{id:n.ELECTRO_RESTRICTIONS.baselineLocked,role:"baseline"},{id:n.ELECTRO_RESTRICTIONS.measurementControlsLocked,role:"measurements"},{id:n.ELECTRO_RESTRICTIONS.exportLocked,role:"export"}].forEach(e=>{let t=document.createElement("label");t.className="lia-electro-export-restriction-option";let i=document.createElement("input");i.type="checkbox",i.dataset.restrictionId=String(e.id);let o=document.createElement("span");o.dataset.exportRestriction=e.role,t.append(i,o),w.appendChild(t),this.dialogRestrictionInputs.set(e.id,i),i.addEventListener("change",t=>{t.stopPropagation(),this.toggleDialogRestriction(e.id,i.checked)})}),this.dialogComponentsStep.append(this.dialogComponentsHint,b,w),this.dialogQuizStep=document.createElement("div"),this.dialogQuizStep.className="lia-electro-export-step lia-electro-export-quiz-step",this.dialogQuizStep.hidden=!0,this.dialogQuizStep.inert=!0,this.dialogQuizHint=document.createElement("p"),this.dialogQuizHint.id=`lia-electro-export-quiz-help-${this.uid}`,this.dialogQuizHint.className="lia-electro-export-hint",this.dialogQuizHint.dataset.role="dialog-quiz-help";let S=document.createElement("label");S.className="lia-electro-export-quiz-toggle",this.dialogQuizEnabledInput=document.createElement("input"),this.dialogQuizEnabledInput.type="checkbox";let I=document.createElement("span");I.dataset.role="dialog-quiz-enable",S.append(this.dialogQuizEnabledInput,I);let k=document.createElement("div");k.className="lia-electro-export-quiz-fields",k.dataset.role="dialog-quiz-fields";let z=document.createElement("label");z.className="lia-electro-export-quiz-field";let P=document.createElement("span");P.dataset.role="dialog-quiz-condition",this.dialogQuizConditionSelect=document.createElement("select"),this.dialogQuizConditionSelect.name="completion-condition",x.forEach(e=>{let t=document.createElement("option");t.value=e,t.dataset.condition=e,this.dialogQuizConditionSelect.appendChild(t)}),z.append(P,this.dialogQuizConditionSelect),this.dialogQuizComponentField=document.createElement("label"),this.dialogQuizComponentField.className="lia-electro-export-quiz-field";let L=document.createElement("span");L.dataset.role="dialog-quiz-component",this.dialogQuizComponentSelect=document.createElement("select"),this.dialogQuizComponentSelect.name="completion-component",this.dialogQuizComponentField.append(L,this.dialogQuizComponentSelect),this.dialogQuizTargetField=document.createElement("label"),this.dialogQuizTargetField.className="lia-electro-export-quiz-field";let j=document.createElement("span");j.dataset.role="dialog-quiz-target",this.dialogQuizTargetInput=document.createElement("input"),this.dialogQuizTargetInput.type="text",this.dialogQuizTargetInput.name="completion-target",this.dialogQuizTargetInput.placeholder="20 mA",this.dialogQuizTargetInput.autocomplete="off",this.dialogQuizTargetField.append(j,this.dialogQuizTargetInput),this.dialogQuizToleranceField=document.createElement("label"),this.dialogQuizToleranceField.className="lia-electro-export-quiz-field";let T=document.createElement("span");T.dataset.role="dialog-quiz-tolerance",this.dialogQuizToleranceInput=document.createElement("input"),this.dialogQuizToleranceInput.type="text",this.dialogQuizToleranceInput.name="completion-tolerance",this.dialogQuizToleranceInput.placeholder="0.1 mA",this.dialogQuizToleranceInput.autocomplete="off",this.dialogQuizToleranceField.append(T,this.dialogQuizToleranceInput),this.dialogQuizMagnitudeField=document.createElement("label"),this.dialogQuizMagnitudeField.className="lia-electro-export-quiz-option lia-electro-export-quiz-magnitude",this.dialogQuizMagnitudeInput=document.createElement("input"),this.dialogQuizMagnitudeInput.type="checkbox",this.dialogQuizMagnitudeInput.checked=!0;let M=document.createElement("span");M.dataset.role="dialog-quiz-magnitude",this.dialogQuizMagnitudeField.append(this.dialogQuizMagnitudeInput,M);let O=document.createElement("fieldset");O.className="lia-electro-export-quiz-required";let A=document.createElement("legend");A.dataset.role="dialog-quiz-required-title";let B=document.createElement("p");B.className="lia-electro-export-hint",B.dataset.role="dialog-quiz-required-hint";let $=document.createElement("div");$.className="lia-electro-export-quiz-required-grid",v.forEach(e=>{let t=document.createElement("div");t.className="lia-electro-export-quiz-required-option";let i=document.createElement("label"),o=document.createElement("input");o.type="checkbox",o.dataset.requiredKind=e;let r=document.createElement("span");r.dataset.requiredKindLabel=e,i.append(o,r);let n=document.createElement("label");n.className="lia-electro-export-quiz-count";let s=document.createElement("span");s.dataset.role="dialog-quiz-count";let a=document.createElement("input");a.type="number",a.min="1",a.max="99",a.step="1",a.value="1",a.disabled=!0,a.dataset.requiredKindCount=e,n.append(s,a),t.append(i,n),$.appendChild(t),this.dialogQuizRequiredInputs.set(e,{checkbox:o,count:a}),o.addEventListener("change",()=>this.refreshDialogQuizControls())}),O.append(A,B,$);let N=document.createElement("div");N.className="lia-electro-export-quiz-policies";let R=document.createElement("label");R.className="lia-electro-export-quiz-option",this.dialogQuizPreserveInput=document.createElement("input"),this.dialogQuizPreserveInput.type="checkbox",this.dialogQuizPreserveInput.checked=!0;let q=document.createElement("span");q.dataset.role="dialog-quiz-preserve",R.append(this.dialogQuizPreserveInput,q);let D=document.createElement("label");D.className="lia-electro-export-quiz-option",this.dialogQuizChangedInput=document.createElement("input"),this.dialogQuizChangedInput.type="checkbox",this.dialogQuizChangedInput.checked=!0;let Q=document.createElement("span");Q.dataset.role="dialog-quiz-changed",D.append(this.dialogQuizChangedInput,Q),N.append(R,D),this.dialogQuizError=document.createElement("p"),this.dialogQuizError.className="lia-electro-export-quiz-error",this.dialogQuizError.setAttribute("role","alert"),this.dialogQuizError.hidden=!0,k.append(z,this.dialogQuizComponentField,this.dialogQuizTargetField,this.dialogQuizToleranceField,this.dialogQuizMagnitudeField,O,N),this.dialogQuizStep.append(this.dialogQuizHint,S,k,this.dialogQuizError),this.dialogQuizEnabledInput.addEventListener("change",()=>this.refreshDialogQuizControls()),this.dialogQuizConditionSelect.addEventListener("change",()=>this.refreshDialogQuizControls(!0)),this.dialogMacroStep=document.createElement("div"),this.dialogMacroStep.className="lia-electro-export-step lia-electro-export-macro-step",this.dialogMacroStep.hidden=!0,this.dialogMacroStep.inert=!0,this.dialogTextarea=document.createElement("textarea"),this.dialogTextarea.className="lia-electro-export-textarea",this.dialogTextarea.spellcheck=!1,this.dialogTextarea.readOnly=!0,this.dialogTextarea.tabIndex=-1;let _=document.createElement("p");_.id=`lia-electro-export-help-${this.uid}`,_.className="lia-electro-export-hint",_.dataset.role="dialog-help",this.dialogMacroStep.append(this.dialogTextarea,_);let V=document.createElement("div");V.className="lia-electro-dialog-actions",this.dialogBackButton=this.dialogButton("back"),this.dialogCopyButton=this.dialogButton("copy"),this.dialogCopyButton.dataset.primary="1",this.dialogDownloadButton=this.dialogButton("download"),this.dialogCloseButton=this.dialogButton("close"),V.append(this.dialogBackButton,this.dialogDownloadButton,this.dialogCloseButton,this.dialogCopyButton),V.addEventListener("click",e=>this.onDialogClick(e)),this.dialog.append(this.dialogTitle,this.dialogComponentsStep,this.dialogQuizStep,this.dialogMacroStep,V),this.dialogBackdrop.appendChild(this.dialog),this.container.append(this.toolbar,this.palette,this.status,this.objectListClip,this.propertiesClip,this.dialogBackdrop),this.refreshInterfaceText()}addToolbarButton(e,t,i=!1){let o=document.createElement("button");o.type="button",o.dataset.action=e,o.innerHTML=t,i&&o.setAttribute("aria-pressed","false"),this.buttons.set(e,o),this.toolbar.appendChild(o)}dialogButton(e){let t=document.createElement("button");return t.type="button",t.dataset.dialogAction=e,t}addSeparator(){let e=document.createElement("span");e.className="lia-electro-separator",e.setAttribute("aria-hidden","true"),this.toolbar.appendChild(e)}refreshInterfaceText(){let e=y[this.language],t={components:e.components,select:e.select,wire:e.wire,rotate:e.rotate,properties:e.properties,remove:e.remove,undo:e.undo,redo:e.redo,objectList:e.objectList,clear:this.isBaselineProtectionEnabled()?e.clearBaseline:e.clear};this.buttons.forEach((e,i)=>{e.title=t[i]||i,e.setAttribute("aria-label",t[i]||i)}),this.palette.setAttribute("aria-label",e.components),this.palette.querySelectorAll("button[data-symbol]").forEach(e=>{let t=e.dataset.symbol,i=m.SYMBOL_BY_ID[t].label[this.language];e.title=i,e.setAttribute("aria-label",i);let o=e.querySelector("span");o&&(o.textContent=i)}),this.objectListPanel.setAttribute("aria-label",e.objectList),this.objectListTitle.textContent=e.objectList,this.objectListCloseButton.setAttribute("aria-label",e.closeObjectList),this.objectListExportButton.textContent=e.export,this.objectListExportButton.title=e.exchange,this.objectListExportButton.setAttribute("aria-label",e.exchange),this.propertiesPanel.setAttribute("aria-label",e.propertiesTitle),this.propertiesNameInput.setAttribute("aria-label",e.nameLabel),this.propertiesNameInput.placeholder=e.nameLabel,this.propertiesCloseButton.setAttribute("aria-label",e.closeProperties);let i=this.propertiesPanel.querySelector('[data-role="properties-measurement-label"]');i&&(i.textContent=e.showMeasurement);let o=this.propertiesPanel.querySelector('[data-role="properties-lock-label"]');o&&(o.textContent=e.lockComponent);let r=this.propertyComponentId?this.history.document.components.find(e=>e.id===this.propertyComponentId):null;this.refreshPropertyValueText(r||null),this.refreshLockControl(r||null),this.refreshMeasurementControl(r||null),this.propertiesType.textContent=r?e.componentType(m.SYMBOL_BY_ID[r.kind].label[this.language]):"";let n=this.propertiesPanel.querySelector('[data-role="physics-title"]');n&&(n.textContent=e.physicsTitle),this.refreshPhysicsPanel(),this.dialogComponentsHint.textContent=e.exportComponentsHint;let s=this.dialogBackdrop.querySelector('[data-role="dialog-help"]');s&&(s.textContent=e.dialogHelp),this.dialogBackdrop.querySelectorAll("[data-export-group]").forEach(t=>{let i=t.dataset.exportGroup;t.textContent=e.exportGroups[i]||i});let a=this.dialogBackdrop.querySelector('[data-role="dialog-restrictions-title"]');a&&(a.textContent=e.exportRestrictionsTitle);let l={"all-properties":e.restrictAllProperties,"macro-properties":e.restrictMacroProperties,baseline:e.restrictBaseline,measurements:e.restrictMeasurements,export:e.restrictExport};this.dialogBackdrop.querySelectorAll("[data-export-restriction]").forEach(e=>{let t=e.dataset.exportRestriction;e.textContent=l[t]||t}),this.dialogQuizHint.textContent=e.exportQuizHint;let c={"dialog-quiz-enable":e.quizEnable,"dialog-quiz-condition":e.quizCondition,"dialog-quiz-component":e.quizMeter,"dialog-quiz-target":e.quizTarget,"dialog-quiz-tolerance":e.quizTolerance,"dialog-quiz-magnitude":e.quizMagnitude,"dialog-quiz-required-title":e.quizRequiredTitle,"dialog-quiz-required-hint":e.quizRequiredHint,"dialog-quiz-count":e.quizCount,"dialog-quiz-preserve":e.quizPreserve,"dialog-quiz-changed":e.quizChanged};this.dialogQuizStep.querySelectorAll("[data-role]").forEach(e=>{let t=c[e.dataset.role||""];t&&(e.textContent=t)}),this.dialogQuizConditionSelect.querySelectorAll("option[data-condition]").forEach(t=>{let i=t.dataset.condition;t.textContent=e.quizConditions[i]}),this.dialogQuizRequiredInputs.forEach(({checkbox:t,count:i},o)=>{let r=this.dialogQuizStep.querySelector(`[data-required-kind-label="${o}"]`);r&&(r.textContent=m.SYMBOL_BY_ID[o].label[this.language]),t.setAttribute("aria-label",m.SYMBOL_BY_ID[o].label[this.language]),i.setAttribute("aria-label",`${e.quizCount}: ${m.SYMBOL_BY_ID[o].label[this.language]}`)}),this.dialogTextarea.setAttribute("aria-label",e.dialogTitle),this.dialogBackButton.textContent=e.back,this.dialogDownloadButton.textContent=e.download,this.dialogCloseButton.textContent=e.close,this.refreshDialogQuizControls(),this.renderDialogSelection(),this.refreshDialogStep(!1),this.applyRuntimeProfile(),this.refreshObjectList(!0),this.updateStatus()}bindEvents(){this.container.addEventListener("pointerdown",this.handlePointerDown,!0),this.container.addEventListener("pointermove",this.handlePointerMove,!0),this.container.addEventListener("pointerup",this.handlePointerUp,!0),this.container.addEventListener("pointercancel",this.handlePointerCancel,!0),this.container.addEventListener("contextmenu",this.handleContextMenu,!0),this.container.addEventListener("keydown",this.handleKeyDown,!0)}createPreviewCurve(){try{this.previewCurve=this.board.create("curve",[[],[]],{fixed:!0,highlight:!1,strokeWidth:2.6,dash:2,layer:8,visible:!1}),this.previewCurve.updateDataArray=()=>{let e=this.getPreviewRoute();this.previewCurve.dataX=e.map(e=>e[0]),this.previewCurve.dataY=e.map(e=>e[1])}}catch(e){this.previewCurve=null}}reconcileRenders(){this.dcAnalysis=(0,c.analyzeDcCircuit)(this.history.document);let e=new Map(this.history.document.components.map(e=>[e.id,e])),t=new Set(this.history.document.wires.map(e=>e.id));this.propertyComponentId&&!e.has(this.propertyComponentId)&&this.closeProperties(!1),this.componentRenders.forEach((t,i)=>{let o=e.get(i);o&&o.kind===t.kind||(this.removeBoardObjects([t.curve,t.selection,...t.terminals,...t.labels]),this.componentRenders.delete(i))}),this.wireRenders.forEach((e,i)=>{t.has(i)||(this.removeBoardObjects([e.curve]),this.wireRenders.delete(i))}),this.history.document.components.forEach(e=>{this.componentRenders.has(e.id)||this.createComponentRender(e)}),this.history.document.wires.forEach(e=>{this.wireRenders.has(e.id)||this.createWireRender(e)}),this.updateRenderAttributes(),this.updateButtons(),this.updatePreviewVisibility(),this.refreshPhysicsPanel();let i=this.propertyComponentId&&this.history.document.components.find(e=>e.id===this.propertyComponentId)||null;this.refreshLockControl(i),this.refreshMeasurementControl(i),this.refreshObjectList(),this.updateStatus();try{this.board.update()}catch(e){}}createComponentRender(e){let t=m.SYMBOL_BY_ID[e.kind],i=[];try{let o=this.board.create("curve",[[],[]],{fixed:!0,highlight:!0,strokeWidth:3,highlightStrokeWidth:4.2,layer:9});i.push(o),o.updateDataArray=()=>{let i=this.getComponentView(e.id);if(!i){o.dataX=[],o.dataY=[];return}let r=[],n=[];t.paths.forEach((e,t)=>{t>0&&(r.push(NaN),n.push(NaN)),e.forEach(e=>{let t=(0,m.transformPoint)(e,i.at[0],i.at[1],i.rotation);r.push(t[0]),n.push(t[1])})}),o.dataX=r,o.dataY=n};let r=this.board.create("curve",[[],[]],{fixed:!0,highlight:!1,strokeWidth:2.1,dash:2,layer:11,visible:!1});i.push(r),r.updateDataArray=()=>{let i=this.getComponentView(e.id);if(!i){r.dataX=[],r.dataY=[];return}let[o,n,s,a]=t.bounds,l=[[o-.13,n-.13],[s+.13,n-.13],[s+.13,a+.13],[o-.13,a+.13],[o-.13,n-.13]].map(e=>(0,m.transformPoint)(e,i.at[0],i.at[1],i.rotation));r.dataX=l.map(e=>e[0]),r.dataY=l.map(e=>e[1])};let n=t.terminals.map(t=>{let o=this.board.create("point",[()=>this.getTerminalPoint(e.id,t.id)[0],()=>this.getTerminalPoint(e.id,t.id)[1]],{name:"",withLabel:!1,fixed:!0,highlight:!0,showInfobox:!1,face:"o",size:2.7,strokeWidth:2,layer:12});return i.push(o),o}),s=this.board.create("text",[()=>this.getComponentLabelPlacement(e.id,"name").point[0],()=>this.getComponentLabelPlacement(e.id,"name").point[1],()=>(0,a.renderComponentLabel)(this.getComponentView(e.id)?.name)],{display:"html",parse:!1,useMathJax:!0,fixed:!0,highlight:!1,anchorX:"middle",anchorY:"bottom",fontSize:14,layer:10});i.push(s);let l=this.board.create("text",[()=>this.getComponentLabelPlacement(e.id,"value").point[0],()=>this.getComponentLabelPlacement(e.id,"value").point[1],()=>this.renderComponentValue(e.id)],{display:"html",parse:!1,useMathJax:!0,fixed:!0,highlight:!1,anchorX:"middle",anchorY:"top",fontSize:"ammeter"===e.kind||"voltmeter"===e.kind?14:13,layer:10});i.push(l),this.componentRenders.set(e.id,{kind:e.kind,curve:o,selection:r,terminals:n,labels:[s,l]})}catch(t){this.removeBoardObjects(i),console.warn("[lia-electro] Could not render component",e.id,t)}}createWireRender(e){try{let t=this.board.create("curve",[[],[]],{fixed:!0,highlight:!0,strokeWidth:2.6,highlightStrokeWidth:4,layer:6});t.updateDataArray=()=>{let i=this.history.document.wires.find(t=>t.id===e.id),o=i?(0,u.routeWire)(this.getViewComponents(),i,this.history.document.settings.wireStub):[];t.dataX=o.map(e=>e[0]),t.dataY=o.map(e=>e[1])},this.wireRenders.set(e.id,{curve:t})}catch(t){console.warn("[lia-electro] Could not render wire",e.id,t)}}updateRenderAttributes(e=this.getTheme()){this.componentRenders.forEach((t,i)=>{let o=this.selection?.type==="component"&&this.selection.id===i,r=[this.getComponentLabelPlacement(i,"name"),this.getComponentLabelPlacement(i,"value")];this.setObjectAttributes(t.curve,{strokeColor:e.foreground,highlightStrokeColor:e.action,strokeWidth:o?3.4:3}),this.setObjectAttributes(t.selection,{strokeColor:e.action,visible:o}),this.setObjectVisible(t.selection,o),t.terminals.forEach(t=>this.setObjectAttributes(t,{strokeColor:"wire"===this.tool?e.action:e.foreground,fillColor:e.surface,highlightStrokeColor:e.action,highlightFillColor:e.surface})),t.labels.forEach((t,i)=>this.setObjectAttributes(t,{strokeColor:e.foreground,highlightStrokeColor:e.foreground,anchorX:r[i]?.anchorX||"middle",anchorY:r[i]?.anchorY||"middle"}))}),this.wireRenders.forEach((t,i)=>{let o=this.selection?.type==="wire"&&this.selection.id===i;this.setObjectAttributes(t.curve,{strokeColor:o?e.action:e.foreground,highlightStrokeColor:e.action,strokeWidth:o?3.8:2.6})}),this.previewCurve&&this.setObjectAttributes(this.previewCurve,{strokeColor:e.action})}applyTheme(){let e=this.getTheme();this.container.dataset.liaElectroMode=e.mode,[this.toolbar,this.palette,this.status,this.objectListClip,this.propertiesClip,this.dialogBackdrop].forEach(t=>{t.dataset.liaElectroMode=e.mode,t.style.colorScheme=e.mode,t.style.setProperty("--lia-electro-neutral",e.foreground),t.style.setProperty("--lia-electro-accent",e.accent),t.style.setProperty("--lia-electro-action",e.action),t.style.setProperty("--lia-electro-surface",e.surface),t.style.setProperty("--lia-electro-surface-muted",e.surfaceMuted),t.style.setProperty("--lia-electro-on-accent",e.onAccent),t.style.setProperty("--lia-electro-shadow",e.shadow),t.style.setProperty("--lia-electro-backdrop",e.backdrop),t.style.setProperty("--lia-electro-terminal-fill",e.surface)}),this.updateRenderAttributes(e);try{this.board.update()}catch(e){}}onToolbarClick(e){let t=e.target?.closest("button[data-action]");if(t)switch(t.dataset.action){case"components":this.palette.hidden=!this.palette.hidden,t.setAttribute("aria-expanded",String(!this.palette.hidden));break;case"select":this.setTool("select");break;case"wire":this.setTool("wire");break;case"rotate":this.rotateSelection();break;case"properties":if(this.selection?.type!=="component")break;this.openProperties(this.selection.id,t);break;case"remove":this.deleteSelection();break;case"undo":this.undo();break;case"redo":this.redo();break;case"objectList":this.palette.hidden=!0,this.buttons.get("components")?.setAttribute("aria-expanded","false"),this.setTool("select"),this.setObjectListOpen(!this.isObjectListOpen(),!1);break;case"clear":this.clearCircuit()}}onPaletteClick(e){let t=e.target?.closest("button[data-symbol]");if(!t)return;let i=t.dataset.symbol;(0,n.isComponentAllowed)(this.config,i)&&(this.setTool("place",i),this.palette.hidden=!0,this.buttons.get("components")?.setAttribute("aria-expanded","false"))}onDialogClick(e){let t=e.target?.closest("button[data-dialog-action]");if(t)switch(t.dataset.dialogAction){case"back":this.setDialogStep("macro"===this.dialogStep?"quiz":"components");break;case"copy":"components"===this.dialogStep?this.setDialogStep("quiz"):"quiz"===this.dialogStep?this.commitDialogQuiz()&&this.setDialogStep("macro"):this.copyDialogText();break;case"download":"macro"===this.dialogStep&&this.downloadMacros(this.dialogTextarea.value);break;case"close":this.closeDialog()}}onContextMenu(e){if(this.destroyed||this.isInterfaceEvent(e))return;let t=this.eventToPointer(e);if(!t)return;let i=this.findComponentAt(t.user);if(!i){this.isPropertiesOpen()&&(this.consumePointerEvent(e),this.closeProperties(!1));return}if(this.consumePointerEvent(e),!this.canOpenProperties(i)){this.closeProperties(!1),this.select({type:"component",id:i.id}),this.setStatus(this.isProtectedComponent(i)?y[this.language].protectedObject:y[this.language].propertiesRestricted);return}this.openProperties(i.id,this.container)}onPointerDown(e){if(this.destroyed||this.isInterfaceEvent(e)||e.button>0)return;let t=this.eventToPointer(e);if(!t)return;try{this.container.focus({preventScroll:!0})}catch(e){}if("place"===this.tool&&this.placementKind){this.consumePointerEvent(e),this.addComponent(this.placementKind,t.user);return}if("wire"===this.tool){this.consumePointerEvent(e);let i=this.findTerminalAt(t.localX,t.localY);i&&this.handleWireTerminal(i);return}let i=this.findComponentAt(t.user);if(i){if(this.consumePointerEvent(e),this.select({type:"component",id:i.id}),!0===i.locked||this.isProtectedComponent(i))return;this.drag={componentId:i.id,pointerId:e.pointerId,offset:[t.user[0]-i.at[0],t.user[1]-i.at[1]]};try{this.container.setPointerCapture(e.pointerId)}catch(e){}return}let o=this.findWireAt(t.localX,t.localY);if(o){this.consumePointerEvent(e),this.select({type:"wire",id:o.id});return}this.select(null)}onPointerMove(e){let t=this.eventToPointer(e);if(t){if(this.drag&&this.drag.pointerId===e.pointerId){this.consumePointerEvent(e);let i=this.history.document.components.find(e=>e.id===this.drag.componentId);if(!i||!0===i.locked||this.isProtectedComponent(i)){this.transientPositions.delete(this.drag.componentId),this.drag=null;try{this.container.releasePointerCapture(e.pointerId)}catch(e){}try{this.board.update()}catch(e){}return}let o=(0,p.snapPoint)([t.user[0]-this.drag.offset[0],t.user[1]-this.drag.offset[1]],this.history.document.settings.snapStep);this.transientPositions.set(this.drag.componentId,o);try{this.board.update()}catch(e){}return}if("wire"===this.tool&&this.pendingWire){this.pointerPreview=(0,p.snapPoint)(t.user,this.history.document.settings.snapStep),this.updatePreviewVisibility();try{this.board.update()}catch(e){}}}}onPointerUp(e){if(!this.drag||this.drag.pointerId!==e.pointerId)return;this.consumePointerEvent(e);let t=this.drag.componentId,i=this.transientPositions.get(t);this.drag=null,this.transientPositions.delete(t);try{this.container.releasePointerCapture(e.pointerId)}catch(e){}if(!i)return;let o=this.document,r=o.components.find(e=>e.id===t);!r||!0===r.locked||this.isProtectedComponent(r)||(r.at=i,this.commit(o))}onPointerCancel(e){if(this.drag&&this.drag.pointerId===e.pointerId){this.transientPositions.delete(this.drag.componentId),this.drag=null;try{this.board.update()}catch(e){}}}onKeyDown(e){var t;let i=e.key.toLowerCase();if(!this.dialogBackdrop.hidden){if("escape"===i){e.preventDefault(),e.stopPropagation(),this.closeDialog();return}return"tab"===i?void this.trapDialogFocus(e):void(this.dialogBackdrop.contains(e.target)||(e.preventDefault(),this.dialogFocusableElements()[0]?.focus()))}if(this.propertiesPanel.contains(e.target))return;if(this.objectListPanel.contains(e.target)){"escape"===i&&(e.preventDefault(),e.stopPropagation(),this.setObjectListOpen(!1,!0));return}if((t=e.target)&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;if("ContextMenu"===e.key||e.shiftKey&&"F10"===e.key){if(this.selection?.type!=="component")return;e.preventDefault(),e.stopPropagation(),this.openProperties(this.selection.id,this.container);return}let o=e.ctrlKey||e.metaKey;if(o&&"z"===i){e.preventDefault(),e.shiftKey?this.redo():this.undo();return}if(o&&"y"===i){e.preventDefault(),this.redo();return}switch(i){case"escape":this.dialogBackdrop.hidden?this.pendingWire?this.cancelPendingWire():this.isObjectListOpen()?this.setObjectListOpen(!1,!0):this.setTool("select"):this.closeDialog();break;case"delete":case"backspace":e.preventDefault(),this.deleteSelection();break;case"r":e.preventDefault(),this.rotateSelection();break;case"w":e.preventDefault(),this.setTool("wire");break;case"v":e.preventDefault(),this.setTool("select");break;case" ":if(this.pendingWire){e.preventDefault(),this.pendingWire.route=k(this.pendingWire.route);try{this.board.update()}catch(e){}}}}addComponent(e,t){if(!(0,n.isComponentAllowed)(this.config,e))return void this.setTool("select");let i=this.document,o={id:(0,p.nextEntityId)("c",i.components.map(e=>e.id)),kind:e,at:(0,p.snapPoint)(t,i.settings.snapStep),rotation:0,origin:"editor"};i.components.push(o),this.selection={type:"component",id:o.id},this.commit(i)}handleWireTerminal(e){let t=y[this.language];if(!this.pendingWire){let t=(0,u.resolvePort)(this.getViewComponents(),e);if(!t)return;this.pendingWire={from:e,route:(0,u.defaultRouteForDirection)(t.direction)},this.pointerPreview=t.point,this.updatePreviewVisibility(),this.updateStatus();return}if((0,p.samePort)(this.pendingWire.from,e))return void this.setStatus(t.samePort);if(this.history.document.wires.some(t=>(0,p.samePort)(t.from,this.pendingWire.from)&&(0,p.samePort)(t.to,e)||(0,p.samePort)(t.to,this.pendingWire.from)&&(0,p.samePort)(t.from,e)))return void this.setStatus(t.duplicateWire);let i=this.document,o={id:(0,p.nextEntityId)("w",i.wires.map(e=>e.id)),from:{...this.pendingWire.from},to:{...e},route:this.pendingWire.route};i.wires.push(o),this.pendingWire=null,this.pointerPreview=null,this.selection={type:"wire",id:o.id},this.commit(i)}rotateSelection(){if(!this.selection)return;let e=this.document;if("component"===this.selection.type){let t=e.components.find(e=>e.id===this.selection.id);if(!t)return;if(this.isProtectedComponent(t))return void this.setStatus(y[this.language].protectedObject);if(!0===t.locked)return void this.setStatus(y[this.language].selectedLockedComponent(m.SYMBOL_BY_ID[t.kind].label[this.language]));t.rotation=(0,m.normalizeRotation)(t.rotation+90)}else{let t=e.wires.find(e=>e.id===this.selection.id);if(!t)return;if(this.isProtectedWire(t))return void this.setStatus(y[this.language].protectedObject);t.route=k(t.route)}this.commit(e)}deleteSelection(){if(this.closeProperties(!1),!this.selection)return void this.setStatus(y[this.language].emptyStatus);if(this.isSelectionProtected())return void this.setStatus(y[this.language].protectedObject);let e=this.document;if("component"===this.selection.type){let t=this.selection.id;e.components=e.components.filter(e=>e.id!==t),e.wires=e.wires.filter(e=>e.from.componentId!==t&&e.to.componentId!==t)}else e.wires=e.wires.filter(e=>e.id!==this.selection.id);this.selection=null,this.commit(e)}clearCircuit(){this.closeProperties(!1);let e=this.history.document,t=this.isBaselineProtectionEnabled(),i=t?(0,p.cloneCircuit)(this.baseline):(0,p.createEmptyCircuit)(e.settings);I(e,i)?this.setStatus(t?y[this.language].noAdditions:y[this.language].emptyStatus):window.confirm(t?y[this.language].clearBaselineConfirm:y[this.language].clearConfirm)&&(this.selection=null,this.cancelPendingWire(),this.commit(i))}setTool(e,t=null){"place"!==e||t&&(0,n.isComponentAllowed)(this.config,t)||(e="select",t=null),this.tool=e,this.placementKind="place"===e?t:null,"wire"!==e&&this.cancelPendingWire(),this.buttons.get("select")?.setAttribute("aria-pressed",String("select"===e)),this.buttons.get("wire")?.setAttribute("aria-pressed",String("wire"===e)),this.palette.querySelectorAll("button[data-symbol]").forEach(i=>{i.setAttribute("aria-pressed",String("place"===e&&i.dataset.symbol===t))}),this.updateRenderAttributes(),this.updatePreviewVisibility(),this.updateStatus();try{this.board.update()}catch(e){}}select(e){this.propertyComponentId&&(e?.type!=="component"||e.id!==this.propertyComponentId)&&this.closeProperties(!1),this.selection=e,this.updateRenderAttributes(),this.updateButtons(),this.updateObjectListSelection(),this.updateStatus();try{this.board.update()}catch(e){}}commit(e){let t=(0,h.validateCircuit)(e);if(!this.preservesProtectedEntities(t)){this.reconcileRenders(),this.setStatus(y[this.language].protectedObject);return}this.history.commit(t)&&this.persist(),this.reconcileRenders()}persist(){window.__electroDocuments=window.__electroDocuments||{},window.__electroDocuments[this.boardId]=this.document}isBaselineProtectionEnabled(){return(0,n.hasElectroRestriction)(this.config,n.ELECTRO_RESTRICTIONS.baselineLocked)}isProtectedComponent(e){return!!e&&!!this.isBaselineProtectionEnabled()&&("macro"===e.origin||this.baseline.components.some(t=>t.id===e.id))}isProtectedWire(e){return!!e&&!!this.isBaselineProtectionEnabled()&&this.baseline.wires.some(t=>t.id===e.id)}isSelectionProtected(){return!!this.selection&&!!this.isBaselineProtectionEnabled()&&("component"===this.selection.type?this.isProtectedComponent(this.history.document.components.find(e=>e.id===this.selection.id)):this.isProtectedWire(this.history.document.wires.find(e=>e.id===this.selection.id)))}restoreBaselineEntities(e){let t=(0,p.cloneCircuit)(e),i=(0,p.cloneCircuit)(this.baseline),o=new Set(i.components.map(e=>e.id)),r=new Set(i.wires.map(e=>e.id));return t.components=[...i.components,...t.components.filter(e=>!o.has(e.id))],t.wires=[...i.wires,...t.wires.filter(e=>!r.has(e.id))],t}preservesProtectedEntities(e){var t,i,o,r;if(!this.isBaselineProtectionEnabled())return!0;let n=new Map(this.baseline.components.map(e=>[e.id,e]));for(let o of(this.history.document.components.forEach(e=>{"macro"!==e.origin||n.has(e.id)||n.set(e.id,e)}),n.values())){let r=e.components.find(e=>e.id===o.id);if(!r||(t=r,i=o,t.id!==i.id||t.kind!==i.kind||t.at[0]!==i.at[0]||t.at[1]!==i.at[1]||t.rotation!==i.rotation||t.name!==i.name||t.value!==i.value||t.showMeasurement!==i.showMeasurement||t.locked!==i.locked||t.origin!==i.origin))return!1}for(let t of this.baseline.wires){let i=e.wires.find(e=>e.id===t.id);if(!i||(o=i,r=t,!(o.id===r.id&&(0,p.samePort)(o.from,r.from)&&(0,p.samePort)(o.to,r.to))||o.route!==r.route))return!1}return!0}cancelPendingWire(){this.pendingWire=null,this.pointerPreview=null,this.updatePreviewVisibility()}applyRuntimeProfile(){if(!this.palette||!this.objectListExportButton)return;let e=!1;this.palette.querySelectorAll("button[data-symbol]").forEach(t=>{let i=t.dataset.symbol,o=(0,n.isComponentAllowed)(this.config,i);e||=o,t.hidden=!o,t.disabled=!o,t.tabIndex=o?0:-1,t.setAttribute("aria-hidden",String(!o))});let t=this.buttons.get("components");t&&(t.disabled=!e),e||(this.palette.hidden=!0,t?.setAttribute("aria-expanded","false")),"place"!==this.tool||this.placementKind&&(0,n.isComponentAllowed)(this.config,this.placementKind)||this.setTool("select");let i=this.propertyComponentId&&this.history.document.components.find(e=>e.id===this.propertyComponentId)||null;i&&!this.canOpenProperties(i)&&this.closeProperties(!1),this.refreshMeasurementControl(i);let o=(0,n.hasElectroRestriction)(this.config,n.ELECTRO_RESTRICTIONS.exportLocked);this.objectListExportButton.hidden=o,this.objectListExportButton.disabled=o,this.objectListExportButton.parentElement?.toggleAttribute("hidden",o),this.objectListExportButton.tabIndex=this.isObjectListOpen()&&!o?0:-1,o&&!this.dialogBackdrop.hidden&&this.closeDialog(),this.objectListSignature="",this.refreshObjectList(!0),this.updateButtons(),this.updateStatus();try{this.board.update()}catch(e){}}currentDialogProfile(){return{componentIds:new Set(this.dialogSelectedComponentIds),restrictionIds:new Set(this.dialogSelectedRestrictionIds),completionQuizSpec:this.dialogCompletionQuizSpec||null}}initializeDialogQuiz(){let e=null;try{this.completionQuizSpec&&(e=(0,d.parseCompletionRule)(this.completionQuizSpec))}catch(e){}this.dialogQuizEnabledInput.checked=!!e,this.dialogQuizConditionSelect.value=e?.condition||"closed",this.dialogQuizComponentSelect.dataset.preferred=e?.componentId||"",this.dialogQuizTargetInput.value=e?.target==null?"":String(e.target),this.dialogQuizToleranceInput.value=e?.target==null?"":String(e.tolerance),this.dialogQuizMagnitudeInput.checked=e?.magnitude!==!1,this.dialogQuizPreserveInput.checked=e?.preserveBaseline!==!1,this.dialogQuizChangedInput.checked=e?.requireChange!==!1,this.dialogQuizRequiredInputs.forEach(({checkbox:t,count:i},o)=>{let r=e?.requiredAdded.get(o)||0;t.checked=r>0,i.value=String(r||1)}),this.dialogCompletionQuizSpec=e?(0,d.formatCompletionRule)(e,this.boardId):void 0,this.dialogQuizError.hidden=!0,this.dialogQuizError.textContent="",this.dialogQuizError.title="",this.refreshDialogQuizControls(!0)}refreshDialogQuizControls(e=!1){if(!this.dialogQuizStep)return;let t=y[this.language],i=this.dialogQuizEnabledInput.checked,o=x.includes(this.dialogQuizConditionSelect.value)?this.dialogQuizConditionSelect.value:"closed",r="ammeter-current"===o?"ammeter":"voltmeter-voltage"===o?"voltmeter":null,n="closed"!==o,s=this.dialogQuizStep.querySelector('[data-role="dialog-quiz-fields"]');if(s?.toggleAttribute("data-disabled",!i),s?.setAttribute("aria-disabled",String(!i)),this.dialogQuizConditionSelect.disabled=!i,this.dialogQuizComponentField.hidden=!r,this.dialogQuizComponentSelect.disabled=!i||!r,this.dialogQuizTargetField.hidden=!n,this.dialogQuizTargetInput.disabled=!i||!n,this.dialogQuizToleranceField.hidden=!n,this.dialogQuizToleranceInput.disabled=!i||!n,this.dialogQuizMagnitudeField.hidden=!r,this.dialogQuizMagnitudeInput.disabled=!i||this.dialogQuizMagnitudeField.hidden,this.dialogQuizPreserveInput.disabled=!i,this.dialogQuizChangedInput.disabled=!i,e||this.dialogQuizComponentSelect.dataset.meterKind!==String(r||"")){let e=this.dialogQuizComponentSelect.dataset.preferred||this.dialogQuizComponentSelect.value;this.dialogQuizComponentSelect.replaceChildren();let i=r?this.history.document.components.filter(e=>e.kind===r):[];if(0===i.length){let e=document.createElement("option");e.value="",e.textContent=t.quizNoMeter,this.dialogQuizComponentSelect.appendChild(e)}else i.forEach(e=>{let t=document.createElement("option");t.value=e.id,t.textContent=`${e.name||e.id} (${e.id})`,this.dialogQuizComponentSelect.appendChild(t)}),this.dialogQuizComponentSelect.value=i.some(t=>t.id===e)?e:i[0].id;this.dialogQuizComponentSelect.dataset.meterKind=r||"",delete this.dialogQuizComponentSelect.dataset.preferred}this.dialogQuizRequiredInputs.forEach(({checkbox:e,count:t})=>{e.disabled=!i,t.disabled=!i||!e.checked}),this.dialogQuizError.hidden=!0,this.dialogQuizError.textContent="",this.dialogQuizError.title=""}commitDialogQuiz(){if(this.dialogQuizError.hidden=!0,this.dialogQuizError.textContent="",this.dialogQuizError.title="",!this.dialogQuizEnabledInput.checked)return this.dialogCompletionQuizSpec=void 0,!0;let e=y[this.language],t=this.dialogQuizConditionSelect.value,i=this.history.document.components.find(e=>!v.includes(e.kind));if(i)return this.dialogQuizError.textContent=e.quizUnsupported(m.SYMBOL_BY_ID[i.kind].label[this.language]),this.dialogQuizError.hidden=!1,!1;let o="ammeter-current"===t||"voltmeter-voltage"===t,r="closed"!==t;if(o&&!this.dialogQuizComponentSelect.value)return this.dialogQuizError.textContent=e.quizMeterMissing,this.dialogQuizError.hidden=!1,this.dialogQuizComponentSelect.focus(),!1;if(r&&!this.dialogQuizTargetInput.value.trim())return this.dialogQuizError.textContent=e.quizInvalid,this.dialogQuizError.hidden=!1,this.dialogQuizTargetInput.focus(),!1;let s=[this.boardId,`condition=${t}`];o&&s.push(`component=${this.dialogQuizComponentSelect.value}`),r&&s.push(`target=${this.dialogQuizTargetInput.value.trim()}`),r&&this.dialogQuizToleranceInput.value.trim()&&s.push(`tolerance=${this.dialogQuizToleranceInput.value.trim()}`),o&&!this.dialogQuizMagnitudeInput.checked&&s.push("mode=signed");let a=[];for(let[t,i]of this.dialogQuizRequiredInputs){if(!i.checkbox.checked)continue;let o=Number(i.count.value);if(!Number.isSafeInteger(o)||o<1||o>99)return this.dialogQuizError.textContent=e.quizInvalid,this.dialogQuizError.hidden=!1,i.count.focus(),!1;a.push(`${t}:${o}`)}a.length>0&&s.push(`required=[${a.join(";")}]`),s.push(`preserve=${+!!this.dialogQuizPreserveInput.checked}`),s.push(`changed=${+!!this.dialogQuizChangedInput.checked}`);try{let e=(0,d.parseCompletionRule)(s.join(";"));return this.dialogCompletionQuizSpec=(0,d.formatCompletionRule)(e,this.boardId),e.requiredAdded.forEach((e,t)=>{this.dialogSelectedComponentIds.add(n.ELECTRO_COMPONENT_CAPABILITIES[t])}),e.preserveBaseline&&this.dialogSelectedRestrictionIds.add(n.ELECTRO_RESTRICTIONS.baselineLocked),this.renderDialogSelection(),!0}catch(t){return this.dialogQuizError.textContent=e.quizInvalid,this.dialogQuizError.title=t instanceof Error?t.message:"",this.dialogQuizError.hidden=!1,!1}}toggleDialogComponent(e){let t=n.ELECTRO_COMPONENT_CAPABILITIES[e];this.dialogSelectedComponentIds.has(t)?this.dialogSelectedComponentIds.delete(t):this.dialogSelectedComponentIds.add(t),this.renderDialogSelection()}toggleDialogRestriction(e,t){t?(e===n.ELECTRO_RESTRICTIONS.componentPropertiesLocked?this.dialogSelectedRestrictionIds.delete(n.ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked):e===n.ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked&&this.dialogSelectedRestrictionIds.delete(n.ELECTRO_RESTRICTIONS.componentPropertiesLocked),this.dialogSelectedRestrictionIds.add(e)):this.dialogSelectedRestrictionIds.delete(e),this.renderDialogSelection()}renderDialogSelection(){if(!this.dialogBackdrop)return;let e=y[this.language],t=!this.dialogBackdrop.hidden&&"components"===this.dialogStep;this.dialogComponentButtons.forEach((i,o)=>{let r=this.dialogSelectedComponentIds.has(n.ELECTRO_COMPONENT_CAPABILITIES[o]);i.dataset.enabled=r?"1":"0",i.setAttribute("aria-pressed",String(r));let s=m.SYMBOL_BY_ID[o].label[this.language];i.title=s,i.setAttribute("aria-label",`${s}: ${r?e.available:e.unavailable}`),i.tabIndex=t?0:-1;let a=i.querySelector(".lia-electro-export-component-status");a&&(a.textContent=r?"✓":"×")}),this.dialogRestrictionInputs.forEach((e,i)=>{e.checked=this.dialogSelectedRestrictionIds.has(i),e.tabIndex=t?0:-1})}setDialogStep(e){this.dialogStep=e,this.refreshDialogStep(!0)}refreshDialogStep(e){if(!this.dialog)return;let t=y[this.language],i="components"===this.dialogStep,o="quiz"===this.dialogStep,r="macro"===this.dialogStep,n=!this.dialogBackdrop.hidden;if(this.dialogComponentsStep.hidden=!i,this.dialogComponentsStep.inert=!i,this.dialogQuizStep.hidden=!o,this.dialogQuizStep.inert=!o,this.dialogMacroStep.hidden=!r,this.dialogMacroStep.inert=!r,this.dialogTitle.textContent=i?t.exportComponentsTitle:o?t.exportQuizTitle:t.dialogTitle,this.dialogCopyButton.textContent=r?t.copy:t.next,this.dialogBackButton.hidden=i,this.dialogDownloadButton.hidden=!r,this.dialogBackButton.tabIndex=n&&!i?0:-1,this.dialogDownloadButton.tabIndex=n&&r?0:-1,this.dialogCloseButton.tabIndex=n?0:-1,this.dialogCopyButton.tabIndex=n?0:-1,this.dialogTextarea.tabIndex=n&&r?0:-1,this.dialog.setAttribute("aria-describedby",i?this.dialogComponentsHint.id:o?this.dialogQuizHint.id:`lia-electro-export-help-${this.uid}`),this.renderDialogSelection(),o&&this.refreshDialogQuizControls(),n&&r&&(this.dialogTextarea.value=this.exportMacros(void 0,this.currentDialogProfile())),!e||!n)return;let s=this.dialogStep;window.setTimeout(()=>{this.dialogBackdrop.hidden||this.dialogStep!==s||(i?this.dialogComponentButtons.values().next().value?.focus():o?this.dialogQuizEnabledInput.focus():(this.dialogTextarea.focus(),this.dialogTextarea.select()))},0)}openDialog(e=this.container){(0,n.hasElectroRestriction)(this.config,n.ELECTRO_RESTRICTIONS.exportLocked)||(this.closeProperties(!1),this.dialogReturnFocus=e,this.dialogSelectedComponentIds=new Set(null===this.config.componentIds?Object.values(n.ELECTRO_COMPONENT_CAPABILITIES):this.config.componentIds),this.dialogSelectedRestrictionIds=new Set(this.config.restrictionIds),this.initializeDialogQuiz(),this.dialogBackdrop.hidden=!1,this.dialogBackdrop.inert=!1,this.dialogBackdrop.setAttribute("aria-hidden","false"),this.objectListExportButton.setAttribute("aria-expanded","true"),this.setDialogStep("components"))}dialogFocusableElements(){return Array.from(this.dialog.querySelectorAll("button, input, select, textarea")).filter(e=>e.tabIndex>=0&&!("disabled"in e&&e.disabled)&&!e.hidden&&!e.closest("[hidden]"))}trapDialogFocus(e){let t=this.dialogFocusableElements();if(!t.length)return;let i=this.dialogBackdrop.getRootNode().activeElement,o=t[0],r=t[t.length-1];t.includes(i)?e.shiftKey&&i===o?(e.preventDefault(),r.focus()):e.shiftKey||i!==r||(e.preventDefault(),o.focus()):(e.preventDefault(),o.focus())}closeDialog(){let e=!this.dialogBackdrop.hidden;this.dialogBackdrop.hidden=!0,this.dialogBackdrop.inert=!0,this.dialogBackdrop.setAttribute("aria-hidden","true"),this.dialogComponentButtons.forEach(e=>{e.tabIndex=-1}),this.dialogRestrictionInputs.forEach(e=>{e.tabIndex=-1}),this.dialogTextarea.tabIndex=-1,this.dialogBackButton.tabIndex=-1,this.dialogDownloadButton.tabIndex=-1,this.dialogCloseButton.tabIndex=-1,this.dialogCopyButton.tabIndex=-1,this.objectListExportButton.setAttribute("aria-expanded","false");let t=this.dialogReturnFocus;if(this.dialogReturnFocus=null,!e)return;let i=!t?.isConnected||"disabled"in t&&t.disabled||t.hidden?(this.isObjectListOpen()&&!this.objectListExportButton.hidden?this.objectListExportButton:this.buttons.get("objectList"))||this.container:t;try{i.focus({preventScroll:!0})}catch(e){}}copyDialogText(){let e=y[this.language],t=()=>{this.dialogTextarea.focus(),this.dialogTextarea.select();try{if("function"==typeof document.execCommand&&document.execCommand("copy"))return void this.markMacroCopied()}catch(e){}this.setStatus(e.copyFailed)};try{if(navigator.clipboard?.writeText)return void navigator.clipboard.writeText(this.dialogTextarea.value).then(()=>this.markMacroCopied()).catch(t)}catch(e){}t()}markMacroCopied(){let e=y[this.language],t=this.dialogBackdrop.querySelector('[data-dialog-action="copy"]');this.setStatus(e.copied),t&&(t.textContent=e.copied,window.setTimeout(()=>{t.textContent="macro"===this.dialogStep?y[this.language].copy:y[this.language].next},1200))}refreshPropertyValueText(e){let t=y[this.language],i=t.valueLabel,o=t.valuePlaceholder;e?.kind==="battery"||e?.kind==="voltage-source"?(i=t.sourceValueLabel,o=t.sourceValuePlaceholder):(e?.kind==="resistor"||e?.kind==="variable-resistor")&&(i=t.resistanceValueLabel,o=t.resistanceValuePlaceholder),this.propertiesValueInput.setAttribute("aria-label",i),this.propertiesValueInput.placeholder=o;let r=this.propertiesPanel.querySelector('[data-role="properties-value-label"]');r&&(r.textContent=i)}refreshMeasurementControl(e){if(!this.propertiesMeasurementField||!this.propertiesMeasurementInput)return;let t=e?.kind==="ammeter"||e?.kind==="voltmeter",i=(0,n.hasElectroRestriction)(this.config,n.ELECTRO_RESTRICTIONS.measurementControlsLocked);this.propertiesMeasurementField.hidden=!t||i,this.propertiesMeasurementInput.disabled=!t||i,this.propertiesMeasurementInput.checked=t&&!1!==e.showMeasurement,this.propertiesMeasurementInput.tabIndex=t&&!i&&this.isPropertiesOpen()?0:-1}refreshLockControl(e){this.propertiesLockInput&&(this.propertiesLockInput.checked=e?.locked===!0,this.propertiesLockInput.disabled=!e,this.propertiesLockInput.tabIndex=e&&this.isPropertiesOpen()?0:-1)}refreshPhysicsPanel(){if(!this.propertiesPhysicsStatus||!this.propertiesPhysicsValues)return;if(this.propertiesPhysicsValues.replaceChildren(),this.propertiesValueInput.setAttribute("aria-invalid","false"),!this.propertyComponentId){this.propertiesPhysicsStatus.dataset.status=this.dcAnalysis.status,this.propertiesPhysicsStatus.textContent=this.physicsStatusText(!1);return}let e=this.dcAnalysis.circuits.find(e=>e.componentIds.includes(this.propertyComponentId));if(!e){this.propertiesPhysicsStatus.dataset.status="no-source",this.propertiesPhysicsStatus.textContent=y[this.language].physicsNotConnected;return}this.propertiesPhysicsStatus.dataset.status=e.status,this.propertiesPhysicsStatus.textContent=this.physicsStatusText(!1,e.status,e.componentIds);let t=this.dcAnalysis.diagnostics.find(e=>e.componentId===this.propertyComponentId&&("missing-value"===e.code||"invalid-value"===e.code));this.propertiesValueInput.setAttribute("aria-invalid",String(!!t)),e?.voltageV!=null&&this.addPhysicsRow(y[this.language].totalVoltage,this.formatSi(e.voltageV,"V")),e?.equivalentResistanceOhm!=null&&this.addPhysicsRow(y[this.language].totalResistance,this.formatSi(e.equivalentResistanceOhm,"Ω")),e?.currentA!=null&&this.addPhysicsRow(y[this.language].totalCurrent,this.formatSi(e.currentA,"A"));let i=this.dcAnalysis.components.find(e=>e.componentId===this.propertyComponentId);i&&this.addComponentPhysicsRows(i)}addComponentPhysicsRows(e){let t=y[this.language],i=`(${e.fromPort} \u{2192} ${e.toPort})`;if("source"===e.role){null!=e.voltageV&&this.addPhysicsRow(`${t.componentVoltage} (+ \u{2192} \u{2212})`,this.formatSi(e.voltageV,"V")),null!=e.currentA&&this.addPhysicsRow(t.deliveredCurrent,this.formatSi(-e.currentA,"A")),null!=e.powerW&&this.addPhysicsRow(t.componentPower,this.formatSi(-e.powerW,"W"));return}if("resistor"===e.role){null!=e.voltageV&&this.addPhysicsRow(`${t.componentVoltage} ${i}`,this.formatSi(e.voltageV,"V")),null!=e.currentA&&this.addPhysicsRow(`${t.componentCurrent} ${i}`,this.formatSi(e.currentA,"A")),null!=e.powerW&&this.addPhysicsRow(t.componentPower,this.formatSi(e.powerW,"W"));return}"ammeter"===e.role&&null!=e.currentA&&this.addPhysicsRow(`${t.componentCurrent} ${i}`,this.formatSi(e.currentA,"A")),"voltmeter"===e.role&&null!=e.voltageV&&this.addPhysicsRow(`${t.componentVoltage} ${i}`,this.formatSi(e.voltageV,"V"))}addPhysicsRow(e,t){let i=document.createElement("dt");i.textContent=e;let o=document.createElement("dd"),r=document.createElement("output");r.textContent=t,o.appendChild(r),this.propertiesPhysicsValues.append(i,o)}physicsStatusText(e,t=this.dcAnalysis.status,i){let o,r=y[this.language],n=e=>!i||null!=e&&i.includes(e);switch(t){case"empty":return r.selectStatus;case"no-source":return r.physicsNoSource;case"solved":o=r.physicsSolved;break;case"open":return r.physicsOpen;case"short-circuit":return r.physicsShort;case"incomplete":{let e=this.dcAnalysis.diagnostics.find(e=>n(e.componentId)&&("missing-value"===e.code||"invalid-value"===e.code));return r.physicsIncomplete(this.physicsComponentName(e?.componentId))}case"unsupported":{let e=this.dcAnalysis.diagnostics.find(e=>n(e.componentId)&&"unsupported-component"===e.code);return r.physicsUnsupported(this.physicsComponentName(e?.componentId))}default:return r.physicsInvalid}if(!e)return o;let s=this.dcAnalysis.circuits[0];return s?.currentA!=null&&(o+=` \xb7 I = ${this.formatSi(s.currentA,"A")}`),s?.voltageV!=null&&(o+=` \xb7 U = ${this.formatSi(s.voltageV,"V")}`),o}physicsComponentName(e){let t=e?this.history.document.components.find(t=>t.id===e):null;if(!t)return"de"===this.language?"das Bauteil":"the component";let i=t.name?.trim();return i?.startsWith("$")&&i.endsWith("$")?i.slice(1,-1):i||m.SYMBOL_BY_ID[t.kind].label[this.language]}formatSi(e,t){let i=1e-14>Math.abs(e)?0:e,o=Math.abs(i),r=1,n="";o>=1e9?(r=1e9,n="G"):o>=1e6?(r=1e6,n="M"):o>=1e3?(r=1e3,n="k"):o>0&&o<1e-6?(r=1e-9,n="n"):o>0&&o<.001?(r=1e-6,n="µ"):o>0&&o<1&&(r=.001,n="m");let s=new Intl.NumberFormat("de"===this.language?"de-DE":"en-US",{maximumSignificantDigits:3}).format(i/r);return`${s} ${n}${t}`}openProperties(e,t){let i=this.history.document.components.find(t=>t.id===e);if(!i)return;if(!this.canOpenProperties(i)){this.closeProperties(!1),this.setStatus(this.isProtectedComponent(i)?y[this.language].protectedObject:y[this.language].propertiesRestricted);return}this.isObjectListOpen()&&this.container.getBoundingClientRect().width<520&&this.setObjectListOpen(!1,!1),this.palette.hidden=!0,this.buttons.get("components")?.setAttribute("aria-expanded","false"),this.setTool("select"),this.select({type:"component",id:e}),this.propertyComponentId=e,this.propertyReturnFocus=t,this.propertyReturnObjectKey=t.dataset.objectKey||null,this.propertiesNameInput.value=i.name||"",this.propertiesValueInput.value=i.value||"",this.propertiesNameInput.setCustomValidity(""),this.propertiesValueInput.setCustomValidity(""),this.propertiesNameInput.setAttribute("aria-invalid","false"),this.propertiesValueInput.setAttribute("aria-invalid","false");let o=y[this.language].componentType(m.SYMBOL_BY_ID[i.kind].label[this.language]);this.propertiesType.textContent=o,this.propertiesType.title=o,this.refreshPropertyValueText(i),this.refreshPhysicsPanel(),this.propertiesPanel.dataset.open="1",this.propertiesPanel.classList.add("is-open"),this.propertiesPanel.setAttribute("aria-hidden","false"),this.propertiesNameInput.tabIndex=0,this.propertiesValueInput.tabIndex=0,this.propertiesCloseButton.tabIndex=0,this.container.dataset.liaElectroPropertiesOpen="true",this.refreshLockControl(i),this.refreshMeasurementControl(i),this.updatePanelLayout(),this.buttons.get("properties")?.setAttribute("aria-expanded","true")}applyPropertyInput(e){if(!this.propertyComponentId)return!1;let t=this.history.document.components.find(e=>e.id===this.propertyComponentId);if(!t||!this.canOpenProperties(t))return("name"===e?this.propertiesNameInput:this.propertiesValueInput).value=t?.[e]||"",!1;let i=this.document,o=i.components.find(e=>e.id===this.propertyComponentId);if(!o)return!1;let r="name"===e?this.propertiesNameInput:this.propertiesValueInput,n=r.value.trim();n?o[e]=n:delete o[e];let s=m.SYMBOL_BY_ID[o.kind].label[this.language];try{this.commit(i);let t=this.history.document.components.find(e=>e.id===o.id);return r.value=t?.[e]||"",r.setAttribute("aria-invalid","false"),this.refreshPhysicsPanel(),this.setStatus(y[this.language].propertiesSaved(s)),!0}catch(t){return r.value=this.history.document.components.find(e=>e.id===o.id)?.[e]||"",r.setAttribute("aria-invalid","true"),!1}}applyMeasurementVisibility(){if(!this.propertyComponentId)return;if((0,n.hasElectroRestriction)(this.config,n.ELECTRO_RESTRICTIONS.measurementControlsLocked)){let e=this.history.document.components.find(e=>e.id===this.propertyComponentId)||null;this.refreshMeasurementControl(e);return}let e=this.document,t=e.components.find(e=>e.id===this.propertyComponentId);if(!t||!this.canOpenProperties(t)||"ammeter"!==t.kind&&"voltmeter"!==t.kind)return;this.propertiesMeasurementInput.checked?delete t.showMeasurement:t.showMeasurement=!1,this.commit(e);let i=this.history.document.components.find(e=>e.id===t.id)||null;this.refreshMeasurementControl(i),this.setStatus(y[this.language].propertiesSaved(m.SYMBOL_BY_ID[t.kind].label[this.language]))}applyComponentLock(){if(!this.propertyComponentId)return;let e=this.document,t=e.components.find(e=>e.id===this.propertyComponentId);if(!t||!this.canOpenProperties(t))return void this.refreshLockControl(t||null);let i=this.propertiesLockInput.checked;i?t.locked=!0:delete t.locked,this.commit(e);let o=this.history.document.components.find(e=>e.id===t.id)||null;this.refreshLockControl(o);let r=m.SYMBOL_BY_ID[t.kind].label[this.language];this.setStatus(i?y[this.language].componentLocked(r):y[this.language].componentUnlocked(r))}onPropertyInputKeyDown(e,t){if(e.key.startsWith("Arrow"))return void e.stopPropagation();if("Enter"===e.key){e.preventDefault(),e.stopPropagation(),this.applyPropertyInput(t)&&e.currentTarget.blur();return}if("Escape"!==e.key)return;e.preventDefault(),e.stopPropagation();let i=e.currentTarget,o=this.propertyComponentId?this.history.document.components.find(e=>e.id===this.propertyComponentId):null;i.value=o?.[t]||"",i.setAttribute("aria-invalid","false"),i.blur()}canOpenProperties(e){return!(!e||this.isProtectedComponent(e)||(0,n.hasElectroRestriction)(this.config,n.ELECTRO_RESTRICTIONS.componentPropertiesLocked))&&!("macro"===e.origin&&(0,n.hasElectroRestriction)(this.config,n.ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked))}isPropertiesOpen(){return this.propertiesPanel?.dataset.open==="1"}closeProperties(e){if(!this.propertiesPanel||!this.isPropertiesOpen())return;let t=this.propertiesPanel.getRootNode().activeElement;(t===this.propertiesNameInput||t===this.propertiesValueInput)&&t.blur(),this.propertiesPanel.dataset.open="0",this.propertiesPanel.classList.remove("is-open"),this.propertiesPanel.setAttribute("aria-hidden","true"),this.propertiesNameInput.tabIndex=-1,this.propertiesValueInput.tabIndex=-1,this.propertiesLockInput.tabIndex=-1,this.propertiesMeasurementInput.tabIndex=-1,this.propertiesCloseButton.tabIndex=-1,this.propertyComponentId=null,this.buttons.get("properties")?.setAttribute("aria-expanded","false"),delete this.container.dataset.liaElectroPropertiesOpen;let i=this.propertyReturnFocus,o=this.propertyReturnObjectKey;if(this.propertyReturnFocus=null,this.propertyReturnObjectKey=null,this.updatePanelLayout(),!e)return;let r=o&&this.isObjectListOpen()?this.objectListContent.querySelector(`[data-object-key="${o}"]`):null,n=i?.isConnected&&!("disabled"in i&&i.disabled)&&!(o&&!this.isObjectListOpen()),s=r||(n?i:o?this.buttons.get("objectList"):null)||this.container;try{s.focus({preventScroll:!0})}catch(e){}}isObjectListOpen(){return this.objectListPanel?.dataset.open==="1"}setObjectListOpen(e,t){if(!this.objectListPanel)return;this.objectListPanel.dataset.open=e?"1":"0",this.objectListPanel.classList.toggle("is-open",e),this.objectListPanel.setAttribute("aria-hidden",String(!e)),this.objectListPanel.inert=!e;let i=this.buttons.get("objectList");i?.setAttribute("aria-pressed",String(e)),i?.setAttribute("aria-expanded",String(e)),this.objectListCloseButton.tabIndex=e?0:-1;let o=(0,n.hasElectroRestriction)(this.config,n.ELECTRO_RESTRICTIONS.exportLocked);if(this.objectListExportButton.tabIndex=e&&!o?0:-1,this.objectListContent.querySelectorAll("button[data-object-key]").forEach(t=>{t.tabIndex=e?0:-1}),e?(this.container.dataset.liaElectroObjectListOpen="true",this.refreshObjectList(!0)):(delete this.container.dataset.liaElectroObjectListOpen,this.objectListSignature=""),this.updatePanelLayout(),t)try{i?.focus({preventScroll:!0})}catch(e){}}refreshObjectList(e=!1){if(!this.objectListContent||!this.isObjectListOpen()&&!e)return;let t=JSON.stringify({language:this.language,components:this.history.document.components.map(e=>[e.id,e.kind,e.name||"",e.value||"",+(!1!==e.showMeasurement),+(!0===e.locked),e.origin||""]),restrictions:Array.from(this.config.restrictionIds).sort((e,t)=>e-t),wires:this.history.document.wires.map(e=>[e.id,e.from.componentId,e.from.portId,e.to.componentId,e.to.portId,e.route])});if(!e&&t===this.objectListSignature)return void this.updateObjectListSelection();this.objectListSignature=t,this.objectListContent.replaceChildren();let i=y[this.language];if(0===this.history.document.components.length&&0===this.history.document.wires.length){let e=document.createElement("div");e.className="lia-electro-object-list-empty",e.textContent=i.noObjects,this.objectListContent.appendChild(e);return}this.history.document.components.forEach((e,t)=>{let o=m.SYMBOL_BY_ID[e.kind].label[this.language],r=this.plainObjectName(e.name)||`${o} ${t+1}`,n=[o];!0===e.locked&&n.push(i.locked),this.isProtectedComponent(e)&&n.push(i.protected),!1===e.showMeasurement&&("ammeter"===e.kind||"voltmeter"===e.kind)&&n.push(i.readingHidden);let s=n.join(" · "),a=this.createObjectListEntry(`component:${e.id}`,r,s,(0,m.symbolToSvg)(m.SYMBOL_BY_ID[e.kind]),`${r}, ${s}`),l=this.canOpenProperties(e);if(a.setAttribute("aria-disabled",String(!l)),!l){let t=this.isProtectedComponent(e)?i.protectedObject:i.propertiesRestricted;a.title=t,a.setAttribute("aria-label",`${r}, ${s}, ${t}`)}let c=t=>{if(t.preventDefault(),t.stopPropagation(),!this.canOpenProperties(e)){this.select({type:"component",id:e.id}),this.setStatus(this.isProtectedComponent(e)?y[this.language].protectedObject:y[this.language].propertiesRestricted);return}this.openProperties(e.id,a)};a.addEventListener("click",c),a.addEventListener("contextmenu",c),a.addEventListener("keydown",e=>{("ContextMenu"===e.key||e.shiftKey&&"F10"===e.key)&&c(e)}),this.appendObjectListEntry(a)}),this.history.document.wires.forEach((e,t)=>{let o=i.wireName(t+1),r=`${this.objectListComponentName(e.from.componentId)}.${e.from.portId}`,n=`${this.objectListComponentName(e.to.componentId)}.${e.to.portId}`,s=[i.wireType,`${r} \u{2192} ${n}`,...this.isProtectedWire(e)?[i.protected]:[]].join(" · "),a=this.createObjectListEntry(`wire:${e.id}`,o,s,C,`${o}, ${s}`),l=t=>{t.preventDefault(),t.stopPropagation(),this.select({type:"wire",id:e.id})};a.addEventListener("click",l),a.addEventListener("contextmenu",l),a.addEventListener("keydown",e=>{("ContextMenu"===e.key||e.shiftKey&&"F10"===e.key)&&l(e)}),this.appendObjectListEntry(a)}),this.updateObjectListSelection()}createObjectListEntry(e,t,i,o,r){let n=document.createElement("button");n.type="button",n.className="lia-electro-object-list-entry",n.dataset.objectKey=e;let[s,a]=e.split(":");n.dataset.objectType=s,n.dataset.objectId=a,n.setAttribute("aria-label",r),n.tabIndex=this.isObjectListOpen()?0:-1;let l=document.createElement("span");l.className="lia-electro-object-list-icon",l.setAttribute("aria-hidden","true"),l.innerHTML=o;let c=document.createElement("span");c.className="lia-electro-object-list-copy";let d=document.createElement("span");d.className="lia-electro-object-list-name",d.textContent=t;let p=document.createElement("span");return p.className="lia-electro-object-list-type",p.textContent=i,c.append(d,p),n.append(l,c),n}appendObjectListEntry(e){let t=document.createElement("div");t.setAttribute("role","listitem"),t.appendChild(e),this.objectListContent.appendChild(t)}updateObjectListSelection(){if(!this.objectListContent)return;let e=this.selection?`${this.selection.type}:${this.selection.id}`:"";this.objectListContent.querySelectorAll("button[data-object-key]").forEach(t=>{let i=t.dataset.objectKey===e;t.classList.toggle("is-selected",i),i?t.setAttribute("aria-current","true"):t.removeAttribute("aria-current")})}plainObjectName(e){let t=e?.trim()||"";return t.startsWith("$$")&&t.endsWith("$$")&&t.length>4?t.slice(2,-2):t.startsWith("$")&&t.endsWith("$")&&t.length>2?t.slice(1,-1):t.startsWith("\\(")&&t.endsWith("\\)")||t.startsWith("\\[")&&t.endsWith("\\]")?t.slice(2,-2):t}objectListComponentName(e){let t=this.history.document.components.findIndex(t=>t.id===e),i=this.history.document.components[t];return i?this.plainObjectName(i.name)||`${m.SYMBOL_BY_ID[i.kind].label[this.language]} ${t+1}`:e}updatePanelLayout(){let e=170*!!this.isObjectListOpen(),t=190*!!this.isPropertiesOpen();this.container.style.setProperty("--lia-electro-object-list-inset",`${e}px`),this.container.style.setProperty("--lia-electro-right-inset",`${e+t}px`)}safeExportName(){return this.boardId.replace(/[^A-Za-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"")||"circuit"}getComponentView(e){let t=this.history.document.components.find(t=>t.id===e);if(!t)return null;let i=this.transientPositions.get(e);return i?{...t,at:[i[0],i[1]]}:t}renderComponentValue(e){let t=this.getComponentView(e);if(!t)return"";if("ammeter"!==t.kind&&"voltmeter"!==t.kind)return(0,a.renderComponentLabel)(t.value);if((0,n.hasElectroRestriction)(this.config,n.ELECTRO_RESTRICTIONS.measurementControlsLocked)||!1===t.showMeasurement)return"";let i=this.dcAnalysis.circuits.find(t=>t.componentIds.includes(e));if(i?.status!=="solved")return"";let o=this.dcAnalysis.components.find(t=>t.componentId===e),r="ammeter"===t.kind?o?.currentA:o?.voltageV;return null!=r&&Number.isFinite(r)?(0,a.renderComponentLabel)(this.formatSi(r,"ammeter"===t.kind?"A":"V")):""}getComponentLabelPlacement(e,t){let i=this.getComponentView(e);if(!i)return{point:[0,0],anchorX:"middle",anchorY:"middle"};let[o,r,n,s]=m.SYMBOL_BY_ID[i.kind].bounds,a=[[o,r],[n,r],[n,s],[o,s]].map(e=>(0,m.transformPoint)(e,i.at[0],i.at[1],i.rotation)),l=a.map(e=>e[0]),c=a.map(e=>e[1]),d=Math.min(...l),p=Math.max(...l),u=Math.min(...c),h=Math.max(...c),g=(0,m.normalizeRotation)(i.rotation+90*(s-r>n-o)),b=this.componentLabelGap("x"),f=this.componentLabelGap("y");if(90===g||270===g){let e=90===g,i="name"===t?e:!e;return{point:[i?d-b:p+b,(u+h)/2],anchorX:i?"right":"left",anchorY:"middle"}}let x=0===g,v="name"===t?x:!x;return{point:[(d+p)/2,v?h+f:u-f],anchorX:"middle",anchorY:v?"bottom":"top"}}componentLabelGap(e){let t=Math.abs(Number("x"===e?this.board.unitX:this.board.unitY));return Number.isFinite(t)&&t>1e-9?12/t:.28}getViewComponents(){return this.history.document.components.map(e=>this.getComponentView(e.id)||e)}getTerminalPoint(e,t){return(0,u.resolvePort)(this.getViewComponents(),{componentId:e,portId:t})?.point||[0,0]}getPreviewRoute(){if(!this.pendingWire||!this.pointerPreview)return[];let e=(0,u.resolvePort)(this.getViewComponents(),this.pendingWire.from);return e?(0,u.routeToPoint)(e,this.pointerPreview,this.pendingWire.route,this.history.document.settings.wireStub):[]}updatePreviewVisibility(){let e=!!this.previewCurve&&!!this.pendingWire&&!!this.pointerPreview;this.previewCurve&&this.setObjectVisible(this.previewCurve,e)}findTerminalAt(e,t){let i=Number(this.board?.origin?.scrCoords?.[1]||0),o=Number(this.board?.origin?.scrCoords?.[2]||0),r=Number(this.board?.unitX||0),n=Number(this.board?.unitY||0);if(!r||!n)return null;let s=[...this.getViewComponents()].reverse(),a=null,l=1/0;for(let c of s)for(let s of m.SYMBOL_BY_ID[c.kind].terminals){let d=(0,m.transformPoint)(s.point,c.at[0],c.at[1],c.rotation),p=Math.hypot(e-(i+d[0]*r),t-(o-d[1]*n));p<=16&&p<l&&(l=p,a={componentId:c.id,portId:s.id})}return a}findComponentAt(e){let t=8/Math.max(1,Math.min(Math.abs(Number(this.board.unitX||1)),Math.abs(Number(this.board.unitY||1))));return[...this.getViewComponents()].reverse().find(i=>{let o=m.SYMBOL_BY_ID[i.kind],r=[e[0]-i.at[0],e[1]-i.at[1]],n=(0,m.rotateVector)(r,(0,m.normalizeRotation)(360-i.rotation)),[s,a,l,c]=o.bounds;return n[0]>=s-t&&n[0]<=l+t&&n[1]>=a-t&&n[1]<=c+t})||null}findWireAt(e,t){let i=Number(this.board?.origin?.scrCoords?.[1]||0),o=Number(this.board?.origin?.scrCoords?.[2]||0),r=Number(this.board?.unitX||0),n=Number(this.board?.unitY||0);if(!r||!n)return null;let s=this.getViewComponents();return[...this.history.document.wires].reverse().find(a=>9>=(0,u.distanceToRouteScreen)(e,t,(0,u.routeWire)(s,a,this.history.document.settings.wireStub),i,o,r,n))||null}eventToPointer(e){let t=this.board?.origin?.scrCoords,i=Number(this.board?.unitX||0),o=Number(this.board?.unitY||0);if(!t||!Number.isFinite(i)||!Number.isFinite(o)||1e-12>Math.abs(i)||1e-12>Math.abs(o))return null;let r=this.container.getBoundingClientRect(),n=e.clientX-r.left,s=e.clientY-r.top;return n<0||s<0||n>r.width||s>r.height?null:{localX:n,localY:s,user:[(n-Number(t[1]||0))/i,(Number(t[2]||0)-s)/o]}}isInterfaceEvent(e){return("function"==typeof e.composedPath?e.composedPath():[e.target]).some(e=>!!e&&"function"==typeof e.matches&&e.matches(".lia-electro-toolbar, .lia-electro-palette, .lia-electro-object-list-panel, .lia-electro-properties, .lia-electro-dialog-backdrop, .lia-jxg-resize-handle, .JXG_navigation"))}consumePointerEvent(e){e.preventDefault(),e.stopPropagation(),e.stopImmediatePropagation()}updateButtons(){let e=!!this.selection,t=this.selection?.type==="component",i=t?this.history.document.components.find(e=>e.id===this.selection.id):null,o=this.isSelectionProtected(),r=this.buttons.get("rotate"),n=this.buttons.get("properties"),s=this.buttons.get("remove"),a=this.buttons.get("undo"),l=this.buttons.get("redo");r&&(r.disabled=!e||o||i?.locked===!0),n&&(n.disabled=!t||!this.canOpenProperties(i)),s&&(s.disabled=!e||o),a&&(a.disabled=!this.history.canUndo),l&&(l.disabled=!this.history.canRedo)}updateStatus(){let e=y[this.language];if(this.selection?.type==="component"){let t=this.history.document.components.find(e=>e.id===this.selection.id);if(t){let i=m.SYMBOL_BY_ID[t.kind].label[this.language];return this.isProtectedComponent(t)?void this.setStatus(e.selectedProtectedComponent(i)):this.canOpenProperties(t)?void this.setStatus(!0===t.locked?e.selectedLockedComponent(i):e.selectedComponent(i)):void this.setStatus(`${i}. ${e.propertiesRestricted}`)}}if(this.selection?.type==="wire"){let t=this.history.document.wires.find(e=>e.id===this.selection.id);this.setStatus(this.isProtectedWire(t)?e.selectedProtectedWire:e.selectedWire);return}"place"===this.tool&&this.placementKind?this.setStatus(e.placeStatus(m.SYMBOL_BY_ID[this.placementKind].label[this.language])):"wire"===this.tool?this.setStatus(this.pendingWire?e.wireEndStatus:e.wireStatus):this.history.document.components.length>0?this.setStatus(this.physicsStatusText(!0)):this.setStatus(e.selectStatus)}setStatus(e){this.status.textContent=e}getNeutralColor(){try{return window.__coord?.getNeutralColor?.()||"#172033"}catch(e){return"#172033"}}getAccentColor(){try{return window.__coord?.getAccentColor?.()||"#b41f65"}catch(e){return"#b41f65"}}getTheme(){return(0,b.resolveElectroTheme)(this.getNeutralColor(),this.getAccentColor())}setObjectAttributes(e,t){try{e?.setAttribute?.(t)}catch(e){}}setObjectVisible(e,t){this.setObjectAttributes(e,{visible:t});try{t?e?.showElement?.():e?.hideElement?.()}catch(e){}}removeBoardObjects(e){e.filter(Boolean).forEach(e=>{try{this.board.removeObject(e)}catch(e){}})}}function E(e,t,i,o,r,n,s){return new w(e,t,i,o,r,n,s)}function S(e){return String(e??"").trim()||void 0}function I(e,t){return JSON.stringify(e)===JSON.stringify(t)}function k(e){return"horizontal-first"===e?"vertical-first":"horizontal-first"}},{"./config.ts":"73RYQ","./history.ts":"aq5Jh","./model.ts":"freun","./routing.ts":"31FhT","./serialization.ts":"7wGsr","./symbols.ts":"9hsna","./styles.ts":"dhHtC","@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD","./theme.ts":"7651K","./labels.ts":"j23D7","./physics.ts":"dnk77","./macros.ts":"jaabZ","./quiz.ts":"92woF"}],aq5Jh:[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"CircuitHistory",()=>s);var n=e("./model.ts");class s{past=[];future=[];current;limit;constructor(e,t=100){this.current=(0,n.cloneCircuit)(e),this.limit=t}get document(){return this.current}get canUndo(){return this.past.length>0}get canRedo(){return this.future.length>0}commit(e){var t,i;return t=this.current,i=e,JSON.stringify(t)!==JSON.stringify(i)&&(this.past.push((0,n.cloneCircuit)(this.current)),this.past.length>this.limit&&this.past.shift(),this.current=(0,n.cloneCircuit)(e),this.future.length=0,!0)}replace(e){this.current=(0,n.cloneCircuit)(e),this.past.length=0,this.future.length=0}undo(){let e=this.past.pop();return e?(this.future.push((0,n.cloneCircuit)(this.current)),this.current=e,this.current):null}redo(){let e=this.future.pop();return e?(this.past.push((0,n.cloneCircuit)(this.current)),this.current=e,this.current):null}}},{"./model.ts":"freun","@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}],freun:[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"CIRCUIT_SCHEMA",()=>n),r.export(i,"CIRCUIT_VERSION",()=>s),r.export(i,"createEmptyCircuit",()=>a),r.export(i,"cloneCircuit",()=>l),r.export(i,"snapValue",()=>c),r.export(i,"snapPoint",()=>d),r.export(i,"samePort",()=>p),r.export(i,"nextEntityId",()=>u);let n="mint-the-gap/electro-circuit",s=1;function a(e={}){return{schema:n,version:s,settings:{snapStep:h(e.snapStep,.5),wireStub:h(e.wireStub,.35)},components:[],wires:[]}}function l(e){return{schema:n,version:s,settings:{...e.settings},components:e.components.map(e=>({...e,at:[e.at[0],e.at[1]]})),wires:e.wires.map(e=>({...e,from:{...e.from},to:{...e.to}}))}}function c(e,t){let i=h(t,.5),o=Math.round(e/i)*i;return 1e-12>Math.abs(o)?0:Number(o.toFixed(10))}function d(e,t){return[c(e[0],t),c(e[1],t)]}function p(e,t){return e.componentId===t.componentId&&e.portId===t.portId}function u(e,t){let i=new Set(t),o=1;for(;i.has(`${e}_${String(o).padStart(4,"0")}`);)o+=1;return`${e}_${String(o).padStart(4,"0")}`}function h(e,t){let i=Number(e);return Number.isFinite(i)&&i>0?i:t}},{"@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}],"31FhT":[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"resolvePort",()=>s),r.export(i,"routeWire",()=>a),r.export(i,"routeBetweenPorts",()=>l),r.export(i,"routeToPoint",()=>c),r.export(i,"defaultRouteForDirection",()=>d),r.export(i,"simplifyOrthogonalRoute",()=>p),r.export(i,"isOrthogonalRoute",()=>u),r.export(i,"distanceToRouteScreen",()=>h);var n=e("./symbols.ts");function s(e,t){let i=e.find(e=>e.id===t.componentId);if(!i)return null;let o=n.SYMBOL_BY_ID[i.kind].terminals.find(e=>e.id===t.portId);return o?{point:(0,n.transformPoint)(o.point,i.at[0],i.at[1],i.rotation),direction:(0,n.rotateDirection)(o.direction,i.rotation)}:null}function a(e,t,i=.35){let o=s(e,t.from),r=s(e,t.to);return o&&r?l(o,r,t.route,i):[]}function l(e,t,i,o=.35){let r=m(e.point,e.direction,o),n=m(t.point,t.direction,o),s=[e.point,r];return g(r,n)||s.push("horizontal-first"===i?[n[0],r[1]]:[r[0],n[1]]),s.push(n,t.point),p(s)}function c(e,t,i,o=.35){let r=m(e.point,e.direction,o),n=[e.point,r];return g(r,t)||n.push("horizontal-first"===i?[t[0],r[1]]:[r[0],t[1]]),n.push(t),p(n)}function d(e){return"left"===e||"right"===e?"horizontal-first":"vertical-first"}function p(e){let t=[];e.forEach(e=>{var i,o;let r=t[t.length-1];r&&(i=r,o=e,1e-10>Math.abs(i[0]-o[0])&&1e-10>Math.abs(i[1]-o[1]))||t.push([e[0],e[1]])});let i=!0;for(;i&&t.length>2;){i=!1;for(let e=1;e<t.length-1;e+=1){let o=t[e-1],r=t[e],n=t[e+1];if(o[0]===r[0]&&r[0]===n[0]||o[1]===r[1]&&r[1]===n[1]){t.splice(e,1),i=!0;break}}}return t}function u(e){return e.length>=2&&e.slice(1).every((t,i)=>{let o=e[i];return o[0]===t[0]||o[1]===t[1]})}function h(e,t,i,o,r,n,s){let a=1/0;for(let x=1;x<i.length;x+=1){var l,c,d,p,u,h,m,g,b,f;a=Math.min(a,function(e,t,i,o){let r=o[0]-i[0],n=o[1]-i[1],s=r*r+n*n;if(s<1e-12)return Math.hypot(e-i[0],t-i[1]);let a=Math.max(0,Math.min(1,((e-i[0])*r+(t-i[1])*n)/s));return Math.hypot(e-(i[0]+a*r),t-(i[1]+a*n))}(e,t,(l=i[x-1],c=o,d=r,p=n,u=s,[c+l[0]*p,d-l[1]*u]),(h=i[x],m=o,g=r,b=n,f=s,[m+h[0]*b,g-h[1]*f])))}return a}function m(e,t,i){switch(t){case"left":return[e[0]-i,e[1]];case"right":return[e[0]+i,e[1]];case"up":return[e[0],e[1]+i];case"down":return[e[0],e[1]-i]}}function g(e,t){return 1e-10>Math.abs(e[0]-t[0])||1e-10>Math.abs(e[1]-t[1])}},{"./symbols.ts":"9hsna","@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}],"9hsna":[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"SYMBOLS",()=>b),r.export(i,"SYMBOL_BY_ID",()=>f),r.export(i,"isSymbolId",()=>x),r.export(i,"normalizeRotation",()=>v),r.export(i,"rotateVector",()=>y),r.export(i,"transformPoint",()=>C),r.export(i,"rotateDirection",()=>w),r.export(i,"symbolToSvg",()=>E);let n=(e,t,i,o)=>[[e,t],[i,o]],s=(...e)=>{let t=[];for(let i=0;i+1<e.length;i+=2)t.push([e[i],e[i+1]]);return t},a=(e,t,i,o,r,n,s=16)=>{let a=[];for(let l=0;l<=s;l+=1){let c=r+(n-r)*l/s;a.push([e+Math.cos(c)*i,t+Math.sin(c)*o])}return a},l=(e=0,t=0,i=.55)=>a(e,t,i,i,0,2*Math.PI,40),c=(e,t,i=.2)=>{let o=t[0]-e[0],r=t[1]-e[1],n=Math.hypot(o,r)||1,s=o/n,a=r/n,l=-a,c=t[0]-s*i,d=t[1]-a*i;return[[e,t],[t,[c+l*i*.55,d+s*i*.55]],[t,[c-l*i*.55,d-s*i*.55]]]},d=(e="a",t="b")=>[{id:e,label:{de:"Anschluss links",en:"Left terminal"},point:[-1.4,0],direction:"left"},{id:t,label:{de:"Anschluss rechts",en:"Right terminal"},point:[1.4,0],direction:"right"}],p=e=>{let t="V"===e?[s(-.28,.25,0,-.27,.28,.25)]:"A"===e?[s(-.3,-.25,0,.3,.3,-.25),n(-.18,-.04,.18,-.04)]:[s(-.32,-.25,-.32,.26,0,-.04,.32,.26,.32,-.25)];return[n(-1.4,0,-.55,0),l(),n(.55,0,1.4,0),...t]},u=()=>{let e=[n(-1.4,0,-.76,0),n(.76,0,1.4,0)];for(let t=0;t<4;t+=1){let i=-.57+.38*t;e.push(a(i,0,.19,.32,Math.PI,0,14))}return e},h=()=>[n(-1.4,0,-.62,0),s(-.62,-.48,-.62,.48,.34,0,-.62,-.48),n(.36,-.52,.36,.52),n(.36,0,1.4,0)],m=()=>[n(-1.4,0,-.72,0),s(-.72,-.36,-.72,.36,.72,.36,.72,-.36,-.72,-.36),n(.72,0,1.4,0)],g=(e,t)=>{let i=[];for(let o=0;o<4;o+=1){let r=.465-.31*o,n=t<0?a(e,r,.22,.155,Math.PI/2,-Math.PI/2,14):a(e,r,.22,.155,Math.PI/2,3*Math.PI/2,14);i.push(...0===o?n:n.slice(1))}return i},b=[{id:"battery",label:{de:"Batterie",en:"Battery"},terminals:d(),bounds:[-1.5,-.75,1.5,.75],paths:[n(-1.4,0,-.18,0),n(-.18,-.38,-.18,.38),n(.18,-.65,.18,.65),n(.18,0,1.4,0)]},{id:"resistor",label:{de:"Widerstand",en:"Resistor"},terminals:d(),bounds:[-1.5,-.55,1.5,.55],paths:m()},{id:"variable-resistor",label:{de:"Regelbarer Widerstand",en:"Variable resistor"},terminals:d(),bounds:[-1.5,-.9,1.5,.9],paths:[...m(),...c([-.46,.82],[.48,-.72],.22)]},{id:"capacitor",label:{de:"Kondensator",en:"Capacitor"},terminals:d(),bounds:[-1.5,-.75,1.5,.75],paths:[n(-1.4,0,-.18,0),n(-.18,-.65,-.18,.65),n(.18,-.65,.18,.65),n(.18,0,1.4,0)]},{id:"inductor",label:{de:"Spule",en:"Inductor"},terminals:d(),bounds:[-1.5,-.45,1.5,.45],paths:u()},{id:"iron-core-inductor",label:{de:"Spule mit Eisenkern",en:"Iron-core inductor"},terminals:d(),bounds:[-1.5,-.45,1.5,.55],paths:[...u(),n(-.82,.43,.82,.43)]},{id:"voltmeter",label:{de:"Voltmeter",en:"Voltmeter"},terminals:d(),bounds:[-1.5,-.7,1.5,.7],paths:p("V")},{id:"ammeter",label:{de:"Amperemeter",en:"Ammeter"},terminals:d(),bounds:[-1.5,-.7,1.5,.7],paths:p("A")},{id:"motor",label:{de:"Motor",en:"Motor"},terminals:d(),bounds:[-1.5,-.7,1.5,.7],paths:p("M")},{id:"lamp",label:{de:"Lampe",en:"Lamp"},terminals:d(),bounds:[-1.5,-.7,1.5,.7],paths:[n(-1.4,0,-.55,0),l(),n(.55,0,1.4,0),n(-.38,-.38,.38,.38),n(-.38,.38,.38,-.38)]},{id:"diode",label:{de:"Diode",en:"Diode"},terminals:d("anode","cathode"),bounds:[-1.5,-.65,1.5,.65],paths:h()},{id:"photodiode",label:{de:"Photodiode",en:"Photodiode"},terminals:d("anode","cathode"),bounds:[-1.5,-.65,1.5,1.15],paths:[...h(),...c([-.48,1.02],[-.18,.62],.16),...c([.02,1.08],[.32,.68],.16)]},{id:"led",label:{de:"LED",en:"LED"},terminals:d("anode","cathode"),bounds:[-1.5,-.65,1.5,1.15],paths:[...h(),...c([.08,.58],[.4,1],.16),...c([.48,.5],[.8,.92],.16)]},{id:"voltage-source",label:{de:"Spannungsquelle",en:"Voltage source"},terminals:d("minus","plus"),bounds:[-1.5,-.35,1.5,.35],paths:[n(-1.4,0,-.52,0),l(-.42,0,.1),l(.42,0,.1),n(.52,0,1.4,0)]},{id:"switch",label:{de:"Schalter",en:"Switch"},terminals:d("common","throw"),bounds:[-1.5,-.35,1.5,.75],paths:[n(-1.4,0,-.62,0),l(-.52,0,.1),l(.52,0,.1),n(.62,0,1.4,0),n(-.46,.08,.42,.55)]},{id:"changeover-switch",label:{de:"Umschalter",en:"Changeover switch"},terminals:[{id:"common",label:{de:"Gemeinsamer Anschluss",en:"Common terminal"},point:[-1.4,0],direction:"left"},{id:"a",label:{de:"Oberer Anschluss",en:"Upper terminal"},point:[1.4,.48],direction:"right"},{id:"b",label:{de:"Unterer Anschluss",en:"Lower terminal"},point:[1.4,-.48],direction:"right"}],bounds:[-1.5,-.75,1.5,.8],paths:[n(-1.4,0,-.62,0),l(-.52,0,.1),l(.52,.48,.1),l(.52,-.48,.1),n(.62,.48,1.4,.48),n(.62,-.48,1.4,-.48),n(-.44,.08,.42,.42)]},{id:"ground",label:{de:"Erde",en:"Ground"},terminals:[{id:"terminal",label:{de:"Anschluss",en:"Terminal"},point:[0,1.4],direction:"up"}],bounds:[-.75,-.3,.75,1.5],paths:[n(0,1.4,0,.35),n(-.65,.35,.65,.35),n(-.43,.13,.43,.13),n(-.2,-.09,.2,-.09)]},{id:"antenna",label:{de:"Antenne",en:"Antenna"},terminals:[{id:"terminal",label:{de:"Anschluss",en:"Terminal"},point:[0,-1.4],direction:"down"}],bounds:[-.7,-1.5,.7,1.2],paths:[n(0,-1.4,0,.55),n(0,.55,-.48,1.05),n(0,.55,.48,1.05)]},{id:"transistor",label:{de:"Transistor",en:"Transistor"},terminals:[{id:"base",label:{de:"Basis",en:"Base"},point:[-1.4,0],direction:"left"},{id:"collector",label:{de:"Kollektor",en:"Collector"},point:[.95,1.2],direction:"up"},{id:"emitter",label:{de:"Emitter",en:"Emitter"},point:[.95,-1.2],direction:"down"}],bounds:[-1.5,-1.3,1.1,1.3],paths:[n(-1.4,0,-.28,0),n(-.28,-.62,-.28,.62),n(-.28,.36,.95,1.2),n(-.28,-.36,.95,-1.2),...c([.28,-.75],[.72,-1.05],.2)]},{id:"transformer",label:{de:"Transformator",en:"Transformer"},terminals:[{id:"primary-top",label:{de:"Primär oben",en:"Primary top"},point:[-1.4,1.25],direction:"left"},{id:"primary-bottom",label:{de:"Primär unten",en:"Primary bottom"},point:[-1.4,-1.25],direction:"left"},{id:"secondary-top",label:{de:"Sekundär oben",en:"Secondary top"},point:[1.4,1.25],direction:"right"},{id:"secondary-bottom",label:{de:"Sekundär unten",en:"Secondary bottom"},point:[1.4,-1.25],direction:"right"}],bounds:[-1.52,-1.38,1.52,1.38],paths:[s(-1.4,1.25,-.45,1.25,-.45,.62),s(-1.4,-1.25,-.45,-1.25,-.45,-.62),s(1.4,1.25,.45,1.25,.45,.62),s(1.4,-1.25,.45,-1.25,.45,-.62),g(-.45,-1),g(.45,1),n(-.11,-.76,-.11,.76),n(.11,-.76,.11,.76)]}],f=Object.freeze(Object.fromEntries(b.map(e=>[e.id,e])));function x(e){return"string"==typeof e&&Object.prototype.hasOwnProperty.call(f,e)}function v(e){return(90*Math.round(e/90)%360+360)%360}function y(e,t){switch(t){case 90:return[-e[1],e[0]];case 180:return[-e[0],-e[1]];case 270:return[e[1],-e[0]];default:return e}}function C(e,t,i,o){let r=y(e,o);return[t+r[0],i+r[1]]}function w(e,t){let i=["right","up","left","down"],o=i.indexOf(e);return i[(o+t/90)%i.length]}function E(e){let t=e.paths.map(e=>`<polyline points="${e.map(([e,t])=>`${e},${-t}`).join(" ")}"/>`).join(""),i=e.terminals.map(e=>`<circle cx="${e.point[0]}" cy="${-e.point[1]}" r="0.09"/>`).join("");return`<svg viewBox="-1.65 -1.45 3.3 2.9" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="0.105" stroke-linecap="round" stroke-linejoin="round">${t}</g><g fill="var(--lia-electro-terminal-fill, white)" stroke="currentColor" stroke-width="0.075">${i}</g></svg>`}},{"@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}],"7wGsr":[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"MAX_COMPONENT_TEXT_LENGTH",()=>l),r.export(i,"CircuitFormatError",()=>c),r.export(i,"parseCircuitJSON",()=>d),r.export(i,"validateCircuit",()=>p),r.export(i,"stringifyCircuit",()=>u);var n=e("./model.ts"),s=e("./symbols.ts");let a=/^[A-Za-z0-9_-]{1,80}$/,l=120;class c extends Error{constructor(e){super(e),this.name="CircuitFormatError"}}function d(e){let t;if(e.length>1e6)throw new c("JSON exceeds the 1000000 character limit.");try{t=JSON.parse(e)}catch(e){throw new c(`Invalid JSON: ${e instanceof Error?e.message:String(e)}`)}return p(t)}function p(e){let t=v(e,"document");t.schema!==n.CIRCUIT_SCHEMA&&y("schema",`must equal ${n.CIRCUIT_SCHEMA}`),t.version!==n.CIRCUIT_VERSION&&y("version",`must equal ${n.CIRCUIT_VERSION}`);let i=v(t.settings,"settings"),o=x(i.snapStep,"settings.snapStep"),r=x(i.wireStub,"settings.wireStub");Array.isArray(t.components)||y("components","must be an array"),Array.isArray(t.wires)||y("wires","must be an array"),t.components.length>500&&y("components","must contain at most 500 entries"),t.wires.length>2e3&&y("wires","must contain at most 2000 entries");let a=new Set,l=t.components.map((e,t)=>{let i=`components[${t}]`,o=v(e,i),r=m(o.id,`${i}.id`);a.has(r)&&y(`${i}.id`,`duplicates ${r}`),a.add(r),(0,s.isSymbolId)(o.kind)||y(`${i}.kind`,`is not a known symbol: ${String(o.kind)}`),Array.isArray(o.at)&&2===o.at.length||y(`${i}.at`,"must contain exactly two numbers");let n=function(e,t){if(0===e||90===e||180===e||270===e)return e;y(t,"must be one of 0, 90, 180 or 270")}(o.rotation,`${i}.rotation`),l=g(o.name,`${i}.name`),c=g(o.value,`${i}.value`),d=b(o.showMeasurement,`${i}.showMeasurement`),p=b(o.locked,`${i}.locked`),u=function(e,t){if(void 0!==e)return"macro"!==e&&"editor"!==e&&y(t,"must equal macro or editor when present"),e}(o.origin,`${i}.origin`);return void 0!==d&&"ammeter"!==o.kind&&"voltmeter"!==o.kind&&y(`${i}.showMeasurement`,"is only valid for ammeters and voltmeters"),{id:r,kind:o.kind,at:[f(o.at[0],`${i}.at[0]`),f(o.at[1],`${i}.at[1]`)],rotation:n,...l?{name:l}:{},...c?{value:c}:{},...!1===d?{showMeasurement:!1}:{},...!0===p?{locked:!0}:{},...u?{origin:u}:{}}}),c=new Map(l.map(e=>[e.id,e])),d=new Set,p=t.wires.map((e,t)=>{let i=`wires[${t}]`,o=v(e,i),r=m(o.id,`${i}.id`);d.has(r)&&y(`${i}.id`,`duplicates ${r}`),d.add(r);let n=h(o.from,`${i}.from`,c),s=h(o.to,`${i}.to`,c);n.componentId===s.componentId&&n.portId===s.portId&&y(i,"cannot connect a port to itself");let a=o.route;return"horizontal-first"!==a&&"vertical-first"!==a&&y(`${i}.route`,"must be horizontal-first or vertical-first"),{id:r,from:n,to:s,route:a}});return{schema:n.CIRCUIT_SCHEMA,version:n.CIRCUIT_VERSION,settings:{snapStep:o,wireStub:r},components:l,wires:p}}function u(e){let t=p((0,n.cloneCircuit)(e));return t.components.sort((e,t)=>e.id.localeCompare(t.id)),t.wires.sort((e,t)=>e.id.localeCompare(t.id)),JSON.stringify(t,null,2)}function h(e,t,i){let o=v(e,t),r=m(o.componentId,`${t}.componentId`),n=m(o.portId,`${t}.portId`),a=i.get(r);return a||y(`${t}.componentId`,`references missing component ${r}`),s.SYMBOL_BY_ID[a.kind].terminals.some(e=>e.id===n)||y(`${t}.portId`,`references missing port ${n} on ${r}`),{componentId:r,portId:n}}function m(e,t){return"string"==typeof e&&a.test(e)||y(t,"must match /^[A-Za-z0-9_-]{1,80}$/"),e}function g(e,t){if(void 0===e)return;"string"!=typeof e&&y(t,"must be a string when present"),/[\u0000-\u001f\u007f]/u.test(e)&&y(t,"must contain a single line of text");let i=e.trim();if(i)return i.length>l&&y(t,`must contain at most ${l} characters`),i}function b(e,t){if(void 0!==e)return"boolean"!=typeof e&&y(t,"must be a boolean when present"),e}function f(e,t){return"number"==typeof e&&Number.isFinite(e)||y(t,"must be a finite number"),e}function x(e,t){let i=f(e,t);return(i<=0||i>10)&&y(t,"must be greater than 0 and at most 10"),i}function v(e,t){return(!e||"object"!=typeof e||Array.isArray(e))&&y(t,"must be an object"),e}function y(e,t){throw new c(`${e}: ${t}`)}},{"./model.ts":"freun","./symbols.ts":"9hsna","@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}],dhHtC:[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"ensureElectroStyles",()=>s);let n="lia-electro-styles-v5";function s(e){if(e.getElementById?.(n))return;let t=document.createElement("style");t.id=n,t.textContent=`
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
`,e instanceof Document?(e.head||e.documentElement).appendChild(t):e.appendChild(t)}},{"@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}],"7651K":[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"resolveElectroTheme",()=>a),r.export(i,"parseCssColor",()=>l),r.export(i,"contrastRatio",()=>c);let n="#172033",s="#b41f65";function a(e,t){var i;let o,r=l(e)||l(n),a=u(r)>.55?"dark":"light",c=l(e)?e.trim():"dark"===a?"#ffffff":n,d=l(t)||l(s),g=l(t)?t.trim():s,b="dark"===a?"#151a1c":"#ffffff",f=l(b),x="dark"===a?.58:.24,v=p(d,r,x);for(;4.5>h(v,f)&&x<.9;)x+=.08,v=p(d,r,x);let y=l("#111827"),C=l("#ffffff"),w=h(d,y)>=h(d,C)?"#111827":"#ffffff";return{mode:a,foreground:c,accent:g,action:(i=v,o=e=>Math.round(m(e,0,255)).toString(16).padStart(2,"0"),`#${o(i.red)}${o(i.green)}${o(i.blue)}`),surface:b,surfaceMuted:"dark"===a?"#20282b":"#f2f5f7",onAccent:w,shadow:"dark"===a?"rgba(0, 0, 0, 0.48)":"rgba(15, 23, 42, 0.2)",backdrop:"dark"===a?"rgba(0, 0, 0, 0.68)":"rgba(15, 23, 42, 0.42)"}}function l(e){let t=String(e||"").trim().toLowerCase(),i=t.match(/^#([0-9a-f]{3,8})$/i)?.[1];if(i){if(3===i.length||4===i.length)return{red:Number.parseInt(i[0]+i[0],16),green:Number.parseInt(i[1]+i[1],16),blue:Number.parseInt(i[2]+i[2],16)};if(6===i.length||8===i.length)return{red:Number.parseInt(i.slice(0,2),16),green:Number.parseInt(i.slice(2,4),16),blue:Number.parseInt(i.slice(4,6),16)}}let o=t.match(/^rgba?\((.*)\)$/i)?.[1];if(!o)return null;let r=o.split("/")[0].replace(/,/g," ").trim().split(/\s+/).slice(0,3).map(d);return 3!==r.length||r.some(e=>null==e)?null:{red:r[0],green:r[1],blue:r[2]}}function c(e,t){let i=l(e),o=l(t);return i&&o?h(i,o):1}function d(e){let t=e.endsWith("%"),i=Number.parseFloat(e);return Number.isFinite(i)?m(t?255*i/100:i,0,255):null}function p(e,t,i){let o=m(i,0,1);return{red:e.red*(1-o)+t.red*o,green:e.green*(1-o)+t.green*o,blue:e.blue*(1-o)+t.blue*o}}function u(e){let t=e=>{let t=e/255;return t<=.04045?t/12.92:((t+.055)/1.055)**2.4};return .2126*t(e.red)+.7152*t(e.green)+.0722*t(e.blue)}function h(e,t){return(Math.max(u(e),u(t))+.05)/(Math.min(u(e),u(t))+.05)}function m(e,t,i){return Math.min(i,Math.max(t,e))}},{"@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}],j23D7:[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");function n(e){var t;let i,o=(t=String(e??"").trim(),i={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},t.replace(/[&<>"']/g,e=>i[e]));if(!o)return"";if(/^\\\([\s\S]*\\\)$/.test(o)||/^\\\[[\s\S]*\\\]$/.test(o))return o;let r=/\$\$[\s\S]+?\$\$|\$[^$\r\n]+?\$/.test(o);if(o=(o=(o=(o=o.replace(/\\\$/g,"")).replace(/\$\$([\s\S]+?)\$\$/g,(e,t)=>`\\[${t}\\]`)).replace(/\$([^$\r\n]+?)\$/g,(e,t)=>`\\(${t}\\)`)).split("").join("$"),!r){let e=function(e){let t=e.match(/^([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+))\s*([pnumµukKMG]?)\s*(V|A|W|Ω|Ohm)$/u);if(!t)return null;let i=t[1].replace(",","{,}"),o=t[2],r=t[3];if("Ω"===r||"Ohm"===r){let e=o?`\\mathrm{${o}}\\Omega`:"\\Omega";return`\\(${i}\\,${e}\\)`}return`\\(${i}\\,\\mathrm{${o}${r}}\\)`}(o);if(e)return e}return!r&&/(?:\\[A-Za-z]+|\\[,;:! ]|[_^])/.test(o)?`\\(${o}\\)`:o}r.defineInteropFlag(i),r.export(i,"renderComponentLabel",()=>n)},{"@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}],dnk77:[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"parseVoltageValue",()=>c),r.export(i,"parseCurrentValue",()=>d),r.export(i,"parseResistanceValue",()=>p),r.export(i,"analyzeDcCircuit",()=>u);var n=e("./symbols.ts");let s=new Set(["battery","voltage-source"]),a=new Set(["resistor","variable-resistor"]),l=new Set([...s,...a,"ammeter","voltmeter","ground"]);function c(e){return h(e,"voltage")}function d(e){return h(e,"current")}function p(e){let t=h(e,"resistance");return null!=t&&t>0?t:null}function u(e){var t;if(0===e.components.length)return{status:"empty",circuits:[],components:[],diagnostics:[]};let i=e.components.filter(e=>s.has(e.kind));if(0===i.length)return{status:"no-source",circuits:[],components:[],diagnostics:[]};let o=new y(e.components.flatMap(e=>n.SYMBOL_BY_ID[e.kind].terminals.map(t=>v(e.id,t.id))));e.wires.forEach(e=>{o.union(v(e.from.componentId,e.from.portId),v(e.to.componentId,e.to.portId))});let r=new Map;e.components.forEach(e=>{r.set(e.id,n.SYMBOL_BY_ID[e.kind].terminals.map(t=>o.find(v(e.id,t.id))))});let d=new y([...new Set([...r.values()].flat())]);e.components.forEach(e=>{if("voltmeter"===e.kind)return;let t=[...new Set(r.get(e.id)||[])];for(let e=1;e<t.length;e+=1)d.union(t[0],t[e])});let u=new Map;e.components.forEach(e=>{if("voltmeter"===e.kind)return;let t=r.get(e.id)?.[0];if(!t)return;let i=d.find(t),o=u.get(i)||[];o.push(e),u.set(i,o)}),e.components.filter(e=>"voltmeter"===e.kind).forEach(e=>{let t=[...new Set((r.get(e.id)||[]).map(e=>d.find(e)))];1===t.length&&u.has(t[0])&&u.get(t[0]).push(e)});let h=[...new Set(i.map(e=>{let t=r.get(e.id)?.[0];return t?d.find(t):""}).filter(Boolean))].sort().map((e,t)=>(function(e,t,i){let o=t.filter(e=>s.has(e.kind)),r={id:e,componentIds:t.map(e=>e.id),sourceIds:o.map(e=>e.id)},n=t.filter(e=>!l.has(e.kind));if(n.length>0)return{circuit:{...r,status:"unsupported"},components:[],diagnostics:n.map(e=>({code:"unsupported-component",componentId:e.id,detail:e.kind}))};let d=[],u=[],h=[];if(t.forEach(e=>{let t=i.get(e.id)||[];if(s.has(e.kind)){let i=e.value?.trim(),o=c(i);if(i)if(null==o)d.push({code:"invalid-value",componentId:e.id,detail:"voltage"});else{let[i,r]="battery"===e.kind?["a","b"]:["minus","plus"];u.push({component:e,minusNode:m(e,i,t),plusNode:m(e,r,t),voltageV:o})}else d.push({code:"missing-value",componentId:e.id,detail:"voltage"})}if(a.has(e.kind)){let i=e.value?.trim(),o=p(i);i?null==o?d.push({code:"invalid-value",componentId:e.id,detail:"resistance"}):h.push({component:e,fromNode:m(e,"a",t),toNode:m(e,"b",t),resistanceOhm:o}):d.push({code:"missing-value",componentId:e.id,detail:"resistance"})}}),d.length>0)return{circuit:{...r,status:"incomplete"},components:[],diagnostics:d};for(let e of u)if(e.plusNode===e.minusNode)return x(r,e.component.id);let v=t.filter(e=>"ammeter"===e.kind).map(e=>{let t=i.get(e.id)||[];return{component:e,plusNode:m(e,"a",t),minusNode:m(e,"b",t),voltageV:0,role:"ammeter"}}),y=new Map;for(let e of(v.forEach(e=>b(y,e.plusNode,e.minusNode)),u))if(f(y,e.plusNode,e.minusNode))return x(r,e.component.id);let C=[...u.map(e=>({...e,role:"source"})),...v],w=new Set;h.forEach(e=>{w.add(e.fromNode),w.add(e.toNode)}),C.forEach(e=>{w.add(e.plusNode),w.add(e.minusNode)});let E=t.find(e=>"ground"===e.kind)?i.get(t.find(e=>"ground"===e.kind).id)?.[0]:void 0,S=E&&w.has(E)?E:u[0].minusNode,I=[...w].filter(e=>e!==S).sort(),k=C.filter(e=>e.plusNode!==e.minusNode),z=I.length+k.length;if(z>160)return{circuit:{...r,status:"invalid"},components:[],diagnostics:[{code:"network-too-large",detail:String(z)}]};let P=new Map(I.map((e,t)=>[e,t])),L=Array.from({length:z},()=>Array(z).fill(0)),j=Array(z).fill(0);h.forEach(e=>{var t,i,o,r;let n,s,a;return t=L,i=P,o=e.fromNode,r=e.toNode,n=1/e.resistanceOhm,s=i.get(o),a=i.get(r),void(null!=s&&(t[s][s]+=n),null!=a&&(t[a][a]+=n),null!=s&&null!=a&&(t[s][a]-=n,t[a][s]-=n))}),k.forEach((e,t)=>{var i,o,r,n,s,a,l;let c,d,p=I.length+t;e.variableIndex=p,i=L,o=j,r=P,n=e.plusNode,s=e.minusNode,a=p,l=e.voltageV,c=r.get(n),d=r.get(s),null!=c&&(i[c][a]+=1,i[a][c]+=1),null!=d&&(i[d][a]-=1,i[a][d]-=1),o[a]=l});let T=function(e,t){let i=t.length;if(0===i)return[];let o=e.map((e,i)=>[...e,t[i]]);for(let e=0;e<i;e+=1){let t=e;for(let r=e+1;r<i;r+=1)Math.abs(o[r][e])>Math.abs(o[t][e])&&(t=r);if(1e-11>Math.abs(o[t][e]))return null;[o[e],o[t]]=[o[t],o[e]];let r=o[e][e];for(let t=e;t<=i;t+=1)o[e][t]/=r;for(let t=0;t<i;t+=1){if(t===e)continue;let r=o[t][e];if(!(1e-11>Math.abs(r)))for(let n=e;n<=i;n+=1)o[t][n]-=r*o[e][n]}}let r=o.map(e=>e[i]);return r.every(Number.isFinite)?r:null}(L,j);if(!T)return{circuit:{...r,status:"invalid"},components:[],diagnostics:[{code:"singular-network"}]};let M=e=>{if(e===S)return 0;let t=P.get(e);return null==t?void 0:T[t]},O=new Map(k.map(e=>[e.component.id,e])),A=[];u.forEach(e=>{let t=O.get(e.component.id),i=t?.variableIndex==null?void 0:T[t.variableIndex],o=g(M(e.plusNode),M(e.minusNode));A.push({componentId:e.component.id,kind:e.component.kind,role:"source",fromPort:"battery"===e.component.kind?"b":"plus",toPort:"battery"===e.component.kind?"a":"minus",voltageV:o,currentA:i,powerW:null!=o&&null!=i?o*i:void 0,sourceVoltageV:e.voltageV})}),h.forEach(e=>{let t=g(M(e.fromNode),M(e.toNode)),i=null==t?void 0:t/e.resistanceOhm;A.push({componentId:e.component.id,kind:e.component.kind,role:"resistor",fromPort:"a",toPort:"b",voltageV:t,currentA:i,powerW:null!=t&&null!=i?t*i:void 0,resistanceOhm:e.resistanceOhm})}),v.forEach(e=>{let t=O.get(e.component.id),i=t?.variableIndex==null?void 0:T[t.variableIndex];A.push({componentId:e.component.id,kind:e.component.kind,role:"ammeter",fromPort:"a",toPort:"b",voltageV:0,currentA:i,powerW:0})}),t.filter(e=>"voltmeter"===e.kind).forEach(e=>{let t=i.get(e.id)||[];A.push({componentId:e.id,kind:e.kind,role:"voltmeter",fromPort:"a",toPort:"b",voltageV:g(M(m(e,"a",t)),M(m(e,"b",t))),currentA:0,powerW:0})});let B=new Map;h.forEach(e=>b(B,e.fromNode,e.toNode)),v.forEach(e=>b(B,e.plusNode,e.minusNode));let $=u.some(e=>f(B,e.plusNode,e.minusNode)),N=1===u.length?A.find(e=>e.componentId===u[0].component.id):void 0,R=N?.voltageV==null?void 0:Math.abs(N.voltageV),q=N?.currentA==null?void 0:Math.abs(N.currentA);return{circuit:{...r,status:$?"solved":"open",voltageV:R,currentA:q,equivalentResistanceOhm:$&&null!=R&&null!=q&&q>1e-11?R/q:void 0},components:A,diagnostics:$?[]:[{code:"open-circuit"}]}})(`dc_${String(t+1).padStart(2,"0")}`,(u.get(e)||[]).sort((e,t)=>e.id.localeCompare(t.id)),r)),C=h.map(e=>e.circuit),w=h.flatMap(e=>e.components),E=h.flatMap(e=>e.diagnostics);return{status:(t=C,["invalid","short-circuit","incomplete","unsupported","open","solved"].find(e=>t.some(t=>t.status===e))||"no-source"),circuits:C,components:w,diagnostics:E}}function h(e,t){if("string"!=typeof e&&"number"!=typeof e)return null;let i=String(e).trim();if(!i)return null;(i.startsWith("$")&&i.endsWith("$")||i.startsWith("\\(")&&i.endsWith("\\)"))&&(i=i.slice(i.startsWith("$")?1:2,i.endsWith("$")?-1:-2)),(i=i.replace(/\{,\}/g,",").replace(/\\(?:mathrm|text)\s*\{([^{}]*)\}/g,"$1").replace(/\\Omega/g,"Ω").replace(/\\mu/g,"µ").replace(/\\[,;:! ]/g," ").replace(/[{}]/g,"").trim()).includes("=")&&(i=i.slice(i.lastIndexOf("=")+1).trim());let o=i.match(/^([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?)\s*([pnumµukKMG]?)\s*([A-Za-zΩ]*)$/u);if(!o)return null;let r=o[3];if("voltage"===t&&r&&"v"!==r.toLowerCase()||"current"===t&&r&&"a"!==r.toLowerCase()||"resistance"===t&&r&&"Ω"!==r&&"ohm"!==r.toLowerCase())return null;let n=o[2],s=Number(o[1].replace(",","."))*({"":1,p:1e-12,n:1e-9,u:1e-6,µ:1e-6,m:.001,k:1e3,K:1e3,M:1e6,G:1e9})[n];return Number.isFinite(s)?s:null}function m(e,t,i){return i[n.SYMBOL_BY_ID[e.kind].terminals.findIndex(e=>e.id===t)]||""}function g(e,t){return null==e||null==t?void 0:e-t}function b(e,t,i){t&&i&&t!==i&&(e.has(t)||e.set(t,new Set),e.has(i)||e.set(i,new Set),e.get(t).add(i),e.get(i).add(t))}function f(e,t,i){if(!t||!i)return!1;if(t===i)return!0;let o=[t],r=new Set(o);for(;o.length>0;){let t=o.shift();for(let n of e.get(t)||[]){if(n===i)return!0;r.has(n)||(r.add(n),o.push(n))}}return!1}function x(e,t){return{circuit:{...e,status:"short-circuit"},components:[],diagnostics:[{code:"short-circuit",componentId:t}]}}function v(e,t){return`${e}:${t}`}class y{parent=new Map;constructor(e){for(const t of e)this.parent.set(t,t)}find(e){this.parent.has(e)||this.parent.set(e,e);let t=this.parent.get(e);if(t===e)return e;let i=this.find(t);return this.parent.set(e,i),i}union(e,t){let i=this.find(e),o=this.find(t);i!==o&&this.parent.set(o,i)}}},{"./symbols.ts":"9hsna","@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}],jaabZ:[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"COMPONENT_MACRO_NAMES",()=>d),r.export(i,"buildElectroMacroBlock",()=>u),r.export(i,"circuitFromMacroElements",()=>h),r.export(i,"completionQuizSpecFromMacroElements",()=>m),r.export(i,"parseComponentMacro",()=>g),r.export(i,"parseWireMacro",()=>b);var n=e("./config.ts"),s=e("./model.ts"),a=e("./quiz.ts"),l=e("./serialization.ts"),c=e("./symbols.ts");let d={battery:{de:"ElectroBatterie",en:"ElectroBattery"},resistor:{de:"ElectroWiderstand",en:"ElectroResistor"},"variable-resistor":{de:"ElectroRegelbarerWiderstand",en:"ElectroVariableResistor"},capacitor:{de:"ElectroKondensator",en:"ElectroCapacitor"},inductor:{de:"ElectroSpule",en:"ElectroInductor"},"iron-core-inductor":{de:"ElectroSpuleMitEisenkern",en:"ElectroIronCoreInductor"},voltmeter:{de:"ElectroVoltmeter",en:"ElectroVoltmeter"},ammeter:{de:"ElectroAmperemeter",en:"ElectroAmmeter"},motor:{de:"ElectroMotor",en:"ElectroMotor"},lamp:{de:"ElectroLampe",en:"ElectroLamp"},diode:{de:"ElectroDiode",en:"ElectroDiode"},photodiode:{de:"ElectroPhotodiode",en:"ElectroPhotodiode"},led:{de:"ElectroLED",en:"ElectroLED"},"voltage-source":{de:"ElectroSpannungsquelle",en:"ElectroVoltageSource"},switch:{de:"ElectroSchalter",en:"ElectroSwitch"},"changeover-switch":{de:"ElectroUmschalter",en:"ElectroChangeoverSwitch"},ground:{de:"ElectroErde",en:"ElectroGround"},antenna:{de:"ElectroAntenne",en:"ElectroAntenna"},transistor:{de:"ElectroTransistor",en:"ElectroTransistor"},transformer:{de:"ElectroTransformator",en:"ElectroTransformer"}},p=/^[A-Za-z0-9_-]{1,80}$/;function u(e,t,i,o=function(){let e="abcdefghijklmnopqrstuvwxyz",t=`${e}0123456789`,i=new Uint32Array(8);try{"u">typeof window&&window.crypto?.getRandomValues?window.crypto.getRandomValues(i):z(i)}catch(e){z(i)}let o=e[i[0]%e.length];for(let e=1;e<i.length;e+=1)o+=t[i[e]%t.length];return`electro_${o}`}(),r){var s,p,h,m,g,b,y;let C,w,S,P,L,j,T,M,O=(0,l.validateCircuit)(e),A=E(o,"export board id"),B=(s=t,p=A,h=O.settings,C=(0,n.parseElectroSpec)(s).boardId,w=[],(0,n.splitElectroSpec)(s).forEach(e=>{let t=e.trim();if(!t)return;let i=t.indexOf("=");if(i>0){let e=t.slice(0,i).trim().toLowerCase();if("id"===e||"board"===e||"snap"===e||"raster"===e||"stub"===e||"components"===e||"restrictions"===e)return}else if(t===C)return;w.push(k(t))}),w.push(`id=${p}`,`snap=${I(h.snapStep)}`,`stub=${I(h.wireStub)}`),w.join(";")),$=(m=t,g=r,S=(0,n.parseElectroSpec)(m),P=g?(0,n.canonicalElectroIds)(g.componentIds):(0,n.canonicalElectroIds)(S.componentIds||n.ELECTRO_KNOWN_COMPONENT_IDS),L=(0,n.canonicalElectroRestrictionIds)(g?g.restrictionIds:S.restrictionIds),j=String(g?.completionQuizSpec||"").trim(),{componentIds:new Set(P),restrictionIds:new Set(L),...j?{completionQuizSpec:j}:{}}),N=(b=B,y=$,T=[b,`components=${(0,n.formatElectroIdSelection)(y.componentIds)}`],(M=(0,n.canonicalElectroRestrictionIds)(y.restrictionIds)).length&&T.push(`restrictions=${(0,n.formatElectroIdSelection)(M)}`),T.join(";")),R="de"===i?"ElectroKabel":"ElectroWire",q=[x("de"===i?"Koordinatensystem":"CoordinateSystem",B)];if(O.components.forEach(e=>{var t;let o,r;q.push(x(d[e.kind][i],(o=[A,(t=e).id,I(t.at[0]),I(t.at[1]),String(t.rotation),v(t.name||""),v(t.value||"")],(r="ammeter"===t.kind||"voltmeter"===t.kind)&&o.push(!1===t.showMeasurement?"0":"1"),!0===t.locked&&(r||o.push(""),o.push("1")),o.join(";"))))}),O.wires.forEach(e=>{var t;q.push(x(R,[A,(t=e).id,t.from.componentId,t.from.portId,t.to.componentId,t.to.portId,t.route].join(";")))}),q.push(x("ElectroOn",N)),$.completionQuizSpec){let e=(0,a.rewriteCompletionBoardId)($.completionQuizSpec,A);q.push("",function(e,t){let i,o=(0,a.parseCompletionRule)(e),r=[...o.requiredAdded].map(([e,i])=>`${i} \u00d7 ${c.SYMBOL_BY_ID[e].label[t]}`).join(", "),n=r?"de"===t?` Verwende genau ${r}.`:` Use exactly ${r}.`:"",s=o.preserveBaseline?"de"===t?" Die Vorgabe darf nicht elektrisch verändert werden.":" Do not change the preset circuit electrically.":"",l=o.magnitude||"ammeter-current"!==o.condition&&"voltmeter-voltage"!==o.condition?"":"de"===t?" Das Vorzeichen folgt der Anschlussrichtung des Messgeräts.":" The sign follows the meter terminal direction.";if("closed"===o.condition)i="de"===t?"Ergänze die Schaltung zu einem geschlossenen Stromkreis.":"Complete the circuit so that it is closed.";else{let e="equivalent-resistance"===o.condition?"resistance":"voltmeter-voltage"===o.condition?"voltage":"current",r=f(o.target||0,e,t),n=f(o.tolerance,e,t,!0),s="ammeter-current"===o.condition||"voltmeter-voltage"===o.condition?"de"===t?`${o.componentId} zeigt ${r}`:`${o.componentId} reads ${r}`:"total-current"===o.condition?"de"===t?`Der Gesamtstrom betr\u00e4gt ${r}`:`The total current is ${r}`:"de"===t?`Der Ersatzwiderstand betr\u00e4gt ${r}`:`The equivalent resistance is ${r}`;i="de"===t?`Erg\u00e4nze die Schaltung. Bedingung: ${s} (Toleranz ${n}).`:`Complete the circuit. Condition: ${s} (tolerance ${n}).`}return`${i}${n}${s}${l}`}(e,i)),q.push(x("de"===i?"ElectroErgaenzungsquiz":"ElectroCompletionQuiz",e))}return q.join("\n")}function h(e,t,i={}){let o=new Map,r=new Map,n=!1;if(e.querySelectorAll(".lia-electro-component-spec[data-kind][data-spec]").forEach(e=>{let i=e.dataset.spec||"";if(C(i)!==t)return;n=!0;let r=g(e.dataset.kind,i);w(o,r.component.id,r.component,"component")}),e.querySelectorAll(".lia-electro-wire-spec[data-spec]").forEach(e=>{let i=e.dataset.spec||"";if(C(i)!==t)return;n=!0;let o=b(i);w(r,o.wire.id,o.wire,"wire")}),!n)return null;let a=(0,s.createEmptyCircuit)(i);return a.components=Array.from(o.values()),a.wires=Array.from(r.values()),(0,l.validateCircuit)(a)}function m(e,t){let i=null;return e.querySelectorAll(".lia-electro-completion-spec[data-spec]").forEach(e=>{let o=String(e.dataset.spec||"").trim(),r=C(o);if(p.test(r)&&r!==t||(0,a.parseCompletionRule)(o).boardId!==t)return;let n=(0,a.rewriteCompletionBoardId)(o,t);null!=i&&i!==n&&P(`board ${t} has conflicting completion quiz definitions`),i=n}),i}function g(e,t){let i;(0,c.isSymbolId)(e)||P(`unknown component kind: ${String(e)}`);let o=String(t||"").split(";");(o.length<5||o.length>9)&&P("component needs board;id;x;y;rotation[;name;value;showMeasurement;locked]");let r=E(o[0],"component board id"),n=E(o[1],"component id"),s=S(o[2],"component x"),a=S(o[3],"component y"),l=(0!==(i=S(o[4],"component rotation"))&&90!==i&&180!==i&&270!==i&&P("component rotation must be 0, 90, 180 or 270"),i),d=y(o[5]||""),p=y(o[6]||""),u=String(o[7]||"").trim();u&&"0"!==u&&"1"!==u&&P("showMeasurement must be 0, 1 or empty"),u&&"ammeter"!==e&&"voltmeter"!==e&&P("showMeasurement is only valid for ammeters and voltmeters");let h=String(o[8]||"").trim();return h&&"0"!==h&&"1"!==h&&P("locked must be 0, 1 or empty"),{boardId:r,component:{id:n,kind:e,at:[s,a],rotation:l,...d?{name:d}:{},...p?{value:p}:{},..."0"===u?{showMeasurement:!1}:{},..."1"===h?{locked:!0}:{},origin:"macro"}}}function b(e){let t=String(e||"").split(";");7!==t.length&&P("wire needs board;id;fromComponent;fromPort;toComponent;toPort;route");let i=E(t[0],"wire board id"),o=E(t[1],"wire id"),r=E(t[2],"wire from component"),n=E(t[3],"wire from port"),s=E(t[4],"wire to component"),a=E(t[5],"wire to port"),l=String(t[6]||"").trim();return"horizontal-first"!==l&&"vertical-first"!==l&&P("wire route must be horizontal-first or vertical-first"),{boardId:i,wire:{id:o,from:{componentId:r,portId:n},to:{componentId:s,portId:a},route:l}}}function f(e,t,i,o=!1){let r=Math.abs(e),n=e,s="current"===t?"\\mathrm{A}":"voltage"===t?"\\mathrm{V}":"\\Omega";"current"===t&&r>0&&r<1?(n=1e3*e,s="\\mathrm{mA}"):"voltage"===t&&r>0&&r<1?(n=1e3*e,s="\\mathrm{mV}"):"resistance"===t&&r>=1e3&&(n=e/1e3,s="\\mathrm{k}\\Omega");let a=String(Number(n.toPrecision(8))),l="de"===i?a.replace(".","{,}"):a;return`\\(${o?"\\pm ":""}${l}\\,${s}\\)`}function x(e,t){return`@${e}(\`${k(t)}\`)`}function v(e){if(!e)return"";let t=new Set([";","`",'"',"&","<",">","\r","\n"]);return e.startsWith("~")||Array.from(e).some(e=>t.has(e))?`~${encodeURIComponent(e)}`:e}function y(e){if(!e.startsWith("~"))return e;try{return decodeURIComponent(e.slice(1))}catch(e){P("component text contains invalid percent encoding")}}function C(e){return String(e||"").split(";",1)[0].trim()}function w(e,t,i,o){let r=e.get(t);r?JSON.stringify(r)!==JSON.stringify(i)&&P(`${o} id ${t} has conflicting macro definitions`):e.set(t,i)}function E(e,t){let i=String(e||"").trim();return p.test(i)||P(`${t} must match ${p}`),i}function S(e,t){let i=Number(String(e??"").trim().replace(",","."));return Number.isFinite(i)||P(`${t} must be a finite number`),Object.is(i,-0)?0:i}function I(e){let t=Number(e),i=Math.round(1e9*(Number.isFinite(t)?t:0))/1e9;return Object.is(i,-0)?"0":String(i)}function k(e){return String(null==e?"":e).split("`").join("'")}function z(e){for(let t=0;t<e.length;t+=1)e[t]=Math.floor(0xffffffff*Math.random())}function P(e){throw new(0,l.CircuitFormatError)(`Electro macro: ${e}`)}},{"./config.ts":"73RYQ","./model.ts":"freun","./serialization.ts":"7wGsr","./symbols.ts":"9hsna","@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD","./quiz.ts":"92woF"}],"92woF":[function(e,t,i,o){var r=e("@parcel/transformer-js/src/esmodule-helpers.js");r.defineInteropFlag(i),r.export(i,"CompletionRuleError",()=>l),r.export(i,"parseCompletionRule",()=>u),r.export(i,"formatCompletionRule",()=>h),r.export(i,"rewriteCompletionBoardId",()=>m),r.export(i,"evaluateCircuitCompletion",()=>g),r.export(i,"formatCompletionMessage",()=>b);var n=e("./config.ts"),s=e("./physics.ts"),a=e("./symbols.ts");class l extends Error{constructor(e){super(`Electro completion quiz: ${e}`),this.name="CompletionRuleError"}}let c=/^[A-Za-z0-9_-]{1,80}$/,d=new Set(["battery","voltage-source"]),p=new Set(["battery","voltage-source","resistor","variable-resistor","ammeter","voltmeter","ground"]);function u(e){var t;let i,o=new Map,r="";(0,n.splitElectroSpec)(e).forEach(e=>{let t=e.indexOf("=");t>0?o.set(e.slice(0,t).trim().toLowerCase(),e.slice(t+1).trim()):r||(r=L(e))});let s=L(o.get("board")||o.get("id")||r);c.test(s)||O("board id is missing or invalid");let l=((i=({closed:"closed",geschlossen:"closed","circuit-closed":"closed",current:"ammeter-current",ammeter:"ammeter-current","ammeter-current":"ammeter-current",strom:"ammeter-current",stromstaerke:"ammeter-current",stromstärke:"ammeter-current",voltage:"voltmeter-voltage",voltmeter:"voltmeter-voltage","voltmeter-voltage":"voltmeter-voltage",spannung:"voltmeter-voltage","total-current":"total-current","source-current":"total-current",gesamtstrom:"total-current",resistance:"equivalent-resistance","equivalent-resistance":"equivalent-resistance",gesamtwiderstand:"equivalent-resistance",ersatzwiderstand:"equivalent-resistance"})[L(t=o.get("condition")||o.get("quantity")||"closed").trim().toLowerCase().replace(/_/g,"-")])||O(`unknown condition ${t}`),i),d=L(o.get("component")||o.get("meter")||"");"ammeter-current"!==l&&"voltmeter-voltage"!==l||c.test(d)||O(`${l} needs component=<id>`);let u=I(l),h=o.get("target"),m=u?k(h,u):void 0;u&&null==m&&O(`${l} needs a valid target value`);let g=o.get("tolerance"),b=u&&null!=g?function(e,t){if(null==e||!String(e).trim())return;let i=k(e,t);return null!=i?i:/^\s*[+]?0+(?:[.,]0+)?\s*(?:A|V|(?:ohm)|\u03a9)?\s*$/iu.test(L(e))?0:void 0}(g,u):void 0;null!=b&&b<0&&O("tolerance must not be negative"),u&&null!=g&&null==b&&O("tolerance has an invalid value or unit");let f=u?b??Math.max(.01*Math.abs(m||0),1e-12):0,x=L(o.get("mode")||"absolute").toLowerCase();return"absolute"!==x&&"signed"!==x&&O("mode must be absolute or signed"),{boardId:s,condition:l,...d?{componentId:d}:{},...null!=m?{target:m}:{},tolerance:f,magnitude:"signed"!==x,requiredAdded:function(e){let t=L(e).trim();if(!t||"[]"===t||"[0]"===t||"0"===t)return new Map;let i=t.match(/^\[([\s\S]*)\]$/);i||O("required must use [component:count;...]");let o=i[1].split(/[;,]+/).map(e=>e.trim()).filter(Boolean),r=new Map;for(let e of o){let t=e.match(/^([a-z][a-z0-9-]*)\s*:\s*(\d+)$/i);t&&(0,a.isSymbolId)(t[1])&&p.has(t[1])||O(`invalid required component ${e}`);let i=Number(t[2]);(!Number.isSafeInteger(i)||i<=0)&&O(`invalid required count ${e}`),r.set(t[1],(r.get(t[1])||0)+i)}return r}(o.get("required")||o.get("added")||""),preserveBaseline:z(o.get("preserve"),!0,"preserve"),requireChange:z(o.get("changed")||o.get("change"),!0,"changed")}}function h(e,t=e.boardId){let i=[P(t,"board id"),`condition=${e.condition}`];if(e.componentId&&i.push(`component=${P(e.componentId,"component id")}`),null!=e.target&&i.push(`target=${j(e.target)}`),null!=e.target&&i.push(`tolerance=${j(Math.max(0,e.tolerance))}`),e.magnitude||i.push("mode=signed"),e.requiredAdded.size>0){let t=[...e.requiredAdded].sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>`${e}:${t}`).join(";");i.push(`required=[${t}]`)}return i.push(`preserve=${+!!e.preserveBaseline}`),i.push(`changed=${+!!e.requireChange}`),i.join(";")}function m(e,t){return h(u(e),t)}function g(e,t,i,o=(0,s.analyzeDcCircuit)(e),r="de"){let n=function(e,t,i,o){var r,n,s;let a,l,c=(e,t={})=>({ok:"success"===e,code:e,boardId:i.boardId,condition:i.condition,...t}),u=new Map(t.components.map(e=>[e.id,e])),h=new Map(e.components.map(e=>[e.id,e]));if(i.preserveBaseline){let i;for(let e of t.components){let t=h.get(e.id);if(!t)return c("baseline-component-missing",{componentId:e.id,componentKind:e.kind});if(!x(e,t))return c("baseline-component-changed",{componentId:e.id,componentKind:e.kind})}if(r=e,n=t,i=C(r.wires.map(y)),![...C(n.wires.map(y))].every(([e,t])=>(i.get(e)||0)>=t))return c("baseline-component-changed")}if(i.requireChange&&function(e,t){var i,o;let r,n;if(e.components.length!==t.components.length||e.wires.length!==t.wires.length)return!1;let s=new Map(e.components.map(e=>[e.id,e]));return!t.components.some(e=>{let t=s.get(e.id);return!t||!x(e,t)})&&(i=e.wires.map(y),o=t.wires.map(y),r=C(i),n=C(o),r.size===n.size&&[...r].every(([e,t])=>n.get(e)===t))}(e,t))return c("unchanged");let m=e.components.find(e=>!p.has(e.kind));if(m)return c("unsupported-component",{componentId:m.id,componentKind:m.kind});let g=e.components.filter(e=>!u.has(e.id));if(i.requiredAdded.size>0){let e=new Map;for(let t of(g.forEach(t=>e.set(t.kind,(e.get(t.kind)||0)+1)),g))if(!i.requiredAdded.has(t.kind))return c("unexpected-added-component",{componentId:t.id,componentKind:t.kind});for(let[t,o]of i.requiredAdded){let i=e.get(t)||0;if(i!==o)return c("required-count",{componentKind:t,expectedCount:o,actualCount:i})}}if(i.componentId){if(!(l=h.get(i.componentId)))return c("target-component-missing",{componentId:i.componentId});let e="ammeter-current"===i.condition?"ammeter":"voltmeter-voltage"===i.condition?"voltmeter":null;if(e&&l.kind!==e)return c("target-component-kind",{componentId:l.id,componentKind:l.kind})}let b=e.components.filter(e=>d.has(e.kind));if(0===b.length)return c("no-source");if(b.length>1)return c("multiple-sources");let v=b[0],k=o.circuits.find(e=>e.componentIds.includes(v.id));if(!k)return c(f(o.status));if(l&&!k.componentIds.includes(l.id))return c("target-component-disconnected",{componentId:l.id,componentKind:l.kind});if("solved"!==k.status)return c(f(k.status));let z=(a=new E((s=e).components.flatMap(e=>w(e).map(t=>S(e.id,t)))),s.wires.forEach(e=>a.union(S(e.from.componentId,e.from.portId),S(e.to.componentId,e.to.portId))),a);for(let e of g){if(!i.requiredAdded.has(e.kind))continue;if(!k.componentIds.includes(e.id))return c("required-component-disconnected",{componentId:e.id,componentKind:e.kind});let t=w(e);if(t.length>1){let i=z.find(S(e.id,t[0]));if(t.slice(1).some(t=>z.find(S(e.id,t))===i))return c("required-component-bypassed",{componentId:e.id,componentKind:e.kind})}let r=o.components.find(t=>t.componentId===e.id);if(("resistor"===e.kind||"variable-resistor"===e.kind||"ammeter"===e.kind)&&r?.currentA!=null&&1e-10>=Math.abs(r.currentA))return c("required-component-bypassed",{componentId:e.id,componentKind:e.kind})}let P=I(i.condition);if(!P)return c("success");let L=i.target,j=function(e,t,i){if("total-current"===e.condition)return t.currentA;if("equivalent-resistance"===e.condition)return t.equivalentResistanceOhm;let o=i.components.find(t=>t.componentId===e.componentId);return"ammeter-current"===e.condition?o?.currentA:"voltmeter-voltage"===e.condition?o?.voltageV:void 0}(i,k,o);if(null==j||!Number.isFinite(j))return c("invalid-circuit");let T=i.magnitude?Math.abs(j):j,M=i.magnitude?Math.abs(L):L,O=Math.max(1,Math.abs(T),Math.abs(M),i.tolerance)*Number.EPSILON*16,A={componentId:i.componentId||v.id,actual:T,expected:M,tolerance:i.tolerance,quantity:P};return Math.abs(T-M)<=i.tolerance+O?c("success",A):c("target-mismatch",A)}(e,t,i,o);return{...n,message:b(n,r)}}function b(e,t){let i="de"===t,o=e.componentId||(i?"das Bauteil":"the component");switch(e.code){case"success":{if(null==e.actual||!e.quantity)return i?"Bedingung erfüllt: Der Stromkreis ist geschlossen.":"Condition met: the circuit is closed.";let r=T(e,t,o);return i?`Bedingung erf\u00fcllt: ${r} betr\u00e4gt ${M(e.actual,e.quantity,t)}.`:`Condition met: ${r} is ${M(e.actual,e.quantity,t)}.`}case"unchanged":return i?"Ergänze oder verkable die vorgegebene Schaltung, bevor du prüfst.":"Complete or wire the preset circuit before checking it.";case"baseline-component-missing":return i?`Das vorgegebene Bauteil ${o} fehlt.`:`Preset component ${o} is missing.`;case"baseline-component-changed":return i?`Das vorgegebene Bauteil ${o} wurde elektrisch ver\u00e4ndert.`:`Preset component ${o} was changed electrically.`;case"required-count":return i?`Erg\u00e4nze genau ${e.expectedCount} Bauteil(e) vom Typ ${e.componentKind}; aktuell sind es ${e.actualCount}.`:`Add exactly ${e.expectedCount} component(s) of type ${e.componentKind}; currently there are ${e.actualCount}.`;case"unexpected-added-component":return i?`Das zus\u00e4tzlich eingebaute Bauteil ${o} ist f\u00fcr diese Aufgabe nicht erlaubt.`:`Added component ${o} is not allowed in this task.`;case"required-component-disconnected":return i?`Das erg\u00e4nzte Bauteil ${o} geh\u00f6rt noch nicht zum gespeisten Stromkreis.`:`Added component ${o} is not part of the powered circuit.`;case"required-component-bypassed":return i?`Das erg\u00e4nzte Bauteil ${o} wird \u00fcberbr\u00fcckt oder f\u00fchrt keinen Strom.`:`Added component ${o} is bypassed or carries no current.`;case"target-component-missing":return i?`Das Zielmessger\u00e4t ${o} fehlt.`:`Target meter ${o} is missing.`;case"target-component-kind":return i?`${o} ist nicht das f\u00fcr diese Bedingung ben\u00f6tigte Messger\u00e4t.`:`${o} is not the meter required by this condition.`;case"target-component-disconnected":return i?`Das Zielmessger\u00e4t ${o} geh\u00f6rt zu keinem gespeisten Stromkreis.`:`Target meter ${o} is not part of a powered circuit.`;case"unsupported-component":return i?`${o} wird in Erg\u00e4nzungsquizzen f\u00fcr Gleichstrom noch nicht unterst\u00fctzt.`:`${o} is not yet supported in DC completion quizzes.`;case"no-source":return i?"Es fehlt eine Gleichspannungsquelle.":"A DC voltage source is missing.";case"multiple-sources":return i?"Das Ergänzungsquiz unterstützt genau eine Gleichspannungsquelle.":"The completion quiz supports exactly one DC voltage source.";case"circuit-open":return i?"Der Stromkreis ist noch offen: Es fehlt ein leitender Rückweg.":"The circuit is still open: a conductive return path is missing.";case"short-circuit":return i?"Die Spannungsquelle ist kurzgeschlossen.":"The voltage source is short-circuited.";case"incomplete-circuit":return i?"Mindestens ein elektrischer Wert fehlt oder ist ungültig.":"At least one electrical value is missing or invalid.";case"invalid-circuit":return i?"Die Schaltung ist nicht eindeutig lösbar oder enthält ein nicht unterstütztes Netz.":"The circuit is ambiguous or contains an unsupported network.";case"target-mismatch":{let r=M(e.actual||0,e.quantity||"current",t),n=M(e.expected||0,e.quantity||"current",t),s=M(e.tolerance||0,e.quantity||"current",t),a=T(e,t,o);return i?`${a} betr\u00e4gt ${r}; gefordert sind ${n} \u00b1 ${s}.`:`${a} is ${r}; required are ${n} \u00b1 ${s}.`}}return i?"Die Bedingung konnte nicht geprüft werden.":"The condition could not be checked."}function f(e){switch(e){case"empty":case"no-source":return"no-source";case"open":return"circuit-open";case"short-circuit":return"short-circuit";case"incomplete":return"incomplete-circuit";case"unsupported":return"unsupported-component";case"invalid":return"invalid-circuit";case"solved":return"success"}}function x(e,t){return e.kind===t.kind&&(d.has(e.kind)?v(e.value,t.value,s.parseVoltageValue):"resistor"!==e.kind&&"variable-resistor"!==e.kind||v(e.value,t.value,s.parseResistanceValue))}function v(e,t,i){let o=i(e),r=i(t);return null==o||null==r?String(e||"").trim()===String(t||"").trim():Math.abs(o-r)<=1e-12*Math.max(1,Math.abs(o),Math.abs(r))}function y(e){return[S(e.from.componentId,e.from.portId),S(e.to.componentId,e.to.portId)].sort().join("|")}function C(e){let t=new Map;return e.forEach(e=>t.set(e,(t.get(e)||0)+1)),t}function w(e){return a.SYMBOL_BY_ID[e.kind].terminals.map(e=>e.id)}class E{parent=new Map;constructor(e){for(const t of e)this.parent.set(t,t)}find(e){this.parent.has(e)||this.parent.set(e,e);let t=this.parent.get(e);if(t===e)return e;let i=this.find(t);return this.parent.set(e,i),i}union(e,t){let i=this.find(e),o=this.find(t);i!==o&&this.parent.set(o,i)}}function S(e,t){return`${e}:${t}`}function I(e){return"ammeter-current"===e||"total-current"===e?"current":"voltmeter-voltage"===e?"voltage":"equivalent-resistance"===e?"resistance":null}function k(e,t){if(null==e||!String(e).trim())return;let i=L(e),o="current"===t?(0,s.parseCurrentValue)(i):"voltage"===t?(0,s.parseVoltageValue)(i):(0,s.parseResistanceValue)(i);return null==o?void 0:o}function z(e,t,i){if(null==e||!String(e).trim())return t;let o=L(e).trim().toLowerCase();return!!["1","true","yes","on","ja"].includes(o)||!["0","false","no","off","nein"].includes(o)&&void O(`${i} must be 0 or 1`)}function P(e,t){return c.test(e)||O(`${t} is invalid`),e}function L(e){let t=String(e||"").trim();if(t.length<2)return t;let i=t[0];return i===t[t.length-1]&&('"'===i||"'"===i||"`"===i)?t.slice(1,-1).trim():t}function j(e){return String(Number(e.toPrecision(12)))}function T(e,t,i){let o="de"===t;return"total-current"===e.condition?o?"Der Gesamtstrom":"The total current":"equivalent-resistance"===e.condition?o?"Der Ersatzwiderstand":"The equivalent resistance":"ammeter-current"===e.condition||"voltmeter-voltage"===e.condition?o?`Der Messwert von ${i}`:`The reading of ${i}`:i}function M(e,t,i){let o=Math.abs(e),r=e,n="current"===t?"A":"voltage"===t?"V":"Ω";"current"===t?o>0&&o<1e-6?(r=1e9*e,n="nA"):o>0&&o<.001?(r=1e6*e,n="µA"):o>0&&o<1&&(r=1e3*e,n="mA"):"voltage"===t?o>0&&o<1&&(r=1e3*e,n="mV"):o>=1e6?(r=e/1e6,n="MΩ"):o>=1e3&&(r=e/1e3,n="kΩ");let s=new Intl.NumberFormat("de"===i?"de-DE":"en-US",{maximumFractionDigits:6}).format(r);return`${s} ${n}`}function O(e){throw new l(e)}},{"./config.ts":"73RYQ","./physics.ts":"dnk77","./symbols.ts":"9hsna","@parcel/transformer-js/src/esmodule-helpers.js":"gC6AD"}]},["btjAh"],"btjAh","parcelRequireb93e",{});