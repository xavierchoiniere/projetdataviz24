import * as d3 from 'd3';
import { SVG_DIMENSIONS, VIZ1_MODES } from '../config.js';
import { renderViz1Legend } from './viz1-legend.js';
import {
  buildDiversityTooltipHtml,
  buildPerformanceTooltipHtml,
  createViz1Tooltip
} from './viz1-tooltip.js';
import { clearNode, createDomNode } from '../helper.js';

const { margin: MARGIN } = SVG_DIMENSIONS.viz1;
const SVG_W = SVG_DIMENSIONS.viz1.width;
const SVG_H = SVG_DIMENSIONS.viz1.height;
const INNER_W = SVG_W - MARGIN.left - MARGIN.right;
const INNER_H = SVG_H - MARGIN.top - MARGIN.bottom;

export function renderViz1({ containerSelector = '#viz1-root', data = {} } = {}) {
  const container = clearNode(containerSelector);
  const { performanceData = [], diversityData = [] } = data;

  if (!performanceData.length && !diversityData.length) {
    container.append(
      createDomNode('p', '', 'Aucune donnée disponible pour les filtres sélectionnés.')
    );
    return;
  }

  const state = { mode: VIZ1_MODES.PERFORMANCE, saison: 'summer' };
  const tooltip = createViz1Tooltip();

  const wrapper = createDomNode('div', 'viz1-wrapper');

  const headerEl = buildHeader(state, (newSaison) => {
    state.saison = newSaison;
    updateToggleButtons(headerEl, '.viz1-toggle-btn', 'saison', newSaison);
    renderChart();
  });

  const chartRow = createDomNode('div', 'viz1-chart-row');
  const svgContainer = createDomNode('div', 'viz1-svg-container');
  const legendContainer = createDomNode('div', 'viz1-legend-panel');
  chartRow.append(svgContainer, legendContainer);

  const modeBar = buildModeBar(state, (newMode) => {
    state.mode = newMode;
    updateToggleButtons(modeBar, '.viz1-mode-btn', 'mode', newMode);
    renderLegend();
    renderChart();
  });

  wrapper.append(headerEl, chartRow, modeBar);
  container.append(wrapper);

  function renderLegend() {
    legendContainer.innerHTML = '';
    renderViz1Legend({
      container: legendContainer,
      mode: state.mode,
      performanceData,
      diversityData
    });
  }

  function renderChart() {
    svgContainer.innerHTML = '';
    if (state.mode === VIZ1_MODES.PERFORMANCE) {
      drawPerformanceChart(svgContainer, performanceData, state.saison, tooltip);
    } else {
      drawDiversityChart(svgContainer, diversityData, state.saison, tooltip);
    }
  }

  renderLegend();
  renderChart();
}

function buildHeader(state, onSaisonChange) {
  const header = createDomNode('div', 'viz1-header');
  const toggle = createDomNode('div', 'viz1-season-toggle');
  const SAISON_LABELS = { summer: 'Été', winter: 'Hiver' };
  for (const saison of ['summer', 'winter']) {
    const btn = createDomNode(
      'button',
      `viz1-toggle-btn${saison === state.saison ? ' active' : ''}`,
      SAISON_LABELS[saison]
    );
    btn.dataset.saison = saison;
    btn.addEventListener('click', () => onSaisonChange(saison));
    toggle.append(btn);
  }

  header.append(toggle);
  return header;
}

function buildModeBar(state, onModeChange) {
  const bar = createDomNode('div', 'viz1-mode-bar');

  const modes = [
    { mode: VIZ1_MODES.PERFORMANCE, label: 'NATIONS DOMINANTES' },
    { mode: VIZ1_MODES.DIVERSITY, label: 'GLOBALISATION DES JEUX' }
  ];

  for (const { mode, label } of modes) {
    const btn = createDomNode(
      'button',
      `viz1-mode-btn${mode === state.mode ? ' active' : ''}`,
      label
    );
    btn.dataset.mode = mode;
    btn.addEventListener('click', () => onModeChange(mode));
    bar.append(btn);
  }

  return bar;
}

