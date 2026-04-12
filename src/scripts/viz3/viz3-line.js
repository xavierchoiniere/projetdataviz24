/**
 * Sous-composant line de la visualisation 3.
 *
 * TODO :
 * - implémenter la vraie courbe / aire / série temporelle D3
 * - brancher les interactions globales
 */

import { createViz3Tooltip } from './viz3-tooltip.js';
import {
  clearNode,
  createDomNode,
  formatDecimal,
  formatInteger,
  renderDefinitionList,
  renderSimpleTable
} from '../helper.js';

/**
 * Rend le placeholder de la partie line de la viz 3.
 * @param {{ containerSelector?: string|HTMLElement, data?: Array<Record<string, unknown>> }} payload
 */
export function renderViz3Line({ containerSelector = '#viz3-line-root', data = [] } = {}) {
  const container = clearNode(containerSelector);
  const wrapper = createDomNode('div', 'placeholder-card');

  const title = createDomNode('h3', '', 'Gabarit Viz 3A — Résumé par édition');
  const note = createDomNode(
    'p',
    'todo-note',
    'TODO : remplacer cette vue debug par une vraie série temporelle D3.'
  );

  wrapper.append(title, note);

  const latestRow = data.length > 0 ? data[data.length - 1] : null;

  renderDefinitionList(wrapper, [
    { label: 'Points line', value: formatInteger(data.length) },
    { label: 'Dernière édition visible', value: latestRow ? String(latestRow.year) : 'n.d.' },
    {
      label: 'Moyenne méd./pays (dernière édition)',
      value: latestRow ? formatDecimal(latestRow.average_medals_per_country, 2) : 'n.d.'
    }
  ]);

  if (data.length > 0) {
    renderSimpleTable(wrapper, [
      { key: 'year', label: 'Année' },
      { key: 'total_countries', label: 'Pays', format: (value) => formatInteger(Number(value)) },
      { key: 'total_athletes', label: 'Athlètes', format: (value) => formatInteger(Number(value)) },
      { key: 'total_medals', label: 'Médailles', format: (value) => formatInteger(Number(value)) }
    ], data.slice(-10));
  }

  createViz3Tooltip(container);
  container.append(wrapper);
}
