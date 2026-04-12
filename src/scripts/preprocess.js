/**
 * Module de prétraitement partagé.
 *
 * Responsabilités :
 * 1. charger les 8 CSV bruts via `Promise.all` + `d3.csv`
 * 2. construire les référentiels communs
 * 3. normaliser, dédoublonner et fusionner les données 1896–2022 et 2024
 * 4. retourner des structures propres et cohérentes pour les visualisations
 */

import * as d3 from 'd3';
import {
  COUNTRY_CODE_TO_CONTINENT,
  DEFAULT_FILTERS,
  EVENT_GENDER_MAP_2024,
  EVENT_GENDERS,
  EXPECTED_RAW_FILES,
  HOST_COUNTRY_TO_CODE,
  MEDAL_TYPE_MAP_2024,
  MEDAL_TYPES,
  PARIS_2024_HOST,
  RAW_DATA_FILES,
  SEASONS
} from './config.js';
import {
  coerceNumber,
  dedupeBy,
  firstFilled,
  getBirthYearFromDate,
  normalizeCountryCode,
  safeTrim,
  sortByMany,
  warnOnce
} from './helper.js';

/**
 * Charge et nettoie l'ensemble des sources brutes.
 * @returns {Promise<{ medals: Array<Record<string, unknown>>, athletesCount: Array<Record<string, unknown>>, hosts: Array<Record<string, unknown>> }>}
 */
export async function loadAndClean() {
  console.groupCollapsed('[preprocess] Chargement des fichiers bruts');

  try {
    console.info('[preprocess] Fichiers attendus :', EXPECTED_RAW_FILES);

    const [
      olympicMedalsRaw,
      olympicHostsRaw,
      olympicResultsRaw,
      olympicAthletesRaw,
      medals2024Raw,
      medallists2024Raw,
      athletes2024Raw,
      nocs2024Raw
    ] = await Promise.all([
      d3.csv(RAW_DATA_FILES.olympicMedals),
      d3.csv(RAW_DATA_FILES.olympicHosts),
      d3.csv(RAW_DATA_FILES.olympicResults),
      d3.csv(RAW_DATA_FILES.olympicAthletes),
      d3.csv(RAW_DATA_FILES.medals2024),
      d3.csv(RAW_DATA_FILES.medallists2024),
      d3.csv(RAW_DATA_FILES.athletes2024),
      d3.csv(RAW_DATA_FILES.nocs2024)
    ]);

    console.groupEnd();

    const hosts = buildHostsReference(olympicHostsRaw);
    const hostLookup = new Map(hosts.map((host) => [host.game_slug, host]));

    const athleteBirthYearByUrl = buildAthleteBirthYearMap1896(olympicAthletesRaw);
    const medallistsBirthYearByCode = buildAthleteBirthYearMap2024(medallists2024Raw);
    const nocCountryByCode = buildNocCountryMap(nocs2024Raw);

    const medals1896To2022 = buildHistoricalMedals(
      olympicMedalsRaw,
      hostLookup,
      athleteBirthYearByUrl
    );

    const athletesCount1896To2022 = buildHistoricalAthletesCount(
      olympicResultsRaw,
      hostLookup
    );

    const medals2024 = buildParis2024Medals(
      medals2024Raw,
      nocCountryByCode,
      medallistsBirthYearByCode
    );

    const athletesCount2024 = buildParis2024AthletesCount(
      athletes2024Raw,
      nocCountryByCode
    );

    const medals = sortByMany(
      [...medals1896To2022, ...medals2024],
      [(row) => Number(row.year), (row) => safeTrim(row.country_code), (row) => safeTrim(row.event)]
    );

    const athletesCount = sortByMany(
      [...athletesCount1896To2022, ...athletesCount2024],
      [(row) => Number(row.year), (row) => safeTrim(row.country_code)]
    );

    validateOutputs({ medals, athletesCount, hosts });

    return {
      medals,
      athletesCount,
      hosts
    };
  } catch (error) {
    console.groupEnd();
    console.error('[preprocess] Échec du chargement / nettoyage.', error);
    throw error;
  }
}

/**
 * Construit le référentiel des éditions hôtes.
 * @param {Array<Record<string, string>>} olympicHostsRaw
 * @returns {Array<Record<string, unknown>>}
 */
