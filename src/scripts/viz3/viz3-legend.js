/**
 * Légende de la visualisation 3.
 *
 * TODO :
 * - adapter cette légende à la future visualisation finale
 */

import { CONTINENT_COLORS } from '../config.js';
import { createDomNode, resolveNode } from '../helper.js';

/**
 * Rend une légende simple par continent.
 * @param {{ container: string|HTMLElement }} payload
 */
export function renderViz3Legend({ container }) {
  const host = resolveNode(container);
  const title = createDomNode('h3', '', 'Légende continents');
  const list = createDomNode('div', 'legend-list');

  for (const [label, color] of Object.entries(CONTINENT_COLORS)) {
    const row = createDomNode('div', 'legend-row');
    const swatch = createDomNode('span', 'legend-swatch');
    const text = createDomNode('span', '', label);

    swatch.style.backgroundColor = color;
    row.append(swatch, text);
    list.append(row);
  }

  host.append(title, list);
}
