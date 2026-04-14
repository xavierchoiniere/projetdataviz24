/**
 * Point d'entrée de la visualisation 2.
 *
 * Graphique à barres divergentes montrant l'évolution du nombre
 * d'épreuves masculines, féminines et mixtes aux Jeux Olympiques (1896-2024).
 */

import * as d3 from 'd3';
import { GENDER_COLORS } from '../config.js';
import { renderViz2Legend } from './viz2-legend.js';
import { createViz2Tooltip, showTooltip, hideTooltip } from './viz2-tooltip.js';
import { getMilestonesForYear } from './preprocess-viz2.js';
import {
  clearNode,
  createDomNode,
  formatInteger,
  formatYear,
  resolveNode
} from '../helper.js';

const MARGIN = { top: 90, right: 320, bottom: 60, left: 100 };
const WIDTH = 900;
const HEIGHT = 900;

const SEASON_DISCIPLINES = {
  summer: new Set(['Athletics', 'Swimming', 'Gymnastics', 'Boxing', 'Wrestling', 'Basketball', 'Football', 'Tennis',
    'Cycling', 'Rowing', 'Sailing', 'Weightlifting', 'Shooting', 'Fencing', 'Diving', 'Water Polo',
    'Hockey', 'Rugby', 'Golf', 'Archery', 'Badminton', 'Baseball', 'Softball', 'Beach Volleyball',
    'Canoe Slalom', 'Canoe Sprint', 'Equestrian', 'Handball', 'Judo', 'Modern Pentathlon',
    'Sport Climbing', 'Surfing', 'Skateboarding', 'Breaking', 'Table Tennis', 'Taekwondo',
    'Triathlon', 'Volleyball', '3x3 Basketball', 'Artistic Swimming', 'Rhythmic Gymnastics',
    'Trampoline', 'Golf', 'Karate', 'Marathon Swimming', 'Mountain Biking', 'BMX Freestyle',
    'BMX Racing', 'Road Cycling', 'Track Cycling', 'Equestrian Dressage', 'Equestrian Eventing',
    'Equestrian Jumping', 'Canoe Slalom', 'Canoe Sprint', 'Kayak Cross']),
  winter: new Set(['Alpine Skiing', 'Biathlon', 'Bobsleigh', 'Cross-Country Skiing', 'Curling',
    'Figure Skating', 'Freestyle Skiing', 'Ice Hockey', 'Luge', 'Nordic Combined', 'Short Track',
    'Skeleton', 'Ski Jumping', 'Snowboard', 'Speed Skating'])
};

/**
 * Rend la visualisation 2 avec le graphique à barres divergentes et le panneau de filtres.
 * @param {{ containerSelector?: string|HTMLElement, data?: { chartData: Array<Record<string, unknown>>, allDisciplines: string[], winterDisciplines: string[], summerDisciplines: string[] } }} payload
 */
