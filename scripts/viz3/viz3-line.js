/**
 * Sous-composant line de la visualisation 3.
 *
 * Affiche l'évolution temporelle de trois séries :
 *  - Nombre d'épreuves
 *  - Nombre de disciplines
 *  - Nombre de pays participants
 *
 * Interactivité :
 *  - Toggle saison (été / hiver / tout)
 *  - Toggle visibilité des séries (épreuves / disciplines / pays)
 *  - Hover : tooltip avec valeurs + âge moyen (si disponible)
 *  - Ligne verticale de survol
 */

import * as d3 from 'd3';
import { SVG_DIMENSIONS } from '../config.js';
import { createViz3LineTooltip } from './viz3-tooltip.js';
import { clearNode, createDomNode } from '../helper.js';

const DIM = SVG_DIMENSIONS.viz3Line;
const INNER_W = DIM.width - DIM.margin.left - DIM.margin.right;
const INNER_H = DIM.height - DIM.margin.top - DIM.margin.bottom;

const SERIES = [
  { key: 'nb_events',      label: 'Épreuves',    color: '#3b82f6', dash: null },
  { key: 'nb_disciplines', label: 'Disciplines',  color: '#f59e0b', dash: '6,3' },
  { key: 'nb_countries',   label: 'Pays',         color: '#10b981', dash: '2,4' }
];

/**
 * Rend le line chart de la viz 3.
 * @param {{ containerSelector?: string|HTMLElement, data?: Array<Record<string, unknown>> }} payload
 */
export function renderViz3Line({ containerSelector = '#viz3-line-root', data = [] } = {}) {
  const container = clearNode(containerSelector);

  if (!data.length) {
    container.append(createDomNode('p', 'viz3-no-data', 'Aucune donnée disponible.'));
    return;
  }

  const state = {
    saison: 'summer',
    visible: { nb_events: true, nb_disciplines: true, nb_countries: true }
  };

  const wrapper = createDomNode('div', 'viz3-line-wrapper');
  const tooltip = createViz3LineTooltip();

  const controls = createDomNode('div', 'viz3-line-controls');

  const seasonToggle = createDomNode('div', 'viz3-season-toggle');
  const SEASON_LABELS = { summer: 'Été', winter: 'Hiver' };
  for (const saison of ['summer', 'winter']) {
    const btn = createDomNode(
      'button',
      `viz3-toggle-btn${saison === state.saison ? ' active' : ''}`,
      SEASON_LABELS[saison]
    );
    btn.dataset.saison = saison;
    btn.addEventListener('click', () => {
      state.saison = saison;
      seasonToggle.querySelectorAll('.viz3-toggle-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.saison === saison);
      });
      renderChart();
    });
    seasonToggle.append(btn);
  }

  const seriesToggle = createDomNode('div', 'viz3-series-toggle');
  for (const s of SERIES) {
    const btn = createDomNode('button', 'viz3-series-btn active', s.label);
    btn.dataset.key = s.key;
    btn.style.setProperty('--series-color', s.color);
    btn.addEventListener('click', () => {
      state.visible[s.key] = !state.visible[s.key];
      btn.classList.toggle('active', state.visible[s.key]);
      renderChart();
    });
    seriesToggle.append(btn);
  }

  controls.append(seasonToggle, seriesToggle);
  wrapper.append(controls);

  const svgContainer = createDomNode('div', 'viz3-svg-container');
  wrapper.append(svgContainer);
  container.append(wrapper);

  function renderChart() {
    svgContainer.innerHTML = '';
    drawLineChart(svgContainer, data, state, tooltip);
  }

  renderChart();
}