function updateToggleButtons(parentEl, selector, dataKey, activeValue) {
  for (const btn of parentEl.querySelectorAll(selector)) {
    btn.classList.toggle('active', btn.dataset[dataKey] === activeValue);
  }
}

function drawPerformanceChart(container, performanceData, saison, tooltip) {
  const filtered = performanceData
    .map((country) => ({
      ...country,
      series: country.series.filter((pt) => pt.saison === saison)
    }))
    .filter((country) => country.series.length > 0);

  if (!filtered.length) {
    container.append(createDomNode('p', 'viz1-no-data', 'Aucune donnée pour cette saison.'));
    return;
  }

  const allYears = [...new Set(filtered.flatMap((c) => c.series.map((pt) => pt.year)))].sort(
    d3.ascending
  );
  const maxShare =
    d3.max(filtered.flatMap((c) => c.series.map((pt) => pt.share_pct))) ?? 100;

  const xScale = d3.scalePoint().domain(allYears).range([0, INNER_W]).padding(0.15);
  const yScale = d3
    .scaleLinear()
    .domain([0, Math.min(Math.ceil(maxShare * 1.15 / 5) * 5, 100)])
    .range([INNER_H, 0])
    .nice();

  const { svg, g } = buildSvg(container);

  g.append('text')
    .attr('class', 'viz1-chart-title')
    .attr('x', INNER_W / 2)
    .attr('y', -MARGIN.top / 2)
    .attr('text-anchor', 'middle')
    .text('Part des médailles par nation (%)');

  drawGrid(g, yScale, INNER_W);

  const lineGen = d3
    .line()
    .x((pt) => xScale(pt.year))
    .y((pt) => yScale(pt.share_pct))
    .curve(d3.curveMonotoneX);

  for (const country of filtered) {
    const isOthers = country.country_code === '__OTHERS__';
    const seriesG = g
      .append('g')
      .attr('class', `viz1-series`);

    seriesG
      .append('path')
      .datum(country.series)
      .attr('class', 'viz1-line')
      .attr('d', lineGen)
      .attr('stroke', country.color)
      .attr('stroke-width', isOthers ? 1.5 : 2.5)
      .attr('stroke-dasharray', isOthers ? '6,3' : null)
      .attr('fill', 'none')
      .attr('opacity', isOthers ? 0.55 : 1);

    const normalPoints = country.series.filter((pt) => !pt.is_host || isOthers);
    seriesG
      .selectAll('.viz1-dot')
      .data(normalPoints)
      .enter()
      .append('circle')
      .attr('class', 'viz1-dot')
      .attr('cx', (pt) => xScale(pt.year))
      .attr('cy', (pt) => yScale(pt.share_pct))
      .attr('r', 3.5)
      .attr('fill', country.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5)
      .attr('opacity', isOthers ? 0.45 : 1);

    if (!isOthers) {
      const hostPoints = country.series.filter((pt) => pt.is_host);

      seriesG
        .selectAll('.viz1-host-ring')
        .data(hostPoints)
        .enter()
        .append('circle')
        .attr('class', 'viz1-host-ring')
        .attr('cx', (pt) => xScale(pt.year))
        .attr('cy', (pt) => yScale(pt.share_pct))
        .attr('r', 7)
        .attr('fill', 'white')
        .attr('stroke', country.color)
        .attr('stroke-width', 2.5);

      seriesG
        .selectAll('.viz1-host-dot')
        .data(hostPoints)
        .enter()
        .append('circle')
        .attr('class', 'viz1-host-dot')
        .attr('cx', (pt) => xScale(pt.year))
        .attr('cy', (pt) => yScale(pt.share_pct))
        .attr('r', 3.5)
        .attr('fill', country.color);
    }
  }

  const yearDataMap = buildYearDataMap(filtered, 'performance');
  addHoverLayer(g, xScale, yScale, allYears, yearDataMap, tooltip, 'performance');
  drawAxes(g, xScale, yScale, INNER_H, (v) => `${d3.format('.0f')(v)}%`, 'Part des médailles (%)');

  void svg;
}