export function renderViz2({ containerSelector = '#viz2-root', data = {} } = {}) {
  const container = clearNode(containerSelector);
  const { chartData = [], allDisciplines = [], winterDisciplines = [], summerDisciplines = [] } = data;

  if (chartData.length === 0) {
    container.append(createDomNode('p', '', 'Aucune donnée disponible pour les filtres sélectionnés.'));
    return;
  }

  const wrapper = createDomNode('div', 'viz2-wrapper');
  const mainArea = createDomNode('div', 'viz2-main-area');


  const chartWrapper = createDomNode('div', 'chart-wrapper');
  const chartContainer = createDomNode('div', 'chart-container');
  chartWrapper.appendChild(chartContainer);
  mainArea.appendChild(chartWrapper);

  const state = {
    selectedDisciplines: [],
    isWinterFilter: false,
    isSummerFilter: false,
    originalData: chartData
  };

  function filterData() {
    if (state.selectedDisciplines.length === 0 && !state.isWinterFilter && !state.isSummerFilter) {
      return state.originalData;
    }

    const filteredYears = new Map();

    for (const yearData of state.originalData) {
      let masculineCount = 0;
      let feminineCount = 0;
      let mixedCount = 0;

      const disciplines = state.selectedDisciplines.length > 0
        ? state.selectedDisciplines
        : yearData.disciplines;

      for (const discipline of disciplines) {
        if (state.isWinterFilter && !SEASON_DISCIPLINES.winter.has(discipline)) continue;
        if (state.isSummerFilter && !SEASON_DISCIPLINES.summer.has(discipline)) continue;

        if (yearData.disciplines.includes(discipline)) {
          masculineCount += yearData.masculine / yearData.disciplines.length;
          feminineCount += yearData.feminine / yearData.disciplines.length;
          mixedCount += yearData.mixed / yearData.disciplines.length;
        }
      }

      if (masculineCount > 0 || feminineCount > 0 || mixedCount > 0) {
        filteredYears.set(yearData.year, {
          year: yearData.year,
          masculine: Math.round(masculineCount),
          feminine: Math.round(feminineCount),
          mixed: Math.round(mixedCount),
          disciplines: state.selectedDisciplines.length > 0 ? state.selectedDisciplines : yearData.disciplines
        });
      }
    }

    return Array.from(filteredYears.values()).sort((a, b) => a.year - b.year);
  }

  function renderChart() {
    const filteredData = filterData();

    chartContainer.innerHTML = '';

    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', WIDTH)
      .attr('height', HEIGHT)
      .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
      .attr('class', 'viz2-svg');

    const g = svg.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const maxEvents = d3.max(filteredData, (d) => Math.max(d.masculine, d.feminine + d.mixed)) || 100;

    const xScaleLeft = d3.scaleLinear()
      .domain([0, maxEvents])
      .range([innerWidth / 2, 0]);

    const xScaleRight = d3.scaleLinear()
      .domain([0, maxEvents])
      .range([innerWidth / 2, innerWidth]);

    const yScale = d3.scaleBand()
      .domain(filteredData.map((d) => d.year))
      .range([0, innerHeight])
      .padding(0.5);

    const barHeight = yScale.bandwidth();

    g.selectAll('.bar-masculine')
      .data(filteredData)
      .enter()
      .append('rect')
      .attr('class', 'bar bar-masculine')
      .attr('x', (d) => xScaleLeft(d.masculine))
      .attr('y', (d) => yScale(d.year))
      .attr('width', (d) => xScaleLeft(0) - xScaleLeft(d.masculine))
      .attr('height', barHeight)
      .attr('fill', GENDER_COLORS.Men)
      .on('mouseover', function(event, d) {
        const milestones = getMilestonesForYear(d.year, state.originalData);
        showTooltip(createViz2Tooltip(), d, 'masculine', event, milestones);
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mousemove', function(event) {
        const tooltip = createViz2Tooltip();
        tooltip.node.style.left = `${event.clientX + 12}px`;
        tooltip.node.style.top = `${event.clientY + 12}px`;
      })
      .on('mouseout', function() {
        hideTooltip(createViz2Tooltip());
        d3.select(this).attr('opacity', 1);
      });

    g.selectAll('.bar-feminine')
      .data(filteredData)
      .enter()
      .append('rect')
      .attr('class', 'bar bar-feminine')
      .attr('x', innerWidth / 2)
      .attr('y', (d) => yScale(d.year))
      .attr('width', (d) => xScaleRight(d.feminine) - xScaleRight(0))
      .attr('height', barHeight)
      .attr('fill', GENDER_COLORS.Women)
      .on('mouseover', function(event, d) {
        const milestones = getMilestonesForYear(d.year, state.originalData);
        showTooltip(createViz2Tooltip(), d, 'feminine', event, milestones);
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mousemove', function(event) {
        const tooltip = createViz2Tooltip();
        tooltip.node.style.left = `${event.clientX + 12}px`;
        tooltip.node.style.top = `${event.clientY + 12}px`;
      })
      .on('mouseout', function() {
        hideTooltip(createViz2Tooltip());
        d3.select(this).attr('opacity', 1);
      });

    g.selectAll('.bar-mixed')
      .data(filteredData)
      .enter()
      .append('rect')
      .attr('class', 'bar bar-mixed')
      .attr('x', (d) => xScaleRight(0) + (xScaleRight(d.feminine) - xScaleRight(0)))
      .attr('y', (d) => yScale(d.year))
      .attr('width', (d) => xScaleRight(d.mixed) - xScaleRight(0))
      .attr('height', barHeight)
      .attr('fill', GENDER_COLORS.Mixed)
      .on('mouseover', function(event, d) {
        const milestones = getMilestonesForYear(d.year, state.originalData);
        showTooltip(createViz2Tooltip(), d, 'mixed', event, milestones);
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mousemove', function(event) {
        const tooltip = createViz2Tooltip();
        tooltip.node.style.left = `${event.clientX + 12}px`;
        tooltip.node.style.top = `${event.clientY + 12}px`;
      })
      .on('mouseout', function() {
        hideTooltip(createViz2Tooltip());
        d3.select(this).attr('opacity', 1);
      });

    const xAxisBottom = d3.axisBottom(xScaleLeft)
      .ticks(5)
      .tickFormat((d) => formatInteger(d));

    const xAxisBottomRight = d3.axisBottom(xScaleRight)
      .ticks(5)
      .tickFormat((d) => formatInteger(d));

    const allYears = filteredData.map(d => d.year);
    const tickYears = allYears.filter((_, i) => i % 2 === 0);
    const yAxis = d3.axisLeft(yScale)
      .tickValues(tickYears)
      .tickFormat((d) => formatYear(d));

    g.append('g')
      .attr('class', 'axis x-axis-bottom-left')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxisBottom);

    g.append('g')
      .attr('class', 'axis x-axis-bottom-right')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxisBottomRight);

    g.append('g')
      .attr('class', 'axis y-axis')
      .call(yAxis);

    g.append('line')
      .attr('class', 'center-line')
      .attr('x1', innerWidth / 2)
      .attr('x2', innerWidth / 2)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.5);

    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#475569')
      .text('Nombre d\'épreuves');

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .attr('fill', '#475569')
      .text('Année');

    const titleGroup = g.append('g').attr('class', 'viz2-chart-title');

    titleGroup.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -55)
      .attr('text-anchor', 'middle')
      .style('font-size', '17px')
      .style('font-weight', '600')
      .style('fill', '#0f172a')
      .text('Évolution du nombre d\'épreuves masculines, féminines et mixtes');

    titleGroup.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .style('font-size', '17px')
      .style('font-weight', '600')
      .style('fill', '#0f172a')
      .text('aux Jeux Olympiques entre 1896 et 2024');
  }

  function onFilterChange() {
    renderChart();
  }

  const filterPanel = createFilterPanel(allDisciplines, winterDisciplines, summerDisciplines, state, onFilterChange);
  mainArea.appendChild(filterPanel);

  const legendContainer = createDomNode('div', 'viz2-legend-container');
  renderViz2Legend({ container: legendContainer });
  chartWrapper.appendChild(legendContainer);

  wrapper.append(mainArea);
  container.append(wrapper);

  renderChart();
}