function buildHostsReference(olympicHostsRaw) {
  const normalizedHosts = olympicHostsRaw.map((row) => {
    const hostCountry = firstFilled(row.game_location, row.host_country);

    return {
      game_slug: safeTrim(row.game_slug),
      year: coerceNumber(row.game_year),
      saison: safeTrim(row.game_season).toLowerCase(),
      host_country: hostCountry,
      host_country_code: resolveHostCountryCode(hostCountry)
    };
  });

  const hostLookup = new Map();

  for (const host of normalizedHosts) {
    hostLookup.set(host.game_slug, host);
  }

  // On force l'ajout de Paris 2024 si la ligne n'est pas encore dans le CSV historique.
  if (!hostLookup.has(PARIS_2024_HOST.game_slug)) {
    hostLookup.set(PARIS_2024_HOST.game_slug, { ...PARIS_2024_HOST });
  }

  return sortByMany([...hostLookup.values()], [(row) => Number(row.year)]);
}

/**
 * Construit un index athlete_url -> année de naissance.
 * @param {Array<Record<string, string>>} olympicAthletesRaw
 * @returns {Map<string, number>}
 */
function buildAthleteBirthYearMap1896(olympicAthletesRaw) {
  const lookup = new Map();

  for (const row of olympicAthletesRaw) {
    const athleteUrl = safeTrim(row.athlete_url);
    const birthYear = coerceNumber(row.athlete_year_birth);

    if (athleteUrl && birthYear != null) {
      lookup.set(athleteUrl, birthYear);
    }
  }

  return lookup;
}

/**
 * Construit un index code_athlete -> année de naissance pour Paris 2024.
 * @param {Array<Record<string, string>>} medallists2024Raw
 * @returns {Map<string, number>}
 */
function buildAthleteBirthYearMap2024(medallists2024Raw) {
  const lookup = new Map();

  for (const row of medallists2024Raw) {
    const athleteCode = firstFilled(
      row.code_athlete,
      row.codeAthlete,
      row.athlete_code,
      row.code
    );
    const birthYear = getBirthYearFromDate(row.birth_date);

    if (athleteCode && birthYear != null) {
      lookup.set(athleteCode, birthYear);
    }
  }

  return lookup;
}

/**
 * Construit un index NOC code -> nom du pays.
 * @param {Array<Record<string, string>>} nocs2024Raw
 * @returns {Map<string, string>}
 */
function buildNocCountryMap(nocs2024Raw) {
  const lookup = new Map();

  for (const row of nocs2024Raw) {
    const code = normalizeCountryCode(firstFilled(row.code, row.country_code, row.ioc_code));
    const country = firstFilled(row.country, row.country_long, row.country_name, row.name);

    if (code && country) {
      lookup.set(code, country);
    }
  }

  return lookup;
}

/**
 * Prépare les médailles 1896–2022.
 * @param {Array<Record<string, string>>} olympicMedalsRaw
 * @param {Map<string, Record<string, unknown>>} hostLookup
 * @param {Map<string, number>} athleteBirthYearByUrl
 * @returns {Array<Record<string, unknown>>}
 */
function buildHistoricalMedals(olympicMedalsRaw, hostLookup, athleteBirthYearByUrl) {
  const joinedRows = olympicMedalsRaw
    .map((row) => {
      const countryCode = normalizeCountryCode(row.country_3_letter_code);

      if (!countryCode) {
        return null;
      }

      const gameSlug = safeTrim(row.slug_game);
      const host = resolveHost(hostLookup, gameSlug);

      return {
        game_slug: gameSlug,
        year: host.year,
        saison: host.saison,
        host_country: host.host_country,
        host_country_code: host.host_country_code,
        discipline: firstFilled(row.discipline_title, row.discipline),
        event: firstFilled(row.event_title, row.event),
        event_gender: normalizeEventGender(row.event_gender),
        medal_type: normalizeMedalType(row.medal_type),
        country_code: countryCode,
        country: firstFilled(row.country_name, row.country, countryCode),
        athlete_identifier: safeTrim(row.athlete_url)
      };
    })
    .filter(Boolean);

  const collapsedRows = collapseDuplicateMedalRows(
    joinedRows,
    (row) =>
      [
        row.game_slug,
        row.discipline,
        row.event,
        row.event_gender,
        row.medal_type,
        row.country_code
      ].join('|'),
    (row) => row.athlete_identifier
  );

  return collapsedRows.map((row) => ({
    year: row.year,
    game_slug: row.game_slug,
    country_code: row.country_code,
    country: row.country,
    continent: resolveContinent(row.country_code),
    discipline: row.discipline,
    event: row.event,
    event_gender: row.event_gender,
    medal_type: row.medal_type,
    host_country: row.host_country,
    host_country_code: row.host_country_code,
    is_host: row.country_code === row.host_country_code,
    saison: row.saison,
    birth_year:
      row.resolved_athlete_identifier != null
        ? athleteBirthYearByUrl.get(row.resolved_athlete_identifier) ?? null
        : null
  }));
}

