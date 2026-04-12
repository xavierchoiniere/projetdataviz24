/**
 * Prétraitement spécifique à la visualisation 2.
 *
 * Hypothèse de travail :
 * - la visualisation 2 explore l'âge des médaillés
 *
 * TODO :
 * - ajuster l'agrégation finale selon le design retenu
 * - ajouter d'éventuels filtres métier supplémentaires (discipline, médaille, genre, etc.)
 */

import { exportRowsToCsv, matchSharedFilters, sortByMany, safeTrim } from '../helper.js';

/**
 * Prépare les données de la visualisation 2.
 * @param {Array<Record<string, unknown>>} medals
 * @param {{ year?: string|number, saison?: string, continent?: string }} filters
 * @returns {Array<Record<string, unknown>>}
 */
export function prepareViz2Data(medals, filters = {}) {
  const rowsWithAge = medals
    .filter((row) => row.birth_year != null)
    .filter((row) => matchSharedFilters(row, filters))
    .map((row) => ({
      year: row.year,
      game_slug: row.game_slug,
      saison: row.saison,
      continent: row.continent,
      country_code: row.country_code,
      country: row.country,
      discipline: row.discipline,
      event: row.event,
      event_gender: row.event_gender,
      medal_type: row.medal_type,
      birth_year: row.birth_year,
      age: Number(row.year) - Number(row.birth_year)
    }))
    .filter((row) => Number.isFinite(row.age));

  return sortByMany(rowsWithAge, [
    (row) => Number(row.year),
    (row) => safeTrim(row.country_code),
    (row) => safeTrim(row.discipline),
    (row) => Number(row.age)
  ]);
}

/**
 * Exporte les données préparées de la visualisation 2 en CSV.
 * @param {Array<Record<string, unknown>>} viz2Data
 * @param {string} [filename]
 */
export function exportViz2Csv(viz2Data, filename = 'viz2-output.csv') {
  exportRowsToCsv(viz2Data, filename);
}
