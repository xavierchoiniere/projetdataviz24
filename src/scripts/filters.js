/**
 * Module des filtres globaux.
 *
 * Rôle actuel :
 * - exposer une interface simple de filtres partagés
 * - déclencher un rerender de toutes les visualisations quand l'état change
 *
 * TODO :
 * - enrichir les filtres selon les besoins de l'équipe (genre, discipline, médaille, pays, etc.)
 * - brancher éventuellement des composants D3 dédiés plutôt que des <select> natifs
 */

import { DEFAULT_FILTERS } from './config.js';
import {
  clearNode,
  createDomNode,
  uniqueSortedValues
} from './helper.js';

/**
 * Crée l'interface de filtres globaux.
 * @param {string|HTMLElement} containerSelector
 * @param {{ medals: Array<Record<string, unknown>>, athletesCount: Array<Record<string, unknown>>, hosts: Array<Record<string, unknown>> }} rawData
 * @param {(filters: { year: string|number, saison: string, continent: string }) => void} onChange
 * @returns {{ getState: () => { year: string|number, saison: string, continent: string }, setState: (partialState: Partial<{ year: string|number, saison: string, continent: string }>) => void, reset: () => void }}
 */
export function createFilters(containerSelector, rawData, onChange = () => {}) {
  const container = clearNode(containerSelector);

  const state = {
    ...DEFAULT_FILTERS
  };

  const years = [...new Set(rawData.hosts.map((row) => Number(row.year)).filter(Number.isFinite))].sort(
    (left, right) => left - right
  );
  const continents = uniqueSortedValues(
    [...rawData.medals, ...rawData.athletesCount],
    (row) => row.continent
  );

  const controls = createDomNode('div', 'filters-grid');

  const yearSelect = buildSelect({
    label: 'Édition',
    options: [{ label: 'Toutes', value: 'all' }, ...years.map((year) => ({ label: String(year), value: String(year) }))],
    value: String(state.year)
  });

  const seasonSelect = buildSelect({
    label: 'Saison',
    options: [
      { label: 'Toutes', value: 'all' },
      { label: 'Summer', value: 'summer' },
      { label: 'Winter', value: 'winter' }
    ],
    value: state.saison
  });

  const continentSelect = buildSelect({
    label: 'Continent',
    options: [
      { label: 'Tous', value: 'all' },
      ...continents.map((continent) => ({ label: continent, value: continent }))
    ],
    value: state.continent
  });

  const resetCard = createDomNode('div', 'filter-card');
  const resetLabel = createDomNode('label', '', 'Réinitialisation');
  const resetButton = createDomNode('button', 'button', 'Réinitialiser les filtres');
  resetButton.type = 'button';

  resetButton.addEventListener('click', () => {
    controller.reset();
  });

  resetCard.append(resetLabel, resetButton);
  controls.append(yearSelect.wrapper, seasonSelect.wrapper, continentSelect.wrapper, resetCard);
  container.append(controls);

  yearSelect.select.addEventListener('change', (event) => {
    state.year = event.target.value;
    notify();
  });

  seasonSelect.select.addEventListener('change', (event) => {
    state.saison = event.target.value;
    notify();
  });

  continentSelect.select.addEventListener('change', (event) => {
    state.continent = event.target.value;
    notify();
  });

  const controller = {
    getState() {
      return { ...state };
    },

    setState(partialState = {}) {
      Object.assign(state, partialState);

      yearSelect.select.value = String(state.year);
      seasonSelect.select.value = state.saison;
      continentSelect.select.value = state.continent;

      notify();
    },

    reset() {
      this.setState({ ...DEFAULT_FILTERS });
    }
  };

  // On pousse immédiatement l'état initial pour un premier rendu cohérent.
  notify();

  return controller;

  function notify() {
    onChange(controller.getState());
  }
}

/**
 * Fabrique un bloc label + select.
 * @param {{ label: string, options: Array<{ label: string, value: string }>, value: string }} payload
 * @returns {{ wrapper: HTMLElement, select: HTMLSelectElement }}
 */
function buildSelect({ label, options, value }) {
  const wrapper = createDomNode('div', 'filter-card');
  const labelNode = createDomNode('label', '', label);
  const select = document.createElement('select');

  for (const option of options) {
    const optionNode = document.createElement('option');
    optionNode.value = option.value;
    optionNode.textContent = option.label;
    select.append(optionNode);
  }

  select.value = value;
  wrapper.append(labelNode, select);

  return { wrapper, select };
}
