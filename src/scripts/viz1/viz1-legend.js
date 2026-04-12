/**
 * Légende de la visualisation 1.
 *
 * TODO :
 * - adapter cette légende au design final de la visualisation 1
 */

import { GENDER_COLORS, MEDAL_COLORS } from '../config.js';
import { createDomNode, resolveNode } from '../helper.js';

/**
 * Rend une légende simple de debug.
 * @param {{ container: string|HTMLElement }} payload
 */
export function renderViz1Legend({ container }) {
  const host = resolveNode(container);

  const title = createDomNode('h3', '', 'Légende de base');
  const list = createDomNode('div', 'legend-list');

  for (const [label, color] of Object.entries(MEDAL_COLORS)) {
    list.append(createLegendRow(`${label} (médaille)`, color));
  }

  for (const [label, color] of Object.entries(GENDER_COLORS)) {
    list.append(createLegendRow(`${label} (genre)`, color));
  }

  host.append(title, list);
}

/**
 * Crée une ligne de légende.
 * @param {string} label
 * @param {string} color
 * @returns {HTMLElement}
 */
function createLegendRow(label, color) {
  const row = createDomNode('div', 'legend-row');
  const swatch = createDomNode('span', 'legend-swatch');
  const text = createDomNode('span', '', label);

  swatch.style.backgroundColor = color;
  row.append(swatch, text);

  return row;
}
