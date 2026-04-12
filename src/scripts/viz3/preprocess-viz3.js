/**
 * Prétraitement spécifique à la visualisation 3.
 *
 * Hypothèse de travail :
 * - cette visualisation croise participation et médailles
 * - on prépare deux sorties :
 *   1. lineData  : résumé par édition
 *   2. bubbleData: détail par pays / édition
 *
 * TODO :
 * - ajuster les métriques finales selon la narration retenue
 */

import { exportRowsToCsv, matchSharedFilters, sortByMany, safeTrim } from '../helper.js';

/**
 * Prépare les sorties line + bubble de la visualisation 3.
 * @param {Array<Record<string, unknown>>} medals
 * @param {Array<Record<string, unknown>>} athletesCount
 * @param {{ year?: string|number, saison?: string, continent?: string }} filters
 * @returns {{ lineData: Array<Record<string, unknown>>, bubbleData: Array<Record<string, unknown>> }}
 */
export function prepareViz3Data(medals, athletesCount, filters = {}) {
  const filteredMedals = medals.filter((row) => matchSharedFilters(row, filters));
  const filteredAthletesCount = athletesCount.filter((row) => matchSharedFilters(row, filters));

  const medalsByCountryEdition = new Map();

  for (const row of filteredMedals) {
    const key = [row.year, row.game_slug, row.country_code].join('|');

    if (!medalsByCountryEdition.has(key)) {
      medalsByCountryEdition.set(key, {
        year: row.year,
        game_slug: row.game_slug,
        saison: row.saison,
        continent: row.continent,
        country_code: row.country_code,
        country: row.country,
        is_host: row.is_host,
        medals_total: 0,
        gold: 0,
        silver: 0,
        bronze: 0
      });
    }

    const target = medalsByCountryEdition.get(key);
    target.medals_total += 1;

    if (row.medal_type === 'GOLD') {
      target.gold += 1;
    } else if (row.medal_type === 'SILVER') {
      target.silver += 1;
    } else if (row.medal_type === 'BRONZE') {
      target.bronze += 1;
    }
  }

  const bubbleData = [];

  for (const row of filteredAthletesCount) {
    const key = [row.year, row.game_slug, row.country_code].join('|');
    const medalsSummary = medalsByCountryEdition.get(key);

    bubbleData.push({
      year: row.year,
      game_slug: row.game_slug,
      saison: row.saison,
      continent: row.continent,
      country_code: row.country_code,
      country: row.country,
      nb_athletes: row.nb_athletes,
      medals_total: medalsSummary?.medals_total ?? 0,
      gold: medalsSummary?.gold ?? 0,
      silver: medalsSummary?.silver ?? 0,
      bronze: medalsSummary?.bronze ?? 0,
      medals_per_athlete:
        Number(row.nb_athletes) > 0
          ? Number((Number(medalsSummary?.medals_total ?? 0) / Number(row.nb_athletes)).toFixed(4))
          : 0,
      is_host: medalsSummary?.is_host ?? false
    });
  }

  const lineAggregation = new Map();

  for (const row of bubbleData) {
    const key = [row.year, row.game_slug, row.saison].join('|');

    if (!lineAggregation.has(key)) {
      lineAggregation.set(key, {
        year: row.year,
        game_slug: row.game_slug,
        saison: row.saison,
        total_countries: 0,
        total_athletes: 0,
        total_medals: 0,
        host_countries_with_medals: 0,
        average_medals_per_country: 0
      });
    }

    const target = lineAggregation.get(key);
    target.total_countries += 1;
    target.total_athletes += Number(row.nb_athletes);
    target.total_medals += Number(row.medals_total);

    if (row.is_host && Number(row.medals_total) > 0) {
      target.host_countries_with_medals += 1;
    }
  }

  const lineData = [...lineAggregation.values()].map((row) => ({
    ...row,
    average_medals_per_country:
      row.total_countries > 0
        ? Number((row.total_medals / row.total_countries).toFixed(4))
        : 0
  }));

  return {
    lineData: sortByMany(lineData, [(row) => Number(row.year)]),
    bubbleData: sortByMany(bubbleData, [
      (row) => Number(row.year),
      (row) => safeTrim(row.country_code)
    ])
  };
}

/**
 * Exporte les deux sorties de la visualisation 3.
 * Un clic = deux fichiers, car la viz 3 alimente deux sous-composantes.
 * @param {{ lineData: Array<Record<string, unknown>>, bubbleData: Array<Record<string, unknown>> }} viz3Data
 * @param {{ lineFilename?: string, bubbleFilename?: string }} filenames
 */
export function exportViz3Csv(viz3Data, filenames = {}) {
  exportRowsToCsv(viz3Data.lineData ?? [], filenames.lineFilename ?? 'viz3-line-output.csv');
  exportRowsToCsv(viz3Data.bubbleData ?? [], filenames.bubbleFilename ?? 'viz3-bubble-output.csv');
}
