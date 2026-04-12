/**
 * Prétraitement spécifique à la visualisation 1.
 *
 * Hypothèse de travail :
 * - cette visualisation consomme un agrégat de médailles par pays / édition / type / genre
 *
 * TODO :
 * - ajuster la granularité exacte une fois le design final validé
 * - enrichir les dimensions si l'équipe ajoute d'autres filtres
 */

import { exportRowsToCsv, matchSharedFilters, sortByMany, safeTrim } from '../helper.js';

/**
 * Prépare les données de la visualisation 1.
 * @param {Array<Record<string, unknown>>} medals
 * @param {{ year?: string|number, saison?: string, continent?: string }} filters
 * @returns {Array<Record<string, unknown>>}
 */
export function prepareViz1Data(medals, filters = {}) {
  const filteredRows = medals.filter((row) => matchSharedFilters(row, filters));
  const aggregation = new Map();

  for (const row of filteredRows) {
    const key = [
      row.year,
      row.game_slug,
      row.saison,
      row.continent,
      row.country_code,
      row.country,
      row.event_gender,
      row.medal_type,
      row.is_host
    ].join('|');

    if (!aggregation.has(key)) {
      aggregation.set(key, {
        year: row.year,
        game_slug: row.game_slug,
        saison: row.saison,
        continent: row.continent,
        country_code: row.country_code,
        country: row.country,
        event_gender: row.event_gender,
        medal_type: row.medal_type,
        is_host: row.is_host,
        nb_medals: 0
      });
    }

    aggregation.get(key).nb_medals += 1;
  }

  return sortByMany([...aggregation.values()], [
    (row) => Number(row.year),
    (row) => safeTrim(row.country_code),
    (row) => safeTrim(row.medal_type),
    (row) => safeTrim(row.event_gender)
  ]);
}

/**
 * Exporte les données préparées de la visualisation 1 en CSV.
 * @param {Array<Record<string, unknown>>} viz1Data
 * @param {string} [filename]
 */
export function exportViz1Csv(viz1Data, filename = 'viz1-output.csv') {
  exportRowsToCsv(viz1Data, filename);
}
