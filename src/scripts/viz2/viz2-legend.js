/**
 * Légende de la visualisation 2.
 *
 * TODO :
 * - ajuster la structure de la légende selon la visualisation finale
 */

import { MEDAL_COLORS } from '../config.js';
import { createDomNode, resolveNode } from '../helper.js';

/**
 * Rend la légende de base.
 * @param {{ container: string|HTMLElement }} payload
 */
export function renderViz2Legend({ container }) {
  const host = resolveNode(container);
  const title = createDomNode('h3', '', 'Légende de base');
  const list = createDomNode('div', 'legend-list');

  for (const [label, color] of Object.entries(MEDAL_COLORS)) {
    const row = createDomNode('div', 'legend-row');
    const swatch = createDomNode('span', 'legend-swatch');
    const text = createDomNode('span', '', label);

    swatch.style.backgroundColor = color;
    row.append(swatch, text);
    list.append(row);
  }

  host.append(title, list);
}
