/**
 * Orchestrateur principal de l'application.
 *
 * Flux :
 * 1. affichage du loader
 * 2. chargement + prétraitement des 8 CSV
 * 3. initialisation navigation + filtres
 * 4. préparation des datasets par visualisation
 * 5. rendu des gabarits
 * 6. activation des exports CSV par visualisation
 */

import { createFilters } from './scripts/filters.js';
import { createNavigation } from './scripts/navigation.js';
import { loadAndClean } from './scripts/preprocess.js';
import {
  hideElement,
  safeTrim,
  setHtml,
  showElement
} from './scripts/helper.js';
import { exportViz1Csv, prepareViz1Data } from './scripts/viz1/preprocess-viz1.js';
import { renderViz1 } from './scripts/viz1/viz1-main.js';
import { exportViz2Csv, prepareViz2Data } from './scripts/viz2/preprocess-viz2.js';
import { renderViz2 } from './scripts/viz2/viz2-main.js';
import { exportViz3Csv, prepareViz3Data } from './scripts/viz3/preprocess-viz3.js';
import { renderViz3Line } from './scripts/viz3/viz3-line.js';
import { renderViz3Bubble } from './scripts/viz3/viz3-bubble.js';

const appState = {
  rawData: null,
  filtersApi: null,
  currentVizData: {
    viz1: [],
    viz2: [],
    viz3: {
      lineData: [],
      bubbleData: []
    }
  }
};

document.addEventListener('DOMContentLoaded', bootstrap);

/**
 * Point d'entrée applicatif.
 */
async function bootstrap() {
  setStatus('Chargement des données brutes…');
  showElement('#loading-overlay');
  hideElement('#error-banner');

  try {
    appState.rawData = await loadAndClean();

    createNavigation('#navigation-root');

    appState.filtersApi = createFilters(
      '#filters-root',
      appState.rawData,
      () => {
        rerenderAll();
      }
    );

    bindExportButtons();
    rerenderAll();

    setStatus('Application prête. Les exports CSV sont disponibles pour chaque visualisation.');
  } catch (error) {
    console.error('[index] Erreur fatale au démarrage.', error);

    setHtml(
      '#error-banner',
      `
        <strong>Erreur de chargement</strong><br />
        Vérifie que les 8 CSV sont bien présents dans <code>src/assets/data/raw/</code>
        et que l'application est lancée via un serveur statique.
        <br /><br />
        <code>${escapeHtml(error?.message ?? 'Erreur inconnue')}</code>
      `
    );

    showElement('#error-banner');
    setStatus('Le démarrage a échoué. Consulte le bandeau d’erreur et la console.');
  } finally {
    hideElement('#loading-overlay');
  }
}

/**
 * Recalcule les jeux de données de chaque viz puis relance les rendus.
 */
function rerenderAll() {
  if (!appState.rawData || !appState.filtersApi) {
    return;
  }

  const filters = appState.filtersApi.getState();

  appState.currentVizData.viz1 = prepareViz1Data(appState.rawData.medals, filters);
  appState.currentVizData.viz2 = prepareViz2Data(appState.rawData.medals, filters);
  appState.currentVizData.viz3 = prepareViz3Data(
    appState.rawData.medals,
    appState.rawData.athletesCount,
    filters
  );

  renderViz1({
    containerSelector: '#viz1-root',
    data: appState.currentVizData.viz1
  });

  renderViz2({
    containerSelector: '#viz2-root',
    data: appState.currentVizData.viz2
  });

  renderViz3Line({
    containerSelector: '#viz3-line-root',
    data: appState.currentVizData.viz3.lineData
  });

  renderViz3Bubble({
    containerSelector: '#viz3-bubble-root',
    data: appState.currentVizData.viz3.bubbleData
  });

  setStatus(buildStatusMessage(filters));
}

/**
 * Lie les boutons d'export CSV par visualisation.
 */
function bindExportButtons() {
  document.getElementById('export-viz1')?.addEventListener('click', () => {
    exportViz1Csv(appState.currentVizData.viz1);
  });

  document.getElementById('export-viz2')?.addEventListener('click', () => {
    exportViz2Csv(appState.currentVizData.viz2 ?? { chartData: [] });
  });

  document.getElementById('export-viz3')?.addEventListener('click', () => {
    exportViz3Csv(appState.currentVizData.viz3);
  });
}

/**
 * Met à jour le bandeau de statut.
 * @param {string} message
 */
function setStatus(message) {
  const statusNode = document.getElementById('status-bar');
  if (statusNode) {
    statusNode.textContent = message;
  }
}

/**
 * Construit un message de statut lisible.
 * @param {{ year?: string|number, saison?: string, continent?: string }} filters
 * @returns {string}
 */
function buildStatusMessage(filters) {
  const segments = [
    `Filtres actifs — année : ${safeTrim(filters.year) || 'all'}`,
    `saison : ${safeTrim(filters.saison) || 'all'}`,
    `continent : ${safeTrim(filters.continent) || 'all'}`,
    `| Viz1 : ${appState.currentVizData.viz1.length} lignes`,
    `Viz2 : ${(appState.currentVizData.viz2?.chartData ?? []).length} années`,
    `Viz3 bubble : ${appState.currentVizData.viz3.bubbleData.length} lignes`
  ];

  return segments.join(' · ');
}

/**
 * Échappe du texte avant injection HTML.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