/**
 * Crée le panneau de filtres pour la visualisation 2.
 * @param {string[]} allDisciplines
 * @param {string[]} winterDisciplines
 * @param {string[]} summerDisciplines
 * @param {object} state
 * @param {Function} onFilterChange
 * @returns {HTMLElement}
 */
function createFilterPanel(allDisciplines, winterDisciplines, summerDisciplines, state, onFilterChange) {
  const panel = createDomNode('div', 'viz2-filter-panel');

  const title = createDomNode('h4', 'filter-panel-title', 'Filtres');
  panel.appendChild(title);

  const searchWrapper = createDomNode('div', 'search-wrapper');
  const searchInput = createDomNode('input', 'discipline-search');
  searchInput.type = 'text';
  searchInput.placeholder = 'Discipline...';
  const searchIcon = createDomNode('span', 'search-icon', '🔍');
  searchWrapper.append(searchInput, searchIcon);
  panel.appendChild(searchWrapper);

  const seasonChecks = createDomNode('div', 'season-checks');

  const winterCheck = createDomNode('label', 'checkbox-label');
  const winterCheckbox = createDomNode('input');
  winterCheckbox.type = 'checkbox';
  winterCheckbox.className = 'season-checkbox';
  winterCheckbox.dataset.season = 'winter';
  winterCheck.append(winterCheckbox, ' Disciplines d\'hiver');

  const summerCheck = createDomNode('label', 'checkbox-label');
  const summerCheckbox = createDomNode('input');
  summerCheckbox.type = 'checkbox';
  summerCheckbox.className = 'season-checkbox';
  summerCheckbox.dataset.season = 'summer';
  summerCheck.append(summerCheckbox, ' Disciplines d\'été');

  seasonChecks.append(winterCheck, summerCheck);
  panel.appendChild(seasonChecks);

  const selectedHeader = createDomNode('div', 'selected-header');
  const selectedTitle = createDomNode('span', '', 'Sélectionnées');
  const countBadge = createDomNode('span', 'count-badge', '0');
  selectedHeader.append(selectedTitle, countBadge);
  panel.appendChild(selectedHeader);

  const selectedList = createDomNode('div', 'selected-list');
  panel.appendChild(selectedList);

  const suggestionsList = createDomNode('div', 'suggestions-list hidden');
  searchWrapper.appendChild(suggestionsList);

  const resetButton = createDomNode('button', 'reset-button', '↻ Réinitialiser');
  panel.appendChild(resetButton);

  let filteredDisciplines = [...allDisciplines];

  function updateSelectedDisplay() {
    selectedList.innerHTML = '';
    countBadge.textContent = String(state.selectedDisciplines.length);

    for (const discipline of state.selectedDisciplines) {
      const tag = createDomNode('div', 'discipline-tag');
      const name = createDomNode('span', '', discipline);
      const removeBtn = createDomNode('button', 'remove-btn', '×');

      removeBtn.addEventListener('click', () => {
        state.selectedDisciplines = state.selectedDisciplines.filter((d) => d !== discipline);
        updateSelectedDisplay();
        onFilterChange();
      });

      tag.append(name, removeBtn);
      selectedList.appendChild(tag);
    }
  }

  function updateSuggestions(query) {
    suggestionsList.innerHTML = '';

    if (!query) {
      suggestionsList.classList.add('hidden');
      return;
    }

    const matches = filteredDisciplines.filter(
      (d) => d.toLowerCase().includes(query.toLowerCase()) && !state.selectedDisciplines.includes(d)
    ).slice(0, 8);

    if (matches.length === 0) {
      suggestionsList.classList.add('hidden');
      return;
    }

    suggestionsList.classList.remove('hidden');

    for (const match of matches) {
      const item = createDomNode('div', 'suggestion-item', match);
      item.addEventListener('click', () => {
        state.selectedDisciplines = [...state.selectedDisciplines, match];
        searchInput.value = '';
        updateSelectedDisplay();
        updateSuggestions('');
        onFilterChange();
      });
      suggestionsList.appendChild(item);
    }
  }

  function updateSeasonFilter() {
    state.isWinterFilter = winterCheckbox.checked;
    state.isSummerFilter = summerCheckbox.checked;

    if (state.isWinterFilter && !state.isSummerFilter) {
      filteredDisciplines = [...winterDisciplines];
    } else if (state.isSummerFilter && !state.isWinterFilter) {
      filteredDisciplines = [...summerDisciplines];
    } else {
      filteredDisciplines = [...allDisciplines];
    }

    onFilterChange();
  }

  searchInput.addEventListener('input', (e) => {
    updateSuggestions(e.target.value.trim());
  });

  searchInput.addEventListener('focus', () => {
    updateSuggestions(searchInput.value.trim());
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target)) {
      suggestionsList.classList.add('hidden');
    }
  });

  winterCheckbox.addEventListener('change', () => {
    updateSeasonFilter();
    updateSuggestions(searchInput.value.trim());
  });

  summerCheckbox.addEventListener('change', () => {
    updateSeasonFilter();
    updateSuggestions(searchInput.value.trim());
  });

  resetButton.addEventListener('click', () => {
    state.selectedDisciplines = [];
    state.isWinterFilter = false;
    state.isSummerFilter = false;
    searchInput.value = '';
    winterCheckbox.checked = false;
    summerCheckbox.checked = false;
    filteredDisciplines = [...allDisciplines];
    updateSelectedDisplay();
    updateSuggestions('');
    onFilterChange();
  });

  updateSelectedDisplay();

  return panel;
}
