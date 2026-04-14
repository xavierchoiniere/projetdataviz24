/**
 * Configuration centrale du projet :
 * - chemins des données
 * - mappings de normalisation
 * - palettes de couleurs
 * - dimensions SVG
 *
 * Ce fichier est pleinement fonctionnel et peut être enrichi si de nouveaux cas
 * apparaissent dans les jeux de données bruts.
 */

export const RAW_DATA_FILES = Object.freeze({
  olympicMedals: './assets/data/raw/olympic_medals.csv',
  olympicHosts: './assets/data/raw/olympic_hosts.csv',
  olympicResults: './assets/data/raw/olympic_results.csv',
  olympicAthletes: './assets/data/raw/olympic_athletes.csv',
  medals2024: './assets/data/raw/medals.csv',
  medallists2024: './assets/data/raw/medallists.csv',
  athletes2024: './assets/data/raw/athletes.csv',
  nocs2024: './assets/data/raw/nocs.csv'
});

export const EXPECTED_RAW_FILES = Object.freeze(Object.values(RAW_DATA_FILES));

/**
 * Référentiel robuste des pays hôtes.
 * On inclut plusieurs alias pour éviter qu'une légère variation textuelle du CSV
 * casse la jointure.
 */
export const HOST_COUNTRY_TO_CODE = Object.freeze({
  "Australia": "AUS",
  "Austria": "AUT",
  "Belgium": "BEL",
  "Bosnia and Herzegovina": "BIH",
  "Brazil": "BRA",
  "Canada": "CAN",
  "China": "CHN",
  "East Germany": "GDR",
  "Federal Republic of Germany": "FRG",
  "Finland": "FIN",
  "France": "FRA",
  "Germany": "GER",
  "Great Britain": "GBR",
  "Greece": "GRE",
  "Italy": "ITA",
  "Japan": "JPN",
  "Mexico": "MEX",
  "Netherlands": "NED",
  "Norway": "NOR",
  "People's Republic of China": "CHN",
  "Republic of Korea": "KOR",
  "Russian Federation": "RUS",
  "Soviet Union": "URS",
  "South Korea": "KOR",
  "Spain": "ESP",
  "Sweden": "SWE",
  "Switzerland": "SUI",
  "UK": "GBR",
  "United Kingdom": "GBR",
  "United States": "USA",
  "United States of America": "USA",
  "USSR": "URS",
  "West Germany": "FRG",
  "Yugoslavia": "YUG"
});

/**
 * Mapping des continents pour les codes IOC / NOC.
 * Le mapping couvre :
 * - les pays actuels
 * - plusieurs codes historiques olympiques
 * - des codes spéciaux / délégations particulières
 */
const CONTINENT_GROUPS = Object.freeze({
  'Africa': [
  "ALG",
  "ANG",
  "BDI",
  "BEN",
  "BOT",
  "BUR",
  "CAF",
  "CGO",
  "CHA",
  "CIV",
  "CMR",
  "COD",
  "COM",
  "CPV",
  "DJI",
  "EGY",
  "ERI",
  "ETH",
  "GAB",
  "GAM",
  "GBS",
  "GEQ",
  "GHA",
  "GUI",
  "KEN",
  "LBA",
  "LBR",
  "LES",
  "MAD",
  "MAR",
  "MAW",
  "MLI",
  "MOZ",
  "MRI",
  "MTN",
  "NAM",
  "NGR",
  "NIG",
  "RHO",
  "RSA",
  "RWA",
  "SEN",
  "SEY",
  "SLE",
  "SOM",
  "SSD",
  "STP",
  "SUD",
  "SWZ",
  "TAN",
  "TOG",
  "TUN",
  "UAR",
  "UGA",
  "ZAI",
  "ZAM",
  "ZIM"
],
  'North America': [
  "AHO",
  "ANT",
  "ARU",
  "BAH",
  "BAR",
  "BER",
  "BIZ",
  "CAN",
  "CAY",
  "CRC",
  "CUB",
  "DMA",
  "DOM",
  "ESA",
  "GRN",
  "GUA",
  "HAI",
  "HON",
  "ISV",
  "JAM",
  "LCA",
  "MEX",
  "NCA",
  "PAN",
  "PUR",
  "SKN",
  "TRI",
  "TTO",
  "USA",
  "VIN"
],
  'South America': [
  "ARG",
  "BOL",
  "BRA",
  "CHI",
  "COL",
  "ECU",
  "GUY",
  "PAR",
  "PER",
  "SUR",
  "URU",
  "VEN"
],
  'Asia': [
  "AFG",
  "ARE",
  "ARM",
  "AZE",
  "BAN",
  "BHR",
  "BHU",
  "BRN",
  "BRU",
  "CAM",
  "CHN",
  "CYP",
  "GEO",
  "HKG",
  "INA",
  "IND",
  "IRI",
  "IRQ",
  "ISR",
  "JOR",
  "JPN",
  "KAZ",
  "KGZ",
  "KOR",
  "KSA",
  "KUW",
  "LAO",
  "LIB",
  "MAS",
  "MDV",
  "MGL",
  "MYA",
  "NEP",
  "OMA",
  "PAK",
  "PHI",
  "PLE",
  "PRK",
  "QAT",
  "SGP",
  "SRI",
  "SYR",
  "THA",
  "TJK",
  "TKM",
  "TLS",
  "TPE",
  "TUR",
  "UAE",
  "UZB",
  "VIE",
  "YEM"
],
  'Europe': [
  "ALB",
  "AND",
  "AUT",
  "BEL",
  "BIH",
  "BLR",
  "BOH",
  "BUL",
  "CRO",
  "CZE",
  "DEN",
  "EUN",
  "EUA",
  "ESP",
  "EST",
  "FIN",
  "FRA",
  "FRG",
  "GBR",
  "GDR",
  "GER",
  "GRE",
  "HUN",
  "IRL",
  "ISL",
  "ITA",
  "KOS",
  "LAT",
  "LIE",
  "LTU",
  "LUX",
  "MDA",
  "MKD",
  "MLT",
  "MNE",
  "MON",
  "NED",
  "NOR",
  "OAR",
  "POL",
  "POR",
  "ROC",
  "ROU",
  "RUS",
  "SAA",
  "SCG",
  "SMR",
  "SRB",
  "SLO",
  "SVK",
  "SUI",
  "SWE",
  "TCH",
  "UKR",
  "URS",
  "YUG"
],
  'Oceania': [
  "ANZ",
  "ASA",
  "AUS",
  "COK",
  "FIJ",
  "FSM",
  "GUM",
  "KIR",
  "MHL",
  "NRU",
  "NZL",
  "PLW",
  "PNG",
  "SAM",
  "SOL",
  "TGA",
  "TUV",
  "VAN"
],
  'Other': [
  "AIN",
  "COR",
  "EOR",
  "IOA",
  "MIX",
  "ROT",
  "ZZX"
]
});

