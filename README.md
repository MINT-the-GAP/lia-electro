<!--
author: MINT-the-GAP, Martin Lommatzsch
version: 1.0.0
language: de
comment: Interaktives LiaScript-Template zum Zeichnen und Analysieren elektrotechnischer Gleichstromkreise auf lia-coordinate-Boards.
tags: Elektrotechnik, Schaltplan, JSXGraph, LiaScript

import: https://cdn.jsdelivr.net/gh/LiaTemplates/JSXGraph@main/README.md
import: https://raw.githubusercontent.com/MINT-the-GAP/lia-coordinate/Proposal/README.md

script: ./dist/index.js

attribute: Built with [lia-coordinate](https://github.com/MINT-the-GAP/lia-coordinate)
           and [JSXGraph](https://jsxgraph.org/).

@Electro: @Electro_(@uid,`@0`,@language)

@Electro_
@CoordinateSystem(`@1`)

<span id="electro-ui-@0" style="display:none;"></span>

<script modify="false">
(function () {
  const uid = '@0';
  const spec = "@'1";
  const language = "@'2";
  const anchor = document.getElementById(`electro-ui-${uid}`);
  if (anchor) {
    anchor.dataset.spec = spec;
    anchor.dataset.language = language;
  }
  const run = function () {
    if (typeof window.__setupElectro === 'function') {
      window.__setupElectro(uid, spec, language);
    }
  };
  if (typeof window.__setupElectro === 'function') {
    run();
  } else {
    window.__liaElectroHooks = window.__liaElectroHooks || [];
    window.__liaElectroHooks.push(run);
  }
})();
</script>
@end

@ElectroOn: @ElectroOn_(@uid,`@0`,@language)

@ElectroOn_
<span id="electro-ui-@0" style="display:none;"></span>

<script modify="false">
(function () {
  const uid = '@0';
  const spec = "@'1";
  const language = "@'2";
  const anchor = document.getElementById(`electro-ui-${uid}`);
  if (anchor) {
    anchor.dataset.spec = spec;
    anchor.dataset.language = language;
  }
  const run = function () {
    if (typeof window.__setupElectro === 'function') {
      window.__setupElectro(uid, spec, language);
    }
  };
  if (typeof window.__setupElectro === 'function') {
    run();
  } else {
    window.__liaElectroHooks = window.__liaElectroHooks || [];
    window.__liaElectroHooks.push(run);
  }
})();
</script>
@end

@ElectroBattery: @ElectroComponent_(@uid,battery,`@0`)
@ElectroBatterie: @ElectroComponent_(@uid,battery,`@0`)
@ElectroResistor: @ElectroComponent_(@uid,resistor,`@0`)
@ElectroWiderstand: @ElectroComponent_(@uid,resistor,`@0`)
@ElectroVariableResistor: @ElectroComponent_(@uid,variable-resistor,`@0`)
@ElectroRegelbarerWiderstand: @ElectroComponent_(@uid,variable-resistor,`@0`)
@ElectroCapacitor: @ElectroComponent_(@uid,capacitor,`@0`)
@ElectroKondensator: @ElectroComponent_(@uid,capacitor,`@0`)
@ElectroInductor: @ElectroComponent_(@uid,inductor,`@0`)
@ElectroSpule: @ElectroComponent_(@uid,inductor,`@0`)
@ElectroIronCoreInductor: @ElectroComponent_(@uid,iron-core-inductor,`@0`)
@ElectroSpuleMitEisenkern: @ElectroComponent_(@uid,iron-core-inductor,`@0`)
@ElectroVoltmeter: @ElectroComponent_(@uid,voltmeter,`@0`)
@ElectroAmmeter: @ElectroComponent_(@uid,ammeter,`@0`)
@ElectroAmperemeter: @ElectroComponent_(@uid,ammeter,`@0`)
@ElectroMotor: @ElectroComponent_(@uid,motor,`@0`)
@ElectroLamp: @ElectroComponent_(@uid,lamp,`@0`)
@ElectroLampe: @ElectroComponent_(@uid,lamp,`@0`)
@ElectroDiode: @ElectroComponent_(@uid,diode,`@0`)
@ElectroPhotodiode: @ElectroComponent_(@uid,photodiode,`@0`)
@ElectroLED: @ElectroComponent_(@uid,led,`@0`)
@ElectroVoltageSource: @ElectroComponent_(@uid,voltage-source,`@0`)
@ElectroSpannungsquelle: @ElectroComponent_(@uid,voltage-source,`@0`)
@ElectroSwitch: @ElectroComponent_(@uid,switch,`@0`)
@ElectroSchalter: @ElectroComponent_(@uid,switch,`@0`)
@ElectroChangeoverSwitch: @ElectroComponent_(@uid,changeover-switch,`@0`)
@ElectroUmschalter: @ElectroComponent_(@uid,changeover-switch,`@0`)
@ElectroGround: @ElectroComponent_(@uid,ground,`@0`)
@ElectroErde: @ElectroComponent_(@uid,ground,`@0`)
@ElectroAntenna: @ElectroComponent_(@uid,antenna,`@0`)
@ElectroAntenne: @ElectroComponent_(@uid,antenna,`@0`)
@ElectroTransistor: @ElectroComponent_(@uid,transistor,`@0`)
@ElectroTransformer: @ElectroComponent_(@uid,transformer,`@0`)
@ElectroTransformator: @ElectroComponent_(@uid,transformer,`@0`)

@ElectroComponent_
<span id="electro-component-spec-@0"
      class="lia-electro-component-spec"
      data-kind="@1"
      data-spec="@2"
      hidden
      aria-hidden="true"></span>
@end

@ElectroWire: @ElectroWire_(@uid,`@0`)
@ElectroKabel: @ElectroWire_(@uid,`@0`)

@ElectroWire_
<span id="electro-wire-spec-@0"
      class="lia-electro-wire-spec"
      data-spec="@1"
      hidden
      aria-hidden="true"></span>
@end

@ElectroCompletionQuiz: @ElectroCompletionQuiz_(@uid,`@0`,@language)
@ElectroErgaenzungsquiz: @ElectroCompletionQuiz_(@uid,`@0`,@language)

@ElectroCompletionQuiz_
[[!]]
<script>
if ("@input" === "true") {
  true
} else {
  const fallback = "@'2" === "de"
    ? "Die Schaltung erfüllt die Bedingung noch nicht."
    : "The circuit does not meet the condition yet.";
  window.setTimeout(function () {
    try {
      const checker = window.__electro && window.__electro.checkCompletion;
      const result = typeof checker === "function" ? checker("@'1") : null;
      if (result && result.ok) {
        send.lia("true");
      } else {
        send.lia(result && result.message ? result.message : fallback, [], false);
      }
    } catch (error) {
      send.lia(error && error.message ? error.message : fallback, [], false);
    }
  }, 0);
  "LIA: wait"
}
</script>

<span id="electro-completion-spec-@0"
      class="lia-electro-completion-spec"
      data-spec="@1"
      hidden
      aria-hidden="true"></span>
@end
-->

# Electro – interaktive Schaltpläne in LiaScript

          --{{0}}--

`lia-electro` ist ein erster funktionsfähiger Template-Entwurf für Schaltpläne auf
einem [lia-coordinate](https://github.com/MINT-the-GAP/lia-coordinate)-Board.
Bauteile werden aus einer Palette platziert, im Raster verschoben, in
90°-Schritten gedreht und über rechtwinklige Kabel an ihren Anschlüssen verbunden.
Optionaler Name und Wert werden als Beschriftung am Bauteil angezeigt.

> **Proposal-Status:** Die Integration verwendet die gegenwärtige, globale
> Board-Registry `window.__boards` von `lia-coordinate`. Für eine spätere stabile
> Kopplung ist eine allgemeine Extension-API in `lia-coordinate` vorgesehen.

## Import

          --{{0}}--

Da verschachtelte Template-Imports nicht in allen LiaScript-Kontexten zuverlässig
aufgelöst werden, sollten Kurse die drei benötigten Templates direkt importieren:

``` markdown
import: https://cdn.jsdelivr.net/gh/LiaTemplates/JSXGraph@main/README.md
import: https://raw.githubusercontent.com/MINT-the-GAP/lia-coordinate/Proposal/README.md
import: https://raw.githubusercontent.com/MINT-the-GAP/lia-electro/main/README.md
```

Die folgende Zeile ersetzt im Dreifachimport die `Proposal`-Zeile und pinnt
`lia-coordinate` auf den untersuchten Stand:

``` markdown
import: https://raw.githubusercontent.com/MINT-the-GAP/lia-coordinate/1e1f7be4ea807c8360d10bf6b251a1272974212e/README.md
```

Vollständig reproduzierbar ist der Import erst, wenn auch JSXGraph und Electro
auf Tags oder Commits zeigen. Für einen veröffentlichten Electro-Tag ersetzt zum
Beispiel die folgende Zeile den `main`-Import:

``` markdown
import: https://raw.githubusercontent.com/MINT-the-GAP/lia-electro/0.9.0/README.md
```

## `@Electro`

          --{{0}}--

`@Electro` erzeugt das Koordinaten-Board und setzt den Schaltplaneditor hinein.
Die Parameter werden mit Semikolon getrennt. Die üblichen
`@CoordinateSystem`-Parameter werden unverändert weitergereicht.

Zusätzliche Electro-Parameter beim ersten Anlegen einer Board-ID:

- `id` – eindeutige Board-ID (erforderlich),
- `snap` oder `raster` – Rasterweite für Bauteilzentren, Standard `0.5`,
- `stub` – kurze gerade Kabelstrecke direkt am Anschluss, Standard `0.35`.

Nach Wiederherstellung oder JSON-Import sind die Werte unter `settings` im
Schaltungsmodell normativ; dadurch verändert ein Rebootstrap nicht unbemerkt
Raster oder Kabelführung einer vorhandenen Zeichnung.

``` markdown
@Electro(`xmin=-10;xmax=10;ymin=-6;ymax=6;width=900;id=electro_demo;snap=0.5;stub=0.35;0;0;1`)
```

---

@Electro(`xmin=-10;xmax=10;ymin=-6;ymax=6;width=900;id=electro_demo;snap=0.5;stub=0.35;0;0;1`)


## Bedienung

          --{{0}}--

1. **Bauteile** öffnet die Symbolpalette. Symbol wählen und anschließend in das
   Raster klicken. Das Werkzeug bleibt für weitere Platzierungen aktiv.
2. Mit **Auswählen** ein Bauteil anklicken und ziehen.
3. Ein Rechtsklick auf ein Bauteil öffnet rechts das Eigenschaftenpanel im
   DGS-Stil. Der **Name** steht direkt neben dem Bauteiltyp, der **Wert** darunter;
   beide erscheinen auch als Beschriftung am Bauteil. Eingaben werden mit
   `Enter` oder beim Verlassen des Feldes übernommen. `Esc` verwirft nur die
   aktuelle Feldeingabe, das `×` schließt das Panel. Für Touch und Tastatur
   öffnet der Werkzeugleistenknopf **Bauteileigenschaften bearbeiten** dasselbe Panel
   für die Auswahl. Bei unterstützten Bauteilen stehen darunter automatisch
   berechnete Spannungen, Ströme und Leistungen. Mit **Fixieren** wird das
   Bauteil gegen Verschieben und Drehen gesperrt. Es bleibt auswählbar,
   verkabelbar, bearbeitbar und löschbar; die Fixierung kann im selben Panel
   wieder aufgehoben werden.
4. **Objektliste** öffnet rechts eine Übersicht aller Bauteile und Kabel. Ein
   Bauteileintrag öffnet sein Eigenschaftenpanel, ein Kabeleintrag markiert das
   Kabel. **Export** im Fuß der Liste öffnet zuerst die DGS-artige Auswahl der
   erlaubten Bauteile und Einschränkungen. **Weiter** führt zur optionalen
   Ergänzungsaufgabe und danach zum schreibgeschützten vollständigen
   LiaScript-Makroblock.
5. Mit **Drehen** oder `R` wird die Auswahl um 90° im Uhrzeigersinn gedreht.
   Bei fixierten Bauteilen ist diese Aktion gesperrt.
6. **Kabel** wählen, dann zwei Anschlusskreise anklicken. Das Kabel bleibt beim
   Verschieben und Drehen mit beiden Anschlüssen verbunden.
7. Während der zweite Anschluss gewählt wird, schaltet die Leertaste zwischen
   horizontal-zuerst und vertikal-zuerst um.
8. Ein markiertes Kabel kann ebenfalls mit `R` auf die andere rechtwinklige Route
   umgeschaltet werden.

Weitere Tasten:

| Taste | Aktion |
|---|---|
| `V` | Auswahlwerkzeug |
| `W` | Kabelwerkzeug |
| `R` | Freies Bauteil drehen / Kabelroute wechseln |
| `Umschalt` + `F10` oder `Kontextmenü-Taste` | Eigenschaften des markierten Bauteils öffnen |
| `Entf` oder `Backspace` | Auswahl löschen |
| `Strg`/`Cmd` + `Z` | Rückgängig |
| `Strg`/`Cmd` + `Y` oder `Umschalt` + `Z` | Wiederholen |
| `Esc` | Im Eigenschaftenfeld die aktuelle Eingabe verwerfen; sonst Kabelentwurf/aktives Werkzeug abbrechen |

## TeX-Beschriftungen und Gleichstromanalyse

          --{{0}}--

Bauteilbeschriftungen werden als MathJax-fähiger JSXGraph-HTML-Text erzeugt.
Normaler Text wie `Widerstand links` bleibt normaler Text. Mathematische Namen
wie `R_1` sowie explizit mit `$...$` oder `$$...$$` markierte Ausdrücke werden
als TeX gesetzt. Gängige physikalische Werte werden automatisch umgewandelt:

| Eingabe | Anzeige |
|---|---|
| `R_1` oder `$R_1$` | \(R_1\) |
| `220 Ω` | \(220\,\Omega\) |
| `4,7 kΩ` | \(4{,}7\,\mathrm{k}\Omega\) |
| `9 V` | \(9\,\mathrm{V}\) |

Die Beschriftung folgt der sichtbaren Ausrichtung des Symbols: Bei
waagerechten Bauteilen steht der Name oberhalb und der Wert unterhalb. Bei
visuell vertikalen Bauteilen stehen Name und Wert links und rechts neben dem
Symbol. Die Anordnung folgt der Rotation; der Text selbst bleibt horizontal
lesbar.

Die Gleichstromanalyse verwendet die Kabel als elektrische Knoten und löst das
lineare Netz mit der Knotenspannungsmethode. Unterstützt werden derzeit:

- **Batterie** und **Spannungsquelle** als ideale Gleichspannungsquellen; ihr
  Wert wird in Volt angegeben, beispielsweise `9 V` oder `250 mV`.
- **Widerstand** und **regelbarer Widerstand** als ohmsche Widerstände; ihr Wert
  wird in Ohm angegeben, beispielsweise `220 Ω` oder `4,7 kΩ`.
- **Amperemeter** als ideales Messgerät mit null Volt Spannungsabfall und
  **Voltmeter** als ideal offener Messzweig.

Amperemeter und Voltmeter zeigen ihren berechneten, TeX-gesetzten Messwert
am Symbol an: bei horizontalen Bauteilen darunter, bei vertikalen seitlich.
Die Anzeige reagiert live auf geänderte Werte,
Kabel, Import sowie Rückgängig/Wiederholen. Sie bleibt bei einem nicht
lösbaren Stromkreis leer, damit kein veralteter oder nur scheinbar gemessener
Wert stehen bleibt. Im Eigenschaftenpanel kann **Messwert am Symbol anzeigen**
deaktiviert werden. Dadurch wird nur die Beschriftung am Messgerät ausgeblendet;
Analyse und Werte im Eigenschaftenpanel bleiben erhalten. Die Objektliste
kennzeichnet den ausgeblendeten Messwert, und `showMeasurement: false` wird im
JSON gespeichert.

Reihen- und Parallelschaltungen werden automatisch erkannt. Im
Eigenschaftenpanel erscheinen Gesamtspannung \(U\), Ersatzwiderstand
\(R_\mathrm{ges}\), Gesamtstrom \(I\) sowie für das gewählte Bauteil
Spannung, Strom und Leistung. Die Statuszeile unterscheidet einen geschlossenen
Stromkreis, einen offenen Stromkreis, einen Kurzschluss, fehlende Werte und
nicht unterstützte Bauteile.

Bei der Batterie gilt Anschluss `b` als Pluspol und `a` als Minuspol; bei der
Spannungsquelle gelten die Anschlüsse `plus` und `minus`. Vorzeichen an
Widerständen und Messgeräten beziehen sich auf die im Panel angegebene
Anschlussrichtung, beispielsweise `a → b`. Die Rotation eines Symbols verändert
diese elektrische Polung nicht.

Die berechneten Größen sind abgeleitet. Sie werden bei jeder Änderung, bei
Import sowie bei Rückgängig/Wiederholen neu bestimmt und nicht in das JSON
geschrieben. Programmatisch liefert
`window.__electro.analyzeDC("board-id")` denselben Analysezustand.

## Theme und LiaScript-Modi

          --{{0}}--

Electro setzt bewusst weder `mode:` noch `dark:` im Template-Kopf und respektiert
damit die Einstellungen des verwendenden Kurses und der Lernenden. Der Editor
funktioniert in `Textbook`, `Slides` und `Presentation`; seine Bedienelemente
behalten dabei eine feste, lesbare UI-Typografie.

Light-/Dark- und Akzentwechsel werden zur Laufzeit von `lia-coordinate`
übernommen. Oberfläche, Vordergrund und Aktionsfarbe besitzen getrennte Rollen:
Normale Bauteile und Kabel verwenden die kontrastreiche Vordergrundfarbe,
während Auswahlrahmen und aktive Anschlüsse eine vom Akzentraster abgesetzte
Aktionsfarbe erhalten.

## Vorhandenes Board erweitern

          --{{0}}--

Mit `@ElectroOn` kann der Editor an ein bereits erzeugtes Koordinaten-Board
gebunden werden. Die Board-ID darf positional oder als `id=...` angegeben werden.
Die mehrdeutigen IDs `0` und `1` müssen wegen der positionalen Board-Flags in
der benannten Form `id=0` beziehungsweise `id=1` geschrieben werden.

``` markdown
@CoordinateSystem(`xmin=-8;xmax=8;ymin=-5;ymax=5;width=800;id=existing_board;0;1;1`)

@ElectroOn(`existing_board;snap=0.5`)
```

`@DGS` und `@ElectroOn` sollten im Proposal noch nicht gleichzeitig an dasselbe
Board gebunden werden, weil beide Werkzeuge Pointer-Ereignisse und eigene
Werkzeugleisten verwalten.

## Makrobasis

          --{{0}}--

Ein exportierter Schaltplan ist ein echter LiaScript-Makroblock. Er beginnt mit
dem Koordinatensystem, deklariert danach jedes Bauteil und jedes Kabel einzeln
und bindet den Editor mit `@ElectroOn` an das Board. Bei einer Aufgabe folgt
danach das Prüfmakro:

``` text
CoordinateSystem → Komponenten → Kabel → ElectroOn → optionales Ergänzungsquiz
```

Die Bauteil- und Kabelmakros erzeugen zunächst nur verborgene Deklarationen.
`@ElectroOn` sammelt alle Deklarationen mit derselben Board-ID, validiert daraus
ein vollständiges Schaltungsmodell und initialisiert anschließend den Editor.
Dadurch werden Kabel erst ausgewertet, nachdem sämtliche referenzierten
Bauteile bekannt sind.

Alle Bauteilmakros verwenden dieselbe positionale Grammatik:

``` text
board;id;x;y;rotation[;name;value;showMeasurement;locked]
```

- `board` und `id` müssen dem Muster `[A-Za-z0-9_-]{1,80}` entsprechen.
- `x` und `y` sind endliche Koordinaten; `rotation` ist `0`, `90`, `180` oder
  `270`.
- `name` und `value` sind optionale einzeilige Texte. Ein Semikolon trennt
  Felder und darf daher nicht roh im Text stehen. Der Exporter versieht Texte
  mit problematischen Zeichen bei Bedarf mit `~` und einer reversiblen
  Prozentkodierung. TeX-Ausdrücke wie `$R_1$` bleiben dabei erhalten.
- `showMeasurement` ist nur bei Volt- und Amperemetern zulässig: `0` blendet
  den Messwert am Symbol aus, `1` zeigt ihn an. Leere optionale Felder bleiben
  als leere Positionen erhalten, beispielsweise `...;0;;;0`.
- `locked` ist für alle Bauteile zulässig: `1` fixiert Position und Drehung,
  `0` oder ein leeres Feld lässt das Bauteil beweglich. Bei einem fixierten
  Nicht-Messgerät bleibt die davorliegende Messwertposition leer, zum Beispiel
  `...;R_1;220 Ω;;1`.

Kabel verwenden diese Grammatik:

``` text
board;id;fromComponent;fromPort;toComponent;toPort;route
```

`route` ist entweder `horizontal-first` oder `vertical-first`. Die Anschluss-ID
muss zu dem jeweiligen Bauteiltyp passen.

| Profil-ID | Symboltyp | Englisch | Deutsch | Anschluss-IDs |
|---:|---|---|---|---|
| `100` | `battery` | `@ElectroBattery` | `@ElectroBatterie` | `a`, `b` |
| `200` | `resistor` | `@ElectroResistor` | `@ElectroWiderstand` | `a`, `b` |
| `210` | `variable-resistor` | `@ElectroVariableResistor` | `@ElectroRegelbarerWiderstand` | `a`, `b` |
| `220` | `capacitor` | `@ElectroCapacitor` | `@ElectroKondensator` | `a`, `b` |
| `230` | `inductor` | `@ElectroInductor` | `@ElectroSpule` | `a`, `b` |
| `240` | `iron-core-inductor` | `@ElectroIronCoreInductor` | `@ElectroSpuleMitEisenkern` | `a`, `b` |
| `600` | `voltmeter` | `@ElectroVoltmeter` | `@ElectroVoltmeter` | `a`, `b` |
| `610` | `ammeter` | `@ElectroAmmeter` | `@ElectroAmperemeter` | `a`, `b` |
| `510` | `motor` | `@ElectroMotor` | `@ElectroMotor` | `a`, `b` |
| `500` | `lamp` | `@ElectroLamp` | `@ElectroLampe` | `a`, `b` |
| `300` | `diode` | `@ElectroDiode` | `@ElectroDiode` | `anode`, `cathode` |
| `310` | `photodiode` | `@ElectroPhotodiode` | `@ElectroPhotodiode` | `anode`, `cathode` |
| `320` | `led` | `@ElectroLED` | `@ElectroLED` | `anode`, `cathode` |
| `110` | `voltage-source` | `@ElectroVoltageSource` | `@ElectroSpannungsquelle` | `minus`, `plus` |
| `400` | `switch` | `@ElectroSwitch` | `@ElectroSchalter` | `common`, `throw` |
| `410` | `changeover-switch` | `@ElectroChangeoverSwitch` | `@ElectroUmschalter` | `common`, `a`, `b` |
| `700` | `ground` | `@ElectroGround` | `@ElectroErde` | `terminal` |
| `710` | `antenna` | `@ElectroAntenna` | `@ElectroAntenne` | `terminal` |
| `800` | `transistor` | `@ElectroTransistor` | `@ElectroTransistor` | `base`, `collector`, `emitter` |
| `900` | `transformer` | `@ElectroTransformer` | `@ElectroTransformator` | `primary-top`, `primary-bottom`, `secondary-top`, `secondary-bottom` |

Die englischen und deutschen Namen sind gleichwertige Aliasse. Auch Kabel
besitzen mit `@ElectroWire` und `@ElectroKabel` beide Schreibweisen.

Ein vollständiger, geschlossener Beispielstromkreis sieht in englischer
Makroschreibweise so aus:

``` markdown
@CoordinateSystem(`xmin=-8;xmax=8;ymin=-5;ymax=5;width=800;id=electro_macro;snap=0.5;stub=0.35;0;1;1`)
@ElectroBattery(`electro_macro;c_0001;-3;0;0;B_1;9 V`)
@ElectroResistor(`electro_macro;c_0002;2;0;0;R_1;220 Ω;;1`)
@ElectroWire(`electro_macro;w_0001;c_0001;b;c_0002;a;horizontal-first`)
@ElectroWire(`electro_macro;w_0002;c_0002;b;c_0001;a;vertical-first`)
@ElectroOn(`xmin=-8;xmax=8;ymin=-5;ymax=5;width=800;id=electro_macro;snap=0.5;stub=0.35;components=[100;110;200;210;220;230;240;300;310;320;400;410;500;510;600;610;700;710;800;900];0;1;1`)
```

### Exportprofil: erlaubte Bauteile und Einschränkungen

Das DGS-artige Exportprofil wird als Teil der abschließenden `@ElectroOn`-Spec
gespeichert. Es besitzt zwei voneinander unabhängige Listen:

``` text
components=[<stabile Bauteil-ID>;...];restrictions=[<stabile Restriktions-ID>;...]
```

Die Bauteil-IDs stehen in der Makrotabelle oben. Sie sind unveränderliche
Fähigkeitskennungen und keine Positionen in der Palette. Bauteil- und
Restriktions-IDs bilden getrennte Namensräume; dieselbe Zahl kann daher in
beiden Listen eine jeweils andere Fähigkeit bezeichnen. Der Exporter sortiert
und dedupliziert beide Listen. Fehlende, leere oder nichtnumerische
`components`-Angaben behalten aus Kompatibilitätsgründen die vollständige
Bauteilpalette. `components=[0]` ist dagegen die ausdrückliche leere
Auswahlliste. Bei `restrictions` bedeuten eine fehlende, leere, nichtnumerische
oder als `[0]` angegebene Liste einen uneingeschränkten Editor. Unbekannte
positive IDs werden beim erneuten Export bewahrt, damit spätere Fähigkeiten
verlustfrei durch ältere Template-Versionen transportiert werden können.

Die Bauteilauswahl schränkt ausschließlich die **Neuplatzierung** aus der
Palette ein. Bereits vorhandene, durch Makros deklarierte oder aus dem
Browserzustand wiederhergestellte Bauteile bleiben sichtbar, elektrisch aktiv,
verkabelbar und exportierbar. Kabel, Auswahl, Objektliste sowie Undo/Redo sind
keine Bauteiltypen und bleiben als Editor-Infrastruktur verfügbar.

| Restriktions-ID | Checkbox | Wirkung im importierten Editor |
|---:|---|---|
| `100` | Rechtsklick für alle Bauteile sperren | Sperrt das Eigenschaftenmenü für alle Bauteile, einschließlich Aufrufen über die Objektliste und die Tastatur. |
| `110` | Rechtsklick nur für Makro-Bauteile sperren | Sperrt das Eigenschaftenmenü nur für Bauteile mit Makroherkunft. Interaktiv neu platzierte Bauteile bleiben bearbeitbar. |
| `120` | Vorgabeobjekte vollständig schützen | Schützt alle vorgegebenen Makrobauteile und Kabel vor Eigenschaften, Löschen, Verschieben, Drehen und Routenwechsel. **Leeren** setzt dann nur die Ergänzungen zurück. |
| `300` | Messwertanzeige sperren | Die Anzeigeoptionen der Messgeräte sind nicht änderbar und sichtbare Messwerte werden unterdrückt; die zugrunde liegende Autoreneinstellung bleibt erhalten. |
| `400` | Export in der Objektliste sperren | Blendet den Export aus und verhindert das Öffnen des Exportdialogs. |

Die beiden Rechtsklickmodi `100` und `110` sind im Dialog gegenseitig
ausschließend. Werden beide IDs von Hand notiert, hat die vollständige Sperre
`100` Vorrang und `110` wird beim Einlesen verworfen.

Die Herkunft eines Bauteils wird nicht als zusätzliches Feld seines öffentlichen
Bauteilmakros geschrieben. Jede durch `@ElectroBattery`,
`@ElectroWiderstand` oder ein anderes Bauteilmakro erzeugte Deklaration erhält
beim Einlesen automatisch die Herkunft `macro`; eine Platzierung aus der
Editorpalette erhält `editor`. Diese Herkunft bleibt in Persistenz und
Undo/Redo erhalten. Nach Export und erneutem Import gelten folgerichtig alle im
Makroblock deklarierten Bauteile als Makrobauteile, auch wenn sie ursprünglich
interaktiv platziert wurden.

Ein Profil mit Batterie, Widerstand, Volt- und Amperemeter, gesperrten
Makrobauteil-Eigenschaften und gesperrter Messwertanzeige endet beispielsweise
mit:

``` markdown
@ElectroOn(`xmin=-8;xmax=8;ymin=-5;ymax=5;width=800;id=electro_macro;snap=0.5;stub=0.35;components=[100;200;600;610];restrictions=[110;300];0;1;1`)
```

## Ergänzungsquiz

          --{{0}}--

Mit `@ElectroErgaenzungsquiz` wird eine vorgegebene Schaltung zu einer
LiaScript-Aufgabe `[[!]]`. Beim Prüfen wird nicht die Zeichnung, sondern das
elektrische Netz bewertet: Die Vorgabe muss erhalten sein, geforderte neue
Bauteile müssen wirklich im gespeisten Stromkreis liegen und dürfen nicht mit
einem Kabel überbrückt werden. Erst danach wird der berechnete Sollwert
einschließlich Toleranz verglichen.

Die Quiz-Spec verwendet dieselbe semikolongetrennte Form wie die übrigen
Makros:

``` text
board;condition=<Bedingung>;component=<Messgerät>;target=<Wert>;tolerance=<Wert>;required=[<Typ>:<Anzahl>];preserve=1;changed=1
```

| `condition` | Geprüfte Größe | Zusätzliche Angaben |
|---|---|---|
| `closed` | geschlossener, lösbarer Stromkreis | kein Sollwert |
| `ammeter-current` | Strom eines bestimmten Amperemeters | `component`, `target`, `tolerance` |
| `voltmeter-voltage` | Spannung eines bestimmten Voltmeters | `component`, `target`, `tolerance` |
| `total-current` | Betrag des Quellenstroms | `target`, `tolerance` |
| `equivalent-resistance` | Ersatzwiderstand des gespeisten Netzes | `target`, `tolerance` |

Physikalische Einheiten und SI-Präfixe sind erlaubt, beispielsweise `20 mA`,
`6 V`, `0,1 mA` oder `300 Ohm`. Standardmäßig wird der Betrag verglichen;
`mode=signed` bezieht zusätzlich die feste Anschlussrichtung des Messgeräts
ein. `required=[resistor:1]` fordert genau einen neu eingesetzten Widerstand.
`preserve=1` schützt die elektrische Vorgabe bei der Auswertung und
`changed=1` weist eine unveränderte Abgabe zurück.

Das folgende lauffähige Beispiel gibt eine offene Reihenschaltung vor. Es muss
genau ein weiterer Widerstand eingesetzt und verkabelt werden, sodass `A1`
`20 mA` anzeigt:

``` markdown
@Koordinatensystem(`xmin=-7;xmax=7;ymin=-5;ymax=5;width=850;id=electro_ergaenzen;snap=0.5;stub=0.35;0;1;1`)
@ElectroBatterie(`electro_ergaenzen;U1;-5;0;90;U_1;6 V;;1`)
@ElectroAmperemeter(`electro_ergaenzen;A1;0;3;0;A_1;;1;1`)
@ElectroWiderstand(`electro_ergaenzen;R1;5;0;90;R_1;100 Ohm;;1`)
@ElectroKabel(`electro_ergaenzen;w1;U1;b;A1;a;vertical-first`)
@ElectroKabel(`electro_ergaenzen;w2;A1;b;R1;a;horizontal-first`)
@ElectroOn(`xmin=-7;xmax=7;ymin=-5;ymax=5;width=850;id=electro_ergaenzen;snap=0.5;stub=0.35;components=[200];restrictions=[110;120;400];0;1;1`)

Ergänze genau einen Widerstand so, dass das Amperemeter \(20\,\mathrm{mA}\) anzeigt.

@ElectroErgaenzungsquiz(`electro_ergaenzen;condition=ammeter-current;component=A1;target=20 mA;tolerance=0.1 mA;required=[resistor:1];preserve=1;changed=1`)
```

### Ausprobieren

@Koordinatensystem(`xmin=-7;xmax=7;ymin=-5;ymax=5;width=850;id=electro_completion_live;snap=0.5;stub=0.35;0;1;1`)
@ElectroBatterie(`electro_completion_live;U1;-5;0;90;U_1;6 V;;1`)
@ElectroAmperemeter(`electro_completion_live;A1;0;3;0;A_1;;1;1`)
@ElectroWiderstand(`electro_completion_live;R1;5;0;90;R_1;100 Ohm;;1`)
@ElectroKabel(`electro_completion_live;w1;U1;b;A1;a;vertical-first`)
@ElectroKabel(`electro_completion_live;w2;A1;b;R1;a;horizontal-first`)
@ElectroOn(`xmin=-7;xmax=7;ymin=-5;ymax=5;width=850;id=electro_completion_live;snap=0.5;stub=0.35;components=[200];restrictions=[110;120;400];0;1;1`)

Ergänze genau einen Widerstand so, dass das Amperemeter \(20\,\mathrm{mA}\) anzeigt.

@ElectroErgaenzungsquiz(`electro_completion_live;condition=ammeter-current;component=A1;target=20 mA;tolerance=0.1 mA;required=[resistor:1];preserve=1;changed=1`)

Der Aufgabentext muss unmittelbar vor dem Quizmakro stehen, damit LiaScript ihn
dem generischen Quiz zuordnet. `@ElectroCompletionQuiz` ist der gleichwertige
englische Alias. Programmatisch liefert
`window.__electro.checkCompletion("<Spec>")` das strukturierte Ergebnis mit
Fehlercode, Rückmeldung und gegebenenfalls Ist- und Sollwert.

## Symbolbibliothek

          --{{0}}--

Die Palette bildet alle Symbole aus der Vorlage vektorbasiert ab:

| Gruppe | Symbole |
|---|---|
| Quellen und passive Bauteile | Batterie, Spannungsquelle, Widerstand, regelbarer Widerstand, Kondensator, Spule, Spule mit Eisenkern |
| Schalter | Schalter, Umschalter |
| Halbleiter | Diode, Photodiode, LED, Transistor |
| Messen und Verbraucher | Voltmeter, Amperemeter, Lampe, Motor |
| Bezug und Übertragung | Erde, Antenne, Transformator |

Zweipoler besitzen zwei Anschlüsse. Der Umschalter und der Transistor besitzen
drei, der Transformator vier, Erde und Antenne jeweils einen Anschluss. Die
Anschlusspositionen werden aus Symbolzentrum und Rotation berechnet und nicht
redundant im Kabel gespeichert.

## Import und Export

          --{{0}}--

**Export** im Fuß der Objektliste öffnet einen dreistufigen Dialog nach dem
Vorbild des DGS. Im ersten Schritt werden die im später importierten Editor
erlaubten Bauteiltypen gruppiert als Symbolschaltflächen angezeigt. Ein grünes
Häkchen kennzeichnet erlaubte, ein rotes Kreuz mit gedimmtem Symbol gesperrte
Typen. Darunter stehen die Restriktions-Checkboxen. Im zweiten Schritt kann
optional eine Ergänzungsaufgabe mit Bedingung, Zielmessgerät, Sollwert,
Toleranz und exakten Pflichtbauteilen aktiviert werden. `Weiter` erzeugt im
dritten Schritt den schreibgeschützten LiaScript-Makroblock; `Zurück` navigiert
jeweils einen Schritt zurück. Der Block kann kopiert oder als `.lia.md`
heruntergeladen werden.

Beim Öffnen übernimmt der erste Schritt das Profil des aktuellen Editors. Die
Auswahl konfiguriert nur den importierten Export und verändert weder die
Palette noch vorhandene Bauteile des gerade geöffneten Editors. Der Makroblock
enthält das Koordinatensystem, für jedes Bauteil ein eigenes typisiertes Makro,
alle Kabel und danach `@ElectroOn` mit `components=[...]` sowie – sofern
gesetzt – `restrictions=[...]`. Bei aktivierter Aufgabe folgen ein automatisch
formulierter, lokalisierter Aufgabentext und `@ElectroErgaenzungsquiz`; die
Board-ID wird gemeinsam mit allen anderen Makros neu geschrieben. Eine neu
erzeugte Board-ID verhindert
Kollisionen, wenn mehrere exportierte Schaltungen in denselben Kurs eingefügt
werden.

Der Makroblock ist das öffentliche Austauschformat. Zum Import wird er nach den
drei Template-Imports direkt in eine LiaScript-Datei eingefügt; ein bearbeitbares
JSON-Eingabefeld gehört nicht mehr zur Oberfläche. Vor dem Aufbau des Editors
werden Symboltypen, IDs, endliche Koordinaten, Rotationen, Fixierungen,
einzeilige Namen und Werte mit maximal 120 Zeichen sowie sämtliche
Anschlussreferenzen gemeinsam geprüft. Bei einem Fehler wird kein
unvollständiger Schaltplan übernommen.

Programmatisch liefert `window.__electro.exportMacros("board-id")` denselben
Makroblock. `window.__electro.downloadMacros("board-id")` startet den
`.lia.md`-Download und liefert den Dateinamen oder `null`.

JSON bleibt ausschließlich eine technische, versionierte Browser-API für Tests
und weiterführende Integrationen. Dafür stehen
`window.__electro.exportJSON("board-id")`,
`window.__electro.downloadJSON("board-id")` und
`window.__electro.importJSON("board-id", jsonText)` bereit. Der JSON-Import wird
vollständig validiert, bevor er den aktuellen Stand ersetzt. Der
Schaltungsstand bleibt bei einem LiaScript-Rebootstrap mit derselben Board-ID im
Browserfenster erhalten; die Undo/Redo-Historie startet für jede neue
Board-Instanz neu.

## Umfang der Gleichstromanalyse

          --{{0}}--

Die Berechnung ist absichtlich auf lineare, stationäre Gleichstromnetze
beschränkt. Lampe, Motor, Diode, LED, Kondensator, Spule, Transistor,
Transformator, Schalter und Umschalter werden noch nicht durch erfundene
Ersatzmodelle angenähert; befindet sich eines dieser Bauteile im gespeisten
Netz, nennt das Panel es ausdrücklich als nicht unterstützt. Wechselstrom,
Einschaltvorgänge, Halbleiterkennlinien und veränderbare Schalterzustände sind
spätere Ausbaustufen.

Kabel verbinden Bauteilanschlüsse automatisch über orthogonale H/V- oder
V/H-Routen. Freie Kabelknicke, explizite Kabelknoten und automatische
Hindernisumfahrung sind ebenfalls noch nicht enthalten. Einzelne Kabelströme
werden an Verzweigungen nicht ausgewiesen, weil sie in einem idealen Knoten ohne
zusätzliche Zweiginformation nicht eindeutig sind.

Das Bundle stellt `window.__bootstrapElectro` bereit und erkennt relevante
Board-Ersetzungen zusätzlich im DOM-Lifecycle. Für `lia-coordinate` wäre
langfristig ein direkter Aufruf dieses Hooks oder eine allgemeine
Erweiterungsregistrierung mit Board-Lifecycle, Koordinatenumrechnung und
Werkzeug-Arbitration sinnvoll. Bis dahin bleibt Electro als separates Bundle
bewusst von privaten DGS-Interna entkoppelt.

## Entwicklung

          --{{0}}--

``` text
README.md                 Template, Dokumentation und Live-Demo
assets/logo.svg           Vektorbasiertes Template-Logo
src/index.ts              Bootstrap und öffentliche Browser-API
src/global.d.ts           Typen für lia-coordinate- und Electro-Globals
src/electro/              Modell, Symbole, Routing, UI und Renderer
src/electro/physics.ts    Lineare DC-Netzliste, Knotenanalyse und Diagnosen
src/electro/labels.ts     Sichere Normaltext-/TeX-Aufbereitung für JSXGraph
src/electro/theme.ts      Light-/Dark-Farbrollen und Kontrastableitung
tests/                    Tests für Katalog, Routing, TeX, Physik, UI und JSON
dist/index.js             gebautes, mitzucommitendes Browser-Bundle
```

``` bash
npm install
npm test
npm run check
npm run build
```

Die Tests verwenden Nodes native TypeScript-Ausführung und benötigen daher
Node.js `^22.18.0` oder `>=24.0.0`.

`node_modules/`, `.parcel-cache/` und eventuell von Entwicklungswerkzeugen
erzeugte Sourcemaps werden ignoriert; der Release-Build erzeugt keine Sourcemap.
Das erzeugte `dist/index.js` gehört – wie bei anderen MINT-the-GAP-Templates –
ausdrücklich ins Repository, weil LiaScript es direkt daraus lädt.