function drawDiversityChart(container, diversityData, saison, tooltip) {
  const filtered = diversityData
    .map((ms) => ({
      ...ms,
      series: ms.series.filter((pt) => pt.saison === saison)
    }))
    .filter((ms) => ms.series.length > 0);

  if (!filtered.length) {
    container.append(createDomNode('p', 'viz1-no-data', 'Aucune donnée pour cette saison.'));
    return;
  }

  const allYears = [...new Set(filtered.flatMap((ms) => ms.series.map((pt) => pt.year)))].sort(
    d3.ascending
  );
  const maxCount =
    d3.max(filtered.flatMap((ms) => ms.series.map((pt) => pt.country_count))) ?? 50;

  const xScale = d3.scalePoint().domain(allYears).range([0, INNER_W]).padding(0.15);
  const yScale = d3
    .scaleLinear()
    .domain([0, Math.ceil(maxCount * 1.15)])
    .range([INNER_H, 0])
    .nice();

  const { svg, g } = buildSvg(container);

  g.append('text')
    .attr('class', 'viz1-chart-title')
    .attr('x', INNER_W / 2)
    .attr('y', -MARGIN.top / 2)
    .attr('text-anchor', 'middle')
    .text('Évolution du nombre de pays médaillés');

  drawGrid(g, yScale, INNER_W);

  const lineGen = d3
    .line()
    .x((pt) => xScale(pt.year))
    .y((pt) => yScale(pt.country_count))
    .curve(d3.curveMonotoneX);

  for (const ms of filtered) {
    const seriesG = g.append('g').attr('class', 'viz1-series');

    seriesG
      .append('path')
      .datum(ms.series)
      .attr('class', 'viz1-line')
      .attr('d', lineGen)
      .attr('stroke', ms.color)
      .attr('stroke-width', 2.5)
      .attr('fill', 'none');

    seriesG
      .selectAll('.viz1-dot')
      .data(ms.series)
      .enter()
      .append('circle')
      .attr('class', 'viz1-dot')
      .attr('cx', (pt) => xScale(pt.year))
      .attr('cy', (pt) => yScale(pt.country_count))
      .attr('r', 3.5)
      .attr('fill', ms.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5);
  }

  const yearDataMap = buildYearDataMap(filtered, 'diversity');
  addHoverLayer(g, xScale, yScale, allYears, yearDataMap, tooltip, 'diversity');
  drawAxes(
    g,
    xScale,
    yScale,
    INNER_H,
    (v) => String(Math.round(v)),
    'Nombre de pays'
  );

  void svg;
}

function buildSvg(container) {
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', SVG_W)
    .attr('height', SVG_H)
    .attr('viewBox', `0 0 ${SVG_W} ${SVG_H}`)
    .attr('class', 'viz1-svg');

  const g = svg
    .append('g')
    .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  return { svg, g };
}

function drawGrid(g, yScale, innerW) {
  g.append('g')
    .attr('class', 'viz1-grid')
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerW).tickFormat(''))
    .call((gr) => gr.select('.domain').remove())
    .call((gr) =>
      gr
        .selectAll('line')
        .attr('stroke', 'rgba(148,163,184,0.2)')
        .attr('stroke-dasharray', '3,3')
    );
}