/**
 * Prépare les participations 1896–2022.
 * @param {Array<Record<string, string>>} olympicResultsRaw
 * @param {Map<string, Record<string, unknown>>} hostLookup
 * @returns {Array<Record<string, unknown>>}
 */
function buildHistoricalAthletesCount(olympicResultsRaw, hostLookup) {
  const athleteRows = olympicResultsRaw
    .filter((row) => safeTrim(row.participant_type) === 'Athlete')
    .map((row) => {
      const countryCode = normalizeCountryCode(row.country_3_letter_code);

      if (!countryCode) {
        return null;
      }

      const gameSlug = safeTrim(row.slug_game);
      const host = resolveHost(hostLookup, gameSlug);

      return {
        athlete_unique_key: [
          firstFilled(row.athlete_full_name, row.athlete_url, 'UNKNOWN_ATHLETE'),
          countryCode,
          gameSlug
        ].join('|'),
        year: host.year,
        game_slug: gameSlug,
        country_code: countryCode,
        country: firstFilled(row.country_name, row.country, countryCode),
        saison: host.saison
      };
    })
    .filter(Boolean);

  const uniqueAthletes = dedupeBy(athleteRows, (row) => row.athlete_unique_key);
  const aggregation = new Map();

  for (const row of uniqueAthletes) {
    const key = [row.year, row.game_slug, row.country_code].join('|');

    if (!aggregation.has(key)) {
      aggregation.set(key, {
        year: row.year,
        game_slug: row.game_slug,
        country_code: row.country_code,
        country: row.country,
        continent: resolveContinent(row.country_code),
        nb_athletes: 0,
        saison: row.saison
      });
    }

    aggregation.get(key).nb_athletes += 1;
  }

  return sortByMany([...aggregation.values()], [
    (row) => Number(row.year),
    (row) => safeTrim(row.country_code)
  ]);
}

/**
 * Prépare les médailles Paris 2024.
 * @param {Array<Record<string, string>>} medals2024Raw
 * @param {Map<string, string>} nocCountryByCode
 * @param {Map<string, number>} medallistsBirthYearByCode
 * @returns {Array<Record<string, unknown>>}
 */
function buildParis2024Medals(medals2024Raw, nocCountryByCode, medallistsBirthYearByCode) {
  const preparedRows = medals2024Raw
    .map((row) => {
      const countryCode = normalizeCountryCode(row.country_code);

      if (!countryCode) {
        return null;
      }

      return {
        year: 2024,
        game_slug: PARIS_2024_HOST.game_slug,
        saison: PARIS_2024_HOST.saison,
        host_country: PARIS_2024_HOST.host_country,
        host_country_code: PARIS_2024_HOST.host_country_code,
        discipline: firstFilled(row.discipline, row.discipline_title),
        event: firstFilled(row.event, row.event_title),
        event_gender: normalizeEventGender2024(row.gender),
        medal_type: normalizeMedalType2024(row.medal_type),
        country_code: countryCode,
        country: firstFilled(row.country, row.country_long, nocCountryByCode.get(countryCode), countryCode),
        athlete_identifier: firstFilled(row.code, row.code_athlete, row.athlete_code)
      };
    })
    .filter(Boolean);

  const collapsedRows = collapseDuplicateMedalRows(
    preparedRows,
    (row) =>
      [
        row.game_slug,
        row.discipline,
        row.event,
        row.event_gender,
        row.medal_type,
        row.country_code
      ].join('|'),
    (row) => row.athlete_identifier
  );

  return collapsedRows.map((row) => ({
    year: row.year,
    game_slug: row.game_slug,
    country_code: row.country_code,
    country: row.country,
    continent: resolveContinent(row.country_code),
    discipline: row.discipline,
    event: row.event,
    event_gender: row.event_gender,
    medal_type: row.medal_type,
    host_country: row.host_country,
    host_country_code: row.host_country_code,
    is_host: row.country_code === row.host_country_code,
    saison: row.saison,
    birth_year:
      row.resolved_athlete_identifier != null
        ? medallistsBirthYearByCode.get(row.resolved_athlete_identifier) ?? null
        : null
  }));
}

