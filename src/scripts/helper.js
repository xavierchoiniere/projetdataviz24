/**
 * Fonctions utilitaires partagées par les modules de prétraitement et de rendu.
 * Le but est d'éviter la duplication de logique dans chaque visualisation.
 */

import * as d3 from 'd3';

const WARNED_MESSAGES = new Set();

/**
 * Retourne une chaîne propre ; valeur vide si `null` / `undefined`.
 * @param {unknown} value
 * @returns {string}
 */
export function safeTrim(value) {
  return value == null ? '' : String(value).trim();
}

/**
 * Retourne le premier texte non vide d'une liste de valeurs.
 * @param {...unknown} values
 * @returns {string}
 */
export function firstFilled(...values) {
  for (const value of values) {
    const trimmed = safeTrim(value);
    if (trimmed !== '') {
      return trimmed;
    }
  }

  return '';
}

/**
 * Convertit une valeur vers un nombre ou `null`.
 * @param {unknown} value
 * @returns {number|null}
 */
export function coerceNumber(value) {
  const trimmed = safeTrim(value);

  if (trimmed === '') {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Normalise un code pays / IOC.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeCountryCode(value) {
  return safeTrim(value).toUpperCase();
}

/**
 * Extrait l'année d'une date ISO `YYYY-MM-DD`.
 * @param {unknown} value
 * @returns {number|null}
 */
export function getBirthYearFromDate(value) {
  const trimmed = safeTrim(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const year = Number(trimmed.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

/**
 * Déduplique un tableau à partir d'une clé calculée.
 * @template T
 * @param {T[]} rows
 * @param {(row: T) => string} keyAccessor
 * @returns {T[]}
 */
export function dedupeBy(rows, keyAccessor) {
  const lookup = new Map();

  for (const row of rows) {
    const key = keyAccessor(row);
    if (!lookup.has(key)) {
      lookup.set(key, row);
    }
  }

  return [...lookup.values()];
}

/**
 * Trie des lignes selon plusieurs niveaux de tri.
 * @template T
 * @param {T[]} rows
 * @param {Array<(row: T) => string | number | null | undefined>} accessors
 * @returns {T[]}
 */
export function sortByMany(rows, accessors) {
  return [...rows].sort((left, right) => {
    for (const accessor of accessors) {
      const leftValue = accessor(left) ?? '';
      const rightValue = accessor(right) ?? '';

      if (leftValue < rightValue) {
        return -1;
      }

      if (leftValue > rightValue) {
        return 1;
      }
    }

    return 0;
  });
}

/**
 * Vérifie si une ligne passe les filtres globaux partagés.
 * @param {Record<string, unknown>} row
 * @param {{ year?: string|number, saison?: string, continent?: string }} filters
 * @returns {boolean}
 */
export function matchSharedFilters(row, filters = {}) {
  const yearFilter = filters.year ?? 'all';
  const saisonFilter = filters.saison ?? 'all';
  const continentFilter = filters.continent ?? 'all';

  const rowYear = row.year ?? null;
  const rowSaison = safeTrim(row.saison).toLowerCase();
  const rowContinent = safeTrim(row.continent);

  const matchesYear = yearFilter === 'all' || Number(yearFilter) === Number(rowYear);
  const matchesSaison = saisonFilter === 'all' || saisonFilter === rowSaison;
  const matchesContinent = continentFilter === 'all' || continentFilter === rowContinent;

  return matchesYear && matchesSaison && matchesContinent;
}

/**
 * Extrait les valeurs distinctes, triées, d'un tableau.
 * @template T
 * @param {T[]} rows
 * @param {(row: T) => unknown} accessor
 * @returns {string[]}
 */
export function uniqueSortedValues(rows, accessor) {
  return [...new Set(rows.map(accessor).map((value) => safeTrim(value)).filter(Boolean))].sort(
    d3.ascending
  );
}

/**
 * Affiche un warning une seule fois pour éviter de polluer la console.
 * @param {string} message
 * @param {unknown} [payload]
 */
export function warnOnce(message, payload) {
  if (WARNED_MESSAGES.has(message)) {
    return;
  }

  WARNED_MESSAGES.add(message);
  console.warn(message, payload);
}

/**
 * Retourne un noeud DOM à partir d'un sélecteur ou d'une référence.
 * @param {string|HTMLElement} selectorOrNode
 * @returns {HTMLElement}
 */
export function resolveNode(selectorOrNode) {
  if (selectorOrNode instanceof HTMLElement) {
    return selectorOrNode;
  }

  const node = document.querySelector(selectorOrNode);

  if (!node) {
    throw new Error(`Impossible de trouver le noeud demandé : ${selectorOrNode}`);
  }

  return node;
}

/**
 * Vide un conteneur et retourne sa référence.
 * @param {string|HTMLElement} selectorOrNode
 * @returns {HTMLElement}
 */
export function clearNode(selectorOrNode) {
  const node = resolveNode(selectorOrNode);
  node.innerHTML = '';
  return node;
}

/**
 * Crée un noeud DOM simple.
 * @param {string} tagName
 * @param {string} [className]
 * @param {string} [textContent]
 * @returns {HTMLElement}
 */
export function createDomNode(tagName, className = '', textContent = '') {
  const node = document.createElement(tagName);

  if (className) {
    node.className = className;
  }

  if (textContent) {
    node.textContent = textContent;
  }

  return node;
}

/**
 * Affiche un élément.
 * @param {string|HTMLElement} selectorOrNode
 */
export function showElement(selectorOrNode) {
  resolveNode(selectorOrNode).classList.remove('hidden');
}

/**
 * Masque un élément.
 * @param {string|HTMLElement} selectorOrNode
 */
export function hideElement(selectorOrNode) {
  resolveNode(selectorOrNode).classList.add('hidden');
}

/**
 * Met à jour le contenu HTML d'un noeud.
 * @param {string|HTMLElement} selectorOrNode
 * @param {string} html
 */
export function setHtml(selectorOrNode, html) {
  resolveNode(selectorOrNode).innerHTML = html;
}

/**
 * Formate un entier pour l'interface.
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatInteger(value) {
  const normalized = Number(value ?? 0);
  return new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 0 }).format(normalized);
}

/**
 * Formate un nombre décimal.
 * @param {number|null|undefined} value
 * @param {number} [maximumFractionDigits]
 * @returns {string}
 */
export function formatDecimal(value, maximumFractionDigits = 2) {
  const normalized = Number(value ?? 0);

  return new Intl.NumberFormat('fr-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(normalized);
}

/**
 * Rend une petite grille définition / valeur.
 * @param {string|HTMLElement} selectorOrNode
 * @param {Array<{ label: string, value: string }>} items
 */
export function renderDefinitionList(selectorOrNode, items) {
  const container = resolveNode(selectorOrNode);
  const list = createDomNode('dl', 'definition-list');

  for (const item of items) {
    const wrapper = createDomNode('div', 'definition-item');
    const term = createDomNode('dt', '', item.label);
    const description = createDomNode('dd', '', item.value);

    wrapper.append(term, description);
    list.append(wrapper);
  }

  container.append(list);
}

/**
 * Rend un tableau HTML simple, utile pour les gabarits de debug.
 * @param {string|HTMLElement} selectorOrNode
 * @param {Array<{ key: string, label: string, format?: (value: unknown, row: Record<string, unknown>) => string }>} columns
 * @param {Array<Record<string, unknown>>} rows
 */
export function renderSimpleTable(selectorOrNode, columns, rows) {
  const container = resolveNode(selectorOrNode);
  const wrapper = createDomNode('div', 'table-wrapper');
  const table = createDomNode('table', 'debug-table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const headerRow = document.createElement('tr');
  for (const column of columns) {
    const cell = createDomNode('th', '', column.label);
    headerRow.append(cell);
  }
  thead.append(headerRow);

  for (const row of rows) {
    const bodyRow = document.createElement('tr');

    for (const column of columns) {
      const value = row[column.key];
      const formatted = column.format ? column.format(value, row) : safeTrim(value);
      const cell = createDomNode('td', '', formatted);
      bodyRow.append(cell);
    }

    tbody.append(bodyRow);
  }

  table.append(thead, tbody);
  wrapper.append(table);
  container.append(wrapper);
}

/**
 * Exporte des lignes JSON en CSV et déclenche le téléchargement côté navigateur.
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} filename
 */
export function exportRowsToCsv(rows, filename = 'output.csv') {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  const csvContent = normalizedRows.length > 0 ? d3.csvFormat(normalizedRows) : '';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(blobUrl);
}
