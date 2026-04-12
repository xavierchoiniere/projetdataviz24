/**
 * Point d'entrée de la visualisation 2.
 *
 * Rendu placeholder :
 * - métriques sur l'âge
 * - tableau de debug
 *
 * TODO :
 * - implémenter la visualisation finale (histogramme, boxplot, beeswarm, etc.)
 * - brancher la légende et le tooltip aux marks D3 réels
 */

import * as d3 from 'd3';
import { renderViz2Legend } from './viz2-legend.js';
import { createViz2Tooltip } from './viz2-tooltip.js';
import {
  clearNode,
  createDomNode,
  formatDecimal,
  formatInteger,
  renderDefinitionList,
  renderSimpleTable
} from '../helper.js';

/**
 * Rend le gabarit de la visualisation 2.
 * @param {{ containerSelector?: string|HTMLElement, data?: Array<Record<string, unknown>> }} payload
 */
export function renderViz2({ containerSelector = '#viz2-root', data = [] } = {}) {
  const container = clearNode(containerSelector);
  const wrapper = createDomNode('div', 'placeholder-card');

  const title = createDomNode('h3', '', 'Gabarit Viz 2 — Âge des médaillés');
  const note = createDomNode(
    'p',
    'todo-note',
    'TODO : remplacer le tableau de debug par la visualisation finale une fois le design validé.'
  );

  const ages = data.map((row) => Number(row.age)).filter(Number.isFinite);
  const averageAge = ages.length > 0 ? d3.mean(ages) : null;
  const medianAge = ages.length > 0 ? d3.median(ages) : null;

  wrapper.append(title, note);

  renderDefinitionList(wrapper, [
    { label: 'Lignes Viz 2', value: formatInteger(data.length) },
    { label: 'Âge moyen', value: averageAge == null ? 'n.d.' : formatDecimal(averageAge, 1) },
    { label: 'Âge médian', value: medianAge == null ? 'n.d.' : formatDecimal(medianAge, 1) },
    { label: 'Âge minimum', value: ages.length > 0 ? formatInteger(d3.min(ages)) : 'n.d.' }
  ]);

  const sampleRows = [...data].slice(0, 12);

  if (sampleRows.length > 0) {
    const tableTitle = createDomNode('h3', '', 'Échantillon de debug');
    wrapper.append(tableTitle);

    renderSimpleTable(wrapper, [
      { key: 'year', label: 'Année' },
      { key: 'country_code', label: 'Code IOC' },
      { key: 'discipline', label: 'Discipline' },
      { key: 'medal_type', label: 'Médaille' },
      { key: 'age', label: 'Âge', format: (value) => formatInteger(Number(value)) }
    ], sampleRows);
  }

  renderViz2Legend({ container: wrapper });
  createViz2Tooltip(container);

  container.append(wrapper);
}