/**
 * Prépare les participations Paris 2024.
 * @param {Array<Record<string, string>>} athletes2024Raw
 * @param {Map<string, string>} nocCountryByCode
 * @returns {Array<Record<string, unknown>>}
 */
function buildParis2024AthletesCount(athletes2024Raw, nocCountryByCode) {
  const preparedRows = athletes2024Raw
    .map((row) => {
      const countryCode = normalizeCountryCode(row.country_code);

      if (!countryCode) {
        return null;
      }

      return {
        athlete_unique_key: [
          firstFilled(row.code, row.code_athlete, row.athlete_code, row.name, row.birth_date, 'ROW'),
          countryCode,
          firstFilled(row.birth_date)
        ].join('|'),
        year: 2024,
        game_slug: PARIS_2024_HOST.game_slug,
        country_code: countryCode,
        country: firstFilled(row.country, row.country_long, nocCountryByCode.get(countryCode), countryCode),
        saison: PARIS_2024_HOST.saison
      };
    })
    .filter(Boolean);

  const uniqueAthletes = dedupeBy(preparedRows, (row) => row.athlete_unique_key);
  const aggregation = new Map();

  for (const row of uniqueAthletes) {
    const key = [row.year, row.game_slug, row.country_code].join('|');

    if (!aggregation.has(key)) {
      aggregation.set(key, {
        year: row.year,
        game_slug: row.game_slug,
        country_code: row.country_code,
        country: row.country,
        continent: resolveContinent(row.country_code),
        nb_athletes: 0,
        saison: row.saison
      });
    }

    aggregation.get(key).nb_athletes += 1;
  }

  return sortByMany([...aggregation.values()], [
    (row) => Number(row.year),
    (row) => safeTrim(row.country_code)
  ]);
}

/**
 * Résout un hôte à partir de son slug.
 * Si le slug n'est pas connu, on retourne un objet minimal pour éviter un crash dur.
 * @param {Map<string, Record<string, unknown>>} hostLookup
 * @param {string} gameSlug
 * @returns {Record<string, unknown>}
 */
function resolveHost(hostLookup, gameSlug) {
  const host = hostLookup.get(gameSlug);

  if (host) {
    return host;
  }

  warnOnce(`[preprocess] Aucun hôte trouvé pour l'édition "${gameSlug}".`, gameSlug);

  return {
    game_slug: gameSlug,
    year: null,
    saison: '',
    host_country: '',
    host_country_code: ''
  };
}

/**
 * Déduit le code du pays hôte à partir du libellé pays.
 * @param {string} hostCountry
 * @returns {string}
 */
function resolveHostCountryCode(hostCountry) {
  const code = HOST_COUNTRY_TO_CODE[hostCountry];

  if (!code && hostCountry) {
    warnOnce(`[preprocess] Pays hôte non mappé : "${hostCountry}"`, hostCountry);
  }

  return code ?? '';
}

/**
 * Retourne le continent d'un code IOC.
 * Les codes inconnus sont ramenés à `Other`.
 * @param {string} countryCode
 * @returns {string}
 */
function resolveContinent(countryCode) {
  const normalizedCode = normalizeCountryCode(countryCode);
  const continent = COUNTRY_CODE_TO_CONTINENT[normalizedCode];

  if (!continent && normalizedCode) {
    warnOnce(`[preprocess] Code pays sans continent : "${normalizedCode}"`, normalizedCode);
  }

  return continent ?? 'Other';
}

/**
 * Normalise le libellé de médaille.
 * @param {string} medalType
 * @returns {string}
 */
function normalizeMedalType(medalType) {
  const normalized = safeTrim(medalType).toUpperCase();
  return normalized;
}

/**
 * Normalise le libellé de médaille spécifique à Paris 2024.
 * @param {string} medalType
 * @returns {string}
 */
function normalizeMedalType2024(medalType) {
  return MEDAL_TYPE_MAP_2024[safeTrim(medalType)] ?? normalizeMedalType(medalType);
}

/**
 * Normalise le genre d'épreuve.
 * @param {string} eventGender
 * @returns {string}
 */
function normalizeEventGender(eventGender) {
  const normalized = safeTrim(eventGender);

  if (!normalized) {
    return '';
  }

  if (normalized === 'M') {
    return 'Men';
  }

  if (normalized === 'W') {
    return 'Women';
  }

  if (normalized === 'X') {
    return 'Mixed';
  }

  if (normalized === 'O') {
    return 'Open';
  }

  return normalized;
}