export const COUNTRY_CODE_TO_CONTINENT = Object.freeze(
  Object.entries(CONTINENT_GROUPS).reduce((accumulator, [continent, codes]) => {
    for (const code of codes) {
      accumulator[code] = continent;
    }
    return accumulator;
  }, {})
);

export const MEDAL_TYPE_MAP_2024 = Object.freeze({
  'Gold Medal': 'GOLD',
  'Silver Medal': 'SILVER',
  'Bronze Medal': 'BRONZE'
});

export const EVENT_GENDER_MAP_2024 = Object.freeze({
  M: 'Men',
  W: 'Women',
  X: 'Mixed',
  O: 'Open'
});

export const MEDAL_TYPES = Object.freeze(['GOLD', 'SILVER', 'BRONZE']);
export const EVENT_GENDERS = Object.freeze(['Men', 'Women', 'Mixed', 'Open']);
export const SEASONS = Object.freeze(['summer', 'winter']);

export const PARIS_2024_HOST = Object.freeze({
  game_slug: 'paris-2024',
  year: 2024,
  saison: 'summer',
  host_country: 'France',
  host_country_code: 'FRA'
});

export const MEDAL_COLORS = Object.freeze({
  GOLD: '#D4AF37',
  SILVER: '#A7A7AD',
  BRONZE: '#B87333'
});

export const GENDER_COLORS = Object.freeze({
  Men: '#2563eb',
  Women: '#f43f5e',
  Mixed: '#10b981',
  Open: '#b07aa1'
});

export const CONTINENT_COLORS = Object.freeze({
  Africa: '#59A14F',
  'North America': '#4E79A7',
  'South America': '#E15759',
  Asia: '#F28E2B',
  Europe: '#B07AA1',
  Oceania: '#76B7B2',
  Other: '#9C755F'
});

export const SEASON_COLORS = Object.freeze({
  summer: '#F28E2B',
  winter: '#4E79A7'
});

export const SVG_DIMENSIONS = Object.freeze({
  viz1: {
    width: 1180,
    height: 640,
    margin: { top: 64, right: 32, bottom: 64, left: 72 }
  },
  viz2: {
    width: 1180,
    height: 640,
    margin: { top: 64, right: 32, bottom: 64, left: 72 }
  },
  viz3Line: {
    width: 880,
    height: 420,
    margin: { top: 48, right: 24, bottom: 56, left: 72 }
  },
  viz3Bubble: {
    width: 880,
    height: 560,
    margin: { top: 48, right: 24, bottom: 56, left: 72 }
  }
});

export const DEFAULT_FILTERS = Object.freeze({
  year: 'all',
  saison: 'all',
  continent: 'all'
});
