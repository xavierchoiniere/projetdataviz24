/**
 * Prétraitement spécifique à la visualisation 2.
 *
 * Cette visualisation montre l'évolution du nombre d'épreuves masculines,
 * féminines et mixtes aux Jeux Olympiques de 1896 à 2024 sous forme de
 * graphique à barres divergentes.
 */

import { exportRowsToCsv, matchSharedFilters, sortByMany, uniqueSortedValues } from '../helper.js';

/**
 * Prépare les données de la visualisation 2.
 * Agrège les événements par année et par genre (Men/Women/Mixed).
 *
 * @param {Array<Record<string, unknown>>} medals
 * @param {{ year?: string|number, saison?: string, continent?: string, disciplines?: string[] }} filters
 * @returns {{ chartData: Array<Record<string, unknown>>, allDisciplines: string[], winterDisciplines: string[], summerDisciplines: string[] }}
 */
export function prepareViz2Data(medals, filters = {}) {
  const seasonFilter = filters.saison ?? 'all';
  const selectedDisciplines = filters.disciplines ?? [];

  const filteredMedals = medals.filter((row) => {
    const matchesSeason = seasonFilter === 'all' || row.saison === seasonFilter;
    const matchesDiscipline = selectedDisciplines.length === 0 || selectedDisciplines.includes(row.discipline);
    return matchesSeason && matchesDiscipline && matchSharedFilters(row, filters);
  });

  const eventsByYear = new Map();

  for (const row of filteredMedals) {
    const year = Number(row.year);
    const gender = row.event_gender;
    const eventKey = `${row.discipline}|${row.event}`;

    if (!eventsByYear.has(year)) {
      eventsByYear.set(year, {
        year,
        masculine: new Set(),
        feminine: new Set(),
        mixed: new Set(),
        disciplines: new Set()
      });
    }

    const yearData = eventsByYear.get(year);
    yearData.disciplines.add(row.discipline);

    if (gender === 'Men') {
      yearData.masculine.add(eventKey);
    } else if (gender === 'Women') {
      yearData.feminine.add(eventKey);
    } else if (gender === 'Mixed' || gender === 'Open') {
      yearData.mixed.add(eventKey);
    }
  }

  const chartData = sortByMany(
    [...eventsByYear.values()].map((yearData) => ({
      year: yearData.year,
      masculine: yearData.masculine.size,
      feminine: yearData.feminine.size,
      mixed: yearData.mixed.size,
      disciplines: [...yearData.disciplines].sort()
    })),
    [(row) => row.year]
  );

  const allDisciplines = uniqueSortedValues(medals, (row) => row.discipline);

  const winterDisciplines = uniqueSortedValues(
    medals.filter((row) => row.saison === 'winter'),
    (row) => row.discipline
  );

  const summerDisciplines = uniqueSortedValues(
    medals.filter((row) => row.saison === 'summer'),
    (row) => row.discipline
  );

  return {
    chartData,
    allDisciplines,
    winterDisciplines,
    summerDisciplines
  };
}

/**
 * Exporte les données préparées de la visualisation 2 en CSV.
 * @param {{ chartData: Array<Record<string, unknown>> }} viz2Data
 * @param {string} [filename]
 */
export function exportViz2Csv(viz2Data, filename = 'viz2-output.csv') {
  exportRowsToCsv(viz2Data.chartData, filename);
}

/**
 * Détermine les jalons historiques pour une année donnée.
 * @param {number} year
 * @param {Array<Record<string, unknown>>} chartData
 * @returns {Array<string>}
 */
export function getMilestonesForYear(year, chartData) {
  const milestones = [];
  const yearData = chartData.find((d) => d.year === year);
  const prevYearData = chartData.find((d) => d.year === year - 4 || d.year === year - 2);

  if (!yearData) return milestones;

  if (year === 1896) {
    milestones.push('Premiers Jeux Olympiques modernes');
  }

  if (year === 1924) {
    milestones.push('Premiers Jeux d\'hiver');
  }

  if (yearData.feminine > 0 && (!prevYearData || prevYearData.feminine === 0)) {
    if (year === 1900) {
      milestones.push('Premières épreuves féminines');
    } else {
      milestones.push('Nouvelles épreuves féminines');
    }
  }

  if (yearData.mixed > 0 && (!prevYearData || prevYearData.mixed === 0)) {
    if (year >= 1900 && year <= 1912) {
      milestones.push('Premières épreuves mixtes');
    } else if (year >= 2008) {
      milestones.push('Nouvelles épreuves mixtes');
    }
  }

  if (year === 1996) {
    milestones.push('100 ans des Jeux modernes');
  }

  if (year === 2012) {
    milestones.push('Premiers Jeux avec boxe féminine');
  }

  if (year === 2024) {
    milestones.push('Parité athlètes atteinte à Paris');
  }

  return milestones;
}