/**
 * Normalise le genre d'épreuve spécifique à Paris 2024.
 * @param {string} eventGender
 * @returns {string}
 */
function normalizeEventGender2024(eventGender) {
  return EVENT_GENDER_MAP_2024[safeTrim(eventGender)] ?? normalizeEventGender(eventGender);
}

/**
 * Dédoublonne des lignes de médaille tout en essayant de préserver l'identifiant
 * athlète seulement lorsque l'on est certain qu'il n'y en avait qu'un.
 *
 * Cas couvert :
 * - médaille individuelle : on garde l'identifiant
 * - médaille d'équipe : plusieurs athlètes derrière la même clé, on met `null`
 *
 * @template T
 * @param {T[]} rows
 * @param {(row: T) => string} keyAccessor
 * @param {(row: T) => string} athleteIdentifierAccessor
 * @returns {Array<T & { resolved_athlete_identifier: string|null }>}
 */
function collapseDuplicateMedalRows(rows, keyAccessor, athleteIdentifierAccessor) {
  const groupedRows = d3.groups(rows, keyAccessor);

  return groupedRows.map(([, values]) => {
    const baseRow = values[0];
    const athleteIdentifiers = [
      ...new Set(values.map(athleteIdentifierAccessor).map((value) => safeTrim(value)).filter(Boolean))
    ];

    return {
      ...baseRow,
      resolved_athlete_identifier:
        athleteIdentifiers.length === 1 ? athleteIdentifiers[0] : null
    };
  });
}

/**
 * Valide la cohérence générale du prétraitement et logge un résumé en console.
 * @param {{ medals: Array<Record<string, unknown>>, athletesCount: Array<Record<string, unknown>>, hosts: Array<Record<string, unknown>> }} payload
 */
function validateOutputs({ medals, athletesCount, hosts }) {
  const distinctEditions = new Set(medals.map((row) => safeTrim(row.game_slug))).size;
  const genders = [...new Set(medals.map((row) => safeTrim(row.event_gender)).filter(Boolean))].sort();
  const medalTypes = [...new Set(medals.map((row) => safeTrim(row.medal_type)).filter(Boolean))].sort();
  const seasons = [...new Set(medals.map((row) => safeTrim(row.saison)).filter(Boolean))].sort();
  const emptyCountryCodes = medals.filter((row) => !safeTrim(row.country_code));

  console.groupCollapsed('[preprocess] Validation');
  console.log('[preprocess] Filtres par défaut :', DEFAULT_FILTERS);
  console.log('[preprocess] Nb éditions distinctes dans medals :', distinctEditions);
  console.log('[preprocess] event_gender distincts :', genders);
  console.log('[preprocess] medal_type distincts :', medalTypes);
  console.log('[preprocess] saison distinctes :', seasons);
  console.log('[preprocess] Volumétrie :', {
    medals: medals.length,
    athletesCount: athletesCount.length,
    hosts: hosts.length
  });

  if (distinctEditions < 50 || distinctEditions > 60) {
    console.warn(
      '[preprocess] Le nombre d\'éditions distinctes semble inhabituel.',
      distinctEditions
    );
  }

  if (!arraysContainSameMembers(genders, EVENT_GENDERS)) {
    console.warn('[preprocess] Les genres détectés diffèrent de la liste attendue.', {
      detected: genders,
      expected: EVENT_GENDERS
    });
  }

  if (!arraysContainSameMembers(medalTypes, MEDAL_TYPES)) {
    console.warn('[preprocess] Les types de médaille détectés diffèrent de la liste attendue.', {
      detected: medalTypes,
      expected: MEDAL_TYPES
    });
  }

  if (!arraysContainSameMembers(seasons, SEASONS)) {
    console.warn('[preprocess] Les saisons détectées diffèrent de la liste attendue.', {
      detected: seasons,
      expected: SEASONS
    });
  }

  if (emptyCountryCodes.length > 0) {
    console.error('[preprocess] Des lignes avec country_code vide ont survécu au nettoyage.', {
      count: emptyCountryCodes.length,
      sample: emptyCountryCodes.slice(0, 5)
    });
  }

  console.groupEnd();
}

/**
 * Compare deux listes comme des ensembles.
 * @param {string[]} detected
 * @param {readonly string[]} expected
 * @returns {boolean}
 */
function arraysContainSameMembers(detected, expected) {
  const detectedSorted = [...detected].sort();
  const expectedSorted = [...expected].sort();

  return JSON.stringify(detectedSorted) === JSON.stringify(expectedSorted);
}
