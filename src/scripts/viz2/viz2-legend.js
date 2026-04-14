/**
 * Légende de la visualisation 2.
 *
 * Affiche les couleurs correspondant aux catégories de genre :
 * - Masculine (bleu)
 * - Féminine (rose)
 * - Mixte (vert)
 */

import { GENDER_COLORS } from '../config.js';
import { createDomNode, resolveNode } from '../helper.js';

const GENDER_LABELS = {
  Men: 'Masculines',
  Women: 'Féminines',
  Mixed: 'Mixtes'
};

/**
 * Rend la légende des genres pour la visualisation 2.
 * @param {{ container: string|HTMLElement }} payload
 */
export function renderViz2Legend({ container }) {
  const host = resolveNode(container);

  const legendBox = createDomNode('div', 'viz2-legend-box');

  const title = createDomNode('h4', 'legend-title', 'Légende');
  legendBox.appendChild(title);

  const list = createDomNode('div', 'legend-list');

  for (const [key, color] of Object.entries(GENDER_COLORS)) {
    if (key === 'Open') continue;

    const row = createDomNode('div', 'legend-row');
    const swatch = createDomNode('span', 'legend-swatch');
    const text = createDomNode('span', 'legend-text', GENDER_LABELS[key] || key);

    swatch.style.backgroundColor = color;
    row.append(swatch, text);
    list.append(row);
  }

  legendBox.appendChild(list);
  host.appendChild(legendBox);
}
