const ESCAPED_DOLLAR = '\uE000';

export function renderComponentLabel(value: unknown): string {
  let text = escapeLabelHtml(String(value ?? '').trim());
  if (!text) return '';
  if (/^\\\([\s\S]*\\\)$/.test(text) || /^\\\[[\s\S]*\\\]$/.test(text)) return text;

  const hasExplicitDelimiters = /\$\$[\s\S]+?\$\$|\$[^$\r\n]+?\$/.test(text);
  text = text.replace(/\\\$/g, ESCAPED_DOLLAR);
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, tex: string) => `\\[${tex}\\]`);
  text = text.replace(/\$([^$\r\n]+?)\$/g, (_match, tex: string) => `\\(${tex}\\)`);
  text = text.split(ESCAPED_DOLLAR).join('$');
  if (!hasExplicitDelimiters) {
    const physical = renderPhysicalQuantity(text);
    if (physical) return physical;
  }
  if (!hasExplicitDelimiters && /(?:\\[A-Za-z]+|\\[,;:! ]|[_^])/.test(text)) {
    return `\\(${text}\\)`;
  }
  return text;
}

function renderPhysicalQuantity(value: string): string | null {
  const match = value.match(/^([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+))\s*([pnumµukKMG]?)\s*(V|A|W|Ω|Ohm)$/u);
  if (!match) return null;
  const number = match[1].replace(',', '{,}');
  const prefix = match[2];
  const unit = match[3];
  if (unit === 'Ω' || unit === 'Ohm') {
    const renderedUnit = prefix ? `\\mathrm{${prefix}}\\Omega` : '\\Omega';
    return `\\(${number}\\,${renderedUnit}\\)`;
  }
  return `\\(${number}\\,\\mathrm{${prefix}${unit}}\\)`;
}

function escapeLabelHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}
