/**
 * Point d'entrée de la visualisation 1.
 *
 * Le rendu actuel est volontairement simple :
 * - résumé métrique
 * - mini tableau de debug
 * - légende
 *
 * TODO :
 * - remplacer ce placeholder par la vraie visualisation D3
 * - brancher le tooltip sur les marks réels
 */

import { renderViz1Legend } from './viz1-legend.js';
import { createViz1Tooltip } from './viz1-tooltip.js';
import {
  clearNode,
  createDomNode,
  formatInteger,
  renderDefinitionList,
  renderSimpleTable
} from '../helper.js';

/**
 * Rend le gabarit de la visualisation 1.
 * @param {{ containerSelector?: string|HTMLElement, data?: Array<Record<string, unknown>> }} payload
 */
export function renderViz1({ containerSelector = '#viz1-root', data = [] } = {}) {
  const container = clearNode(containerSelector);
  const wrapper = createDomNode('div', 'placeholder-card');

  const title = createDomNode('h3', '', 'Gabarit Viz 1 — Médailles par pays / genre / type');
  const note = createDomNode(
    'p',
    'todo-note',
    'TODO : brancher ici la visualisation D3 finale. Le pipeline de données et l’export CSV sont déjà opérationnels.'
  );

  const totalMedals = data.reduce((sum, row) => sum + Number(row.nb_medals ?? 0), 0);
  const uniqueCountries = new Set(data.map((row) => row.country_code)).size;
  const distinctEditions = new Set(data.map((row) => row.game_slug)).size;

  wrapper.append(title, note);

  renderDefinitionList(wrapper, [
    { label: 'Lignes Viz 1', value: formatInteger(data.length) },
    { label: 'Médailles agrégées', value: formatInteger(totalMedals) },
    { label: 'Pays distincts', value: formatInteger(uniqueCountries) },
    { label: 'Éditions distinctes', value: formatInteger(distinctEditions) }
  ]);

  const topRows = [...data]
    .sort((left, right) => Number(right.nb_medals) - Number(left.nb_medals))
    .slice(0, 10);

  if (topRows.length > 0) {
    const tableTitle = createDomNode('h3', '', 'Top 10 lignes de debug');
    wrapper.append(tableTitle);

    renderSimpleTable(wrapper, [
      { key: 'year', label: 'Année' },
      { key: 'country_code', label: 'Code IOC' },
      { key: 'country', label: 'Pays' },
      { key: 'medal_type', label: 'Médaille' },
      { key: 'event_gender', label: 'Genre' },
      { key: 'nb_medals', label: 'Nb', format: (value) => formatInteger(Number(value)) }
    ], topRows);
  }

  renderViz1Legend({ container: wrapper });
  createViz1Tooltip(container);

  container.append(wrapper);
}