function drawAxes(g, xScale, yScale, innerH, yFormat, yLabel) {
  const allYears = xScale.domain();
  const step = allYears.length > 20 ? 4 : allYears.length > 12 ? 2 : 1;
  const tickYears = allYears.filter((_, i) => i % step === 0);

  g.append('g')
    .attr('class', 'viz1-axis viz1-x-axis')
    .attr('transform', `translate(0,${innerH})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickValues(tickYears)
        .tickFormat((d) => String(d))
    )
    .call((ax) => ax.select('.domain').remove())
    .call((ax) => ax.selectAll('line').remove())
    .call((ax) => ax.selectAll('text').attr('fill', '#64748b').style('font-size', '12px'));

  g.append('g')
    .attr('class', 'viz1-axis viz1-y-axis')
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(yFormat))
    .call((ax) => ax.select('.domain').remove())
    .call((ax) => ax.selectAll('line').remove())
    .call((ax) => ax.selectAll('text').attr('fill', '#64748b').style('font-size', '12px'));

  g.append('text')
    .attr('class', 'viz1-axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -INNER_H / 2)
    .attr('y', -56)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748b')
    .style('font-size', '12px')
    .text(yLabel);
}

function buildYearDataMap(seriesArray, chartType) {
  const map = new Map();

  for (const item of seriesArray) {
    const pts = chartType === 'performance' ? item.series : item.series;
    for (const pt of pts) {
      if (!map.has(pt.year)) map.set(pt.year, []);
      if (chartType === 'performance') {
        map.get(pt.year).push({ country: item, point: pt });
      } else {
        map.get(pt.year).push({ medalSeries: item, point: pt });
      }
    }
  }

  return map;
}

function addHoverLayer(g, xScale, yScale, allYears, yearDataMap, tooltip, chartType) {
  const hoverLine = g
    .append('line')
    .attr('class', 'viz1-hover-line')
    .attr('y1', 0)
    .attr('y2', INNER_H)
    .attr('stroke', '#334155')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,3')
    .attr('opacity', 0)
    .attr('pointer-events', 'none');

  const hoverDotsG = g.append('g').attr('class', 'viz1-hover-dots');

  g.append('rect')
    .attr('class', 'viz1-overlay')
    .attr('width', INNER_W)
    .attr('height', INNER_H)
    .attr('fill', 'transparent')
    .on('mousemove', (event) => {
      const [mx] = d3.pointer(event);
      const closestYear = findClosestYear(allYears, xScale, mx);
      const xPos = xScale(closestYear);

      hoverLine.attr('x1', xPos).attr('x2', xPos).attr('opacity', 1);

      hoverDotsG.selectAll('circle').remove();

      const items = yearDataMap.get(closestYear) ?? [];

      if (chartType === 'performance') {
        for (const { country, point } of items) {
          if (country.country_code === '__OTHERS__') continue;
          hoverDotsG
            .append('circle')
            .attr('cx', xScale(point.year))
            .attr('cy', yScale(point.share_pct))
            .attr('r', 5.5)
            .attr('fill', country.color)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('pointer-events', 'none');
        }

        const topItem = items
          .filter((it) => it.country.country_code !== '__OTHERS__')
          .sort((a, b) => b.point.share_pct - a.point.share_pct)[0];

        if (topItem) {
          tooltip.show(
            buildPerformanceTooltipHtml(topItem.point, topItem.country),
            event.clientX,
            event.clientY
          );
        }
      } else {
        for (const { medalSeries, point } of items) {
          hoverDotsG
            .append('circle')
            .attr('cx', xScale(point.year))
            .attr('cy', yScale(point.country_count))
            .attr('r', 5.5)
            .attr('fill', medalSeries.color)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('pointer-events', 'none');
        }

        if (items.length > 0) {
          tooltip.show(
            buildDiversityTooltipHtml(items[0].point, items),
            event.clientX,
            event.clientY
          );
        }
      }
    })
    .on('mouseleave', () => {
      hoverLine.attr('opacity', 0);
      hoverDotsG.selectAll('circle').remove();
      tooltip.hide();
    });
}

function findClosestYear(allYears, xScale, mouseX) {
  return allYears.reduce((prev, curr) =>
    Math.abs(xScale(curr) - mouseX) < Math.abs(xScale(prev) - mouseX) ? curr : prev
  );
}
