/**
 * Sous-composant bubble de la visualisation 3.
 *
 * TODO :
 * - implémenter le nuage de bulles D3 final
 * - brancher la taille / couleur / position avec les vraies échelles
 */

import { renderViz3Legend } from './viz3-legend.js';
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
 * Rend le placeholder de la partie bubble de la viz 3.
 * @param {{ containerSelector?: string|HTMLElement, data?: Array<Record<string, unknown>> }} payload
 */
export function renderViz3Bubble({ containerSelector = '#viz3-bubble-root', data = [] } = {}) {
  const container = clearNode(containerSelector);
  const wrapper = createDomNode('div', 'placeholder-card');

  const title = createDomNode('h3', '', 'Gabarit Viz 3B — Pays / édition');
  const note = createDomNode(
    'p',
    'todo-note',
    'TODO : remplacer ce tableau de debug par le bubble chart final.'
  );

  wrapper.append(title, note);

  const maxAthletes = data.length > 0 ? Math.max(...data.map((row) => Number(row.nb_athletes))) : 0;

  renderDefinitionList(wrapper, [
    { label: 'Points bubble', value: formatInteger(data.length) },
    { label: 'Nb athlètes max', value: formatInteger(maxAthletes) },
    {
      label: 'Meilleure efficacité méd./athlète',
      value:
        data.length > 0
          ? formatDecimal(Math.max(...data.map((row) => Number(row.medals_per_athlete))), 3)
          : 'n.d.'
    }
  ]);

  const topRows = [...data]
    .sort((left, right) => Number(right.medals_total) - Number(left.medals_total))
    .slice(0, 12);

  if (topRows.length > 0) {
    renderSimpleTable(wrapper, [
      { key: 'year', label: 'Année' },
      { key: 'country_code', label: 'Code IOC' },
      { key: 'nb_athletes', label: 'Athlètes', format: (value) => formatInteger(Number(value)) },
      { key: 'medals_total', label: 'Médailles', format: (value) => formatInteger(Number(value)) },
      { key: 'medals_per_athlete', label: 'Méd./ath.', format: (value) => formatDecimal(Number(value), 3) }
    ], topRows);
  }

  renderViz3Legend({ container: wrapper });
  createViz3Tooltip(container);

  container.append(wrapper);
}