function drawLineChart(container, data, state, tooltip) {
  const filtered = state.saison === 'all'
    ? data
    : data.filter((d) => d.saison === state.saison);

  if (!filtered.length) {
    container.append(createDomNode('p', 'viz3-no-data', 'Aucune donnée pour cette saison.'));
    return;
  }

  const years = filtered.map((d) => Number(d.year)).sort(d3.ascending);

  const xScale = d3.scalePoint()
    .domain(years)
    .range([0, INNER_W])
    .padding(0.1);

  const maxY = d3.max(filtered.flatMap((d) => [
    state.visible.nb_events ? Number(d.nb_events) : 0,
    state.visible.nb_disciplines ? Number(d.nb_disciplines) : 0,
    state.visible.nb_countries ? Number(d.nb_countries) : 0
  ])) ?? 0;

  const yLeft = d3.scaleLinear()
    .domain([0, Math.ceil(maxY * 1.15) || 10])
    .range([INNER_H, 0])
    .nice();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', DIM.width)
    .attr('height', DIM.height)
    .attr('viewBox', `0 0 ${DIM.width} ${DIM.height}`)
    .attr('class', 'viz3-line-svg');

  svg.append('text')
    .attr('x', DIM.margin.left + INNER_W / 2)
    .attr('y', 28)
    .attr('text-anchor', 'middle')
    .attr('class', 'viz3-chart-title')
    .text('Évolution des Jeux Olympiques : pays, disciplines et épreuves (1896–2024)');

  const g = svg.append('g')
    .attr('transform', `translate(${DIM.margin.left},${DIM.margin.top})`);

  g.append('g')
    .attr('class', 'viz3-grid')
    .call(d3.axisLeft(yLeft).ticks(5).tickSize(-INNER_W).tickFormat(''))
    .call((gr) => gr.select('.domain').remove())
    .call((gr) => gr.selectAll('line')
      .attr('stroke', 'rgba(148,163,184,0.18)')
      .attr('stroke-dasharray', '3,3'));

  for (const s of SERIES) {
    if (!state.visible[s.key]) continue;

    const yScale = yLeft;

    const lineGen = d3.line()
      .x((d) => xScale(Number(d.year)))
      .y((d) => yScale(Number(d[s.key])))
      .curve(d3.curveMonotoneX)
      .defined((d) => Number(d[s.key]) > 0);

    g.append('path')
      .datum(filtered)
      .attr('class', 'viz3-line')
      .attr('d', lineGen)
      .attr('stroke', s.color)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', s.dash ?? null)
      .attr('fill', 'none');

    g.selectAll(`.viz3-dot-${s.key}`)
      .data(filtered.filter((d) => Number(d[s.key]) > 0))
      .enter()
      .append('circle')
      .attr('class', `viz3-dot-${s.key}`)
      .attr('cx', (d) => xScale(Number(d.year)))
      .attr('cy', (d) => yScale(Number(d[s.key])))
      .attr('r', 3)
      .attr('fill', s.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5);
  }

  const step = years.length > 25 ? 8 : years.length > 15 ? 4 : 2;
  const tickYears = years.filter((_, i) => i % step === 0);

  g.append('g')
    .attr('class', 'viz3-axis viz3-x-axis')
    .attr('transform', `translate(0,${INNER_H})`)
    .call(d3.axisBottom(xScale).tickValues(tickYears).tickFormat(String))
    .call((ax) => ax.select('.domain').remove())
    .call((ax) => ax.selectAll('line').remove())
    .call((ax) => ax.selectAll('text').attr('fill', '#64748b').style('font-size', '11px'));

  g.append('g')
    .attr('class', 'viz3-axis viz3-y-axis-left')
    .call(d3.axisLeft(yLeft).ticks(5).tickFormat(d3.format('d')))
    .call((ax) => ax.select('.domain').remove())
    .call((ax) => ax.selectAll('line').remove())
    .call((ax) => ax.selectAll('text').attr('fill', '#64748b').style('font-size', '11px'));

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -INNER_H / 2)
    .attr('y', -58)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748b')
    .style('font-size', '11px')
    .text('Nombre d\'Épreuves / Disciplines / Pays');

  const hoverLine = g.append('line')
    .attr('class', 'viz3-hover-line')
    .attr('y1', 0).attr('y2', INNER_H)
    .attr('stroke', '#334155')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,3')
    .attr('opacity', 0)
    .attr('pointer-events', 'none');

  const hoverDotsG = g.append('g').attr('class', 'viz3-hover-dots');

  g.append('rect')
    .attr('width', INNER_W)
    .attr('height', INNER_H)
    .attr('fill', 'transparent')
    .on('mousemove', (event) => {
      const [mx] = d3.pointer(event);
      const closest = years.reduce((prev, curr) =>
        Math.abs(xScale(curr) - mx) < Math.abs(xScale(prev) - mx) ? curr : prev
      );
      const d = filtered.find((r) => Number(r.year) === closest);
      if (!d) return;

      const xPos = xScale(closest);
      hoverLine.attr('x1', xPos).attr('x2', xPos).attr('opacity', 1);
      hoverDotsG.selectAll('circle').remove();

      for (const s of SERIES) {
        if (!state.visible[s.key] || !Number(d[s.key])) continue;
        const yScale = yLeft;
        hoverDotsG.append('circle')
          .attr('cx', xPos)
          .attr('cy', yScale(Number(d[s.key])))
          .attr('r', 5.5)
          .attr('fill', s.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .attr('pointer-events', 'none');
      }

      tooltip.show(buildLineTooltipHtml(d, state), event.clientX, event.clientY);
    })
    .on('mouseleave', () => {
      hoverLine.attr('opacity', 0);
      hoverDotsG.selectAll('circle').remove();
      tooltip.hide();
    });
}

function buildLineTooltipHtml(d, state) {
  const rows = SERIES
    .filter((s) => state.visible[s.key] && Number(d[s.key]) > 0)
    .map((s) =>
      `<div class="viz3-tt-row">
        <span class="viz3-tt-swatch" style="background:${s.color}"></span>
        <span class="viz3-tt-label">${s.label}</span>
        <span class="viz3-tt-value">${Number(d[s.key]).toLocaleString('fr-CA')}</span>
      </div>`
    )
    .join('');

  const saisonLabel = d.saison === 'summer' ? 'Été' : d.saison === 'winter' ? 'Hiver' : '';

  return `
    <div class="viz3-tooltip-header">
      <span class="viz3-tt-year">${d.year}</span>
      ${saisonLabel ? `<span class="viz3-tt-saison">${saisonLabel}</span>` : ''}
    </div>
    ${d.host_city ? `<div class="viz3-tt-host">${d.host_city}</div>` : ''}
    <div class="viz3-tt-body">${rows}</div>
  `;
}
