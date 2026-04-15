/**
 * Sous-composant bubble de la visualisation 3.
 *
 * Affiche la relation athlètes participants ↔ médailles par pays / édition.
 * - Taille des bulles : nombre total de médailles
 * - Couleur : continent
 * - Frise chronologique interactive pour filtrer l'année affichée
 * - Tooltip riche au survol
 */

import * as d3 from 'd3';
import { SVG_DIMENSIONS, CONTINENT_COLORS } from '../config.js';
import { createViz3BubbleTooltip } from './viz3-tooltip.js';
import { renderViz3Legend } from './viz3-legend.js';
import { clearNode, createDomNode, formatInteger } from '../helper.js';

const DIM = SVG_DIMENSIONS.viz3Bubble;
const INNER_W = DIM.width - DIM.margin.left - DIM.margin.right;
const INNER_H = DIM.height - DIM.margin.top - DIM.margin.bottom;

const TIMELINE_H = 60;
const CHART_H = INNER_H - TIMELINE_H - 20;

/**
 * Rend le bubble chart de la viz 3.
 * @param {{ containerSelector?: string|HTMLElement, data?: Array<Record<string, unknown>> }} payload
 */
export function renderViz3Bubble({ containerSelector = '#viz3-bubble-root', data = [] } = {}) {
  const container = clearNode(containerSelector);

  if (!data.length) {
    container.append(createDomNode('p', 'viz3-no-data', 'Aucune donnée disponible.'));
    return;
  }

  const state = { saison: 'summer', year: null };

  const wrapper = createDomNode('div', 'viz3-bubble-wrapper');
  const tooltip = createViz3BubbleTooltip();

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
      state.year = null;
      seasonToggle.querySelectorAll('.viz3-toggle-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.saison === saison);
      });
      renderChart();
    });
    seasonToggle.append(btn);
  }

  controls.append(seasonToggle);
  wrapper.append(controls);

  const chartRow = createDomNode('div', 'viz3-bubble-row');
  const svgContainer = createDomNode('div', 'viz3-svg-container');
  const legendContainer = createDomNode('div', 'viz3-bubble-legend');

  renderViz3Legend({ container: legendContainer });

  chartRow.append(svgContainer, legendContainer);
  wrapper.append(chartRow);
  container.append(wrapper);

  function renderChart() {
    const saisonData = data.filter((d) => d.saison === state.saison);
    const allYears = [...new Set(saisonData.map((d) => Number(d.year)))].sort(d3.ascending);
    if (!state.year || !allYears.includes(state.year)) {
      state.year = allYears[allYears.length - 1] ?? null;
    }
    svgContainer.innerHTML = '';
    if (!saisonData.length) {
      svgContainer.append(createDomNode('p', 'viz3-no-data', 'Aucune donnée pour cette saison.'));
      return;
    }
    drawBubbleChart(svgContainer, saisonData, allYears, state, tooltip);
  }

  renderChart();

  wrapper._setState = (newState) => {
    Object.assign(state, newState);
    renderChart();
  };
}

function drawBubbleChart(container, data, allYears, state, tooltip) {
  const yearData = data.filter((d) => Number(d.year) === state.year);

  const maxAthletes = d3.max(data, (d) => Number(d.nb_athletes)) ?? 1000;
  const maxMedals   = d3.max(data, (d) => Number(d.medals_total)) ?? 100;
  const maxBubble   = d3.max(data, (d) => Number(d.nb_athletes)) ?? 1000;

  const xScale = d3.scaleLinear()
    .domain([0, maxAthletes * 1.05])
    .range([0, INNER_W])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, maxMedals * 1.1])
    .range([CHART_H, 0])
    .nice();

  const rScale = d3.scaleSqrt()
    .domain([0, maxBubble])
    .range([3, 36]);

  const colorScale = (continent) => CONTINENT_COLORS[continent] ?? '#9C755F';

  const svg = d3.select(container)
    .append('svg')
    .attr('width', DIM.width)
    .attr('height', DIM.height)
    .attr('viewBox', `0 0 ${DIM.width} ${DIM.height}`)
    .attr('class', 'viz3-bubble-svg');

  svg.append('text')
    .attr('x', DIM.margin.left + INNER_W / 2)
    .attr('y', 28)
    .attr('text-anchor', 'middle')
    .attr('class', 'viz3-chart-title')
    .text('Participation des athlètes vs nombre de médailles par pays');

  const g = svg.append('g')
    .attr('transform', `translate(${DIM.margin.left},${DIM.margin.top})`);

  g.append('g')
    .attr('class', 'viz3-grid')
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-INNER_W).tickFormat(''))
    .call((gr) => gr.select('.domain').remove())
    .call((gr) => gr.selectAll('line')
      .attr('stroke', 'rgba(148,163,184,0.18)')
      .attr('stroke-dasharray', '3,3'));

  g.append('g')
    .attr('class', 'viz3-grid')
    .attr('transform', `translate(0,${CHART_H})`)
    .call(d3.axisBottom(xScale).ticks(5).tickSize(-CHART_H).tickFormat(''))
    .call((gr) => gr.select('.domain').remove())
    .call((gr) => gr.selectAll('line')
      .attr('stroke', 'rgba(148,163,184,0.18)')
      .attr('stroke-dasharray', '3,3'));

  const bubblesG = g.append('g').attr('class', 'viz3-bubbles');

  const circles = bubblesG.selectAll('circle')
    .data(yearData, (d) => d.country_code)
    .enter()
    .append('circle')
    .attr('cx', (d) => xScale(Number(d.nb_athletes)))
    .attr('cy', (d) => yScale(Number(d.medals_total)))
    .attr('r', (d) => rScale(Number(d.nb_athletes)))
    .attr('fill', (d) => colorScale(d.continent))
    .attr('fill-opacity', 0.72)
    .attr('stroke', (d) => colorScale(d.continent))
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.9)
    .attr('class', 'viz3-bubble')
    .style('cursor', 'pointer');

  circles
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('fill-opacity', 0.95)
        .attr('stroke-width', 2.5);
      tooltip.show(buildBubbleTooltipHtml(d), event.clientX, event.clientY);
    })
    .on('mousemove', (event) => {
      tooltip.move(event.clientX, event.clientY);
    })
    .on('mouseleave', function() {
      d3.select(this)
        .attr('fill-opacity', 0.72)
        .attr('stroke-width', 1.5);
      tooltip.hide();
    });

  g.append('g')
    .attr('class', 'viz3-axis viz3-x-axis')
    .attr('transform', `translate(0,${CHART_H})`)
    .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format(',.0f')))
    .call((ax) => ax.select('.domain').remove())
    .call((ax) => ax.selectAll('line').remove())
    .call((ax) => ax.selectAll('text').attr('fill', '#64748b').style('font-size', '11px'));

  g.append('g')
    .attr('class', 'viz3-axis viz3-y-axis')
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('d')))
    .call((ax) => ax.select('.domain').remove())
    .call((ax) => ax.selectAll('line').remove())
    .call((ax) => ax.selectAll('text').attr('fill', '#64748b').style('font-size', '11px'));

  g.append('text')
    .attr('x', INNER_W / 2)
    .attr('y', CHART_H + 38)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748b')
    .style('font-size', '11px')
    .text('Athlètes participants');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -CHART_H / 2)
    .attr('y', -58)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748b')
    .style('font-size', '11px')
    .text('Nombre de médailles');

  drawTimeline(g, allYears, state, CHART_H + 52, () => {
    const newYearData = data.filter((d) => Number(d.year) === state.year);

    bubblesG.selectAll('circle')
      .data(newYearData, (d) => d.country_code)
      .join(
        (enter) => enter.append('circle')
          .attr('cx', (d) => xScale(Number(d.nb_athletes)))
          .attr('cy', (d) => yScale(Number(d.medals_total)))
          .attr('r', 0)
          .attr('fill', (d) => colorScale(d.continent))
          .attr('fill-opacity', 0.72)
          .attr('stroke', (d) => colorScale(d.continent))
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.9)
          .attr('class', 'viz3-bubble')
          .style('cursor', 'pointer')
          .call((sel) => sel.transition().duration(350)
            .attr('r', (d) => rScale(Number(d.nb_athletes))))
          .call(attachBubbleHover),
        (update) => update
          .call((sel) => sel.transition().duration(350)
            .attr('cx', (d) => xScale(Number(d.nb_athletes)))
            .attr('cy', (d) => yScale(Number(d.medals_total)))
            .attr('r', (d) => rScale(Number(d.nb_athletes))))
          .call(attachBubbleHover),
        (exit) => exit.transition().duration(200).attr('r', 0).remove()
      );

  });

  function attachBubbleHover(selection) {
    selection
      .on('mouseover', function(event, d) {
        d3.select(this).attr('fill-opacity', 0.95).attr('stroke-width', 2.5);
        tooltip.show(buildBubbleTooltipHtml(d), event.clientX, event.clientY);
      })
      .on('mousemove', (event) => tooltip.move(event.clientX, event.clientY))
      .on('mouseleave', function() {
        d3.select(this).attr('fill-opacity', 0.72).attr('stroke-width', 1.5);
        tooltip.hide();
      });
  }
}

function drawTimeline(g, allYears, state, yOffset, onYearChange) {
  const tlWidth = INNER_W;
  const tlHeight = TIMELINE_H - 10;

  const tlScale = d3.scalePoint()
    .domain(allYears)
    .range([0, tlWidth])
    .padding(0.1);

  const tlG = g.append('g')
    .attr('class', 'viz3-timeline')
    .attr('transform', `translate(0,${yOffset})`);

  tlG.append('rect')
    .attr('x', 0).attr('y', tlHeight / 2 - 1)
    .attr('width', tlWidth).attr('height', 2)
    .attr('fill', 'rgba(148,163,184,0.3)')
    .attr('rx', 1);

  tlG.selectAll('.tl-tick')
    .data(allYears)
    .enter()
    .append('line')
    .attr('class', 'tl-tick')
    .attr('x1', (y) => tlScale(y))
    .attr('x2', (y) => tlScale(y))
    .attr('y1', tlHeight / 2 - 5)
    .attr('y2', tlHeight / 2 + 5)
    .attr('stroke', 'rgba(148,163,184,0.5)')
    .attr('stroke-width', 1);

  const step = allYears.length > 30 ? 8 : allYears.length > 20 ? 4 : 2;
  tlG.selectAll('.tl-label')
    .data(allYears.filter((_, i) => i % step === 0))
    .enter()
    .append('text')
    .attr('class', 'tl-label')
    .attr('x', (y) => tlScale(y))
    .attr('y', tlHeight - 2)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748b')
    .style('font-size', '10px')
    .text(String);

  const indicator = tlG.append('g')
    .attr('class', 'tl-indicator')
    .attr('transform', `translate(${tlScale(state.year)},${tlHeight / 2})`);

  indicator.append('circle')
    .attr('r', 7)
    .attr('fill', '#3b82f6')
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('cursor', 'ew-resize');

  const yearLabel = indicator.append('text')
    .attr('y', -12)
    .attr('text-anchor', 'middle')
    .attr('fill', '#3b82f6')
    .style('font-size', '11px')
    .style('font-weight', '600')
    .text(state.year);

  function updateIndicator(year) {
    indicator.transition().duration(150)
      .attr('transform', `translate(${tlScale(year)},${tlHeight / 2})`);
    yearLabel.text(year);
  }

  tlG.append('rect')
    .attr('x', 0).attr('y', 0)
    .attr('width', tlWidth).attr('height', tlHeight)
    .attr('fill', 'transparent')
    .style('cursor', 'pointer')
    .on('click', function(event) {
      const [mx] = d3.pointer(event);
      const closest = allYears.reduce((prev, curr) =>
        Math.abs(tlScale(curr) - mx) < Math.abs(tlScale(prev) - mx) ? curr : prev
      );
      if (closest !== state.year) {
        state.year = closest;
        updateIndicator(closest);
        onYearChange();
      }
    });

  const drag = d3.drag()
    .on('drag', function(event) {
      const mx = Math.max(0, Math.min(INNER_W, event.x));
      const closest = allYears.reduce((prev, curr) =>
        Math.abs(tlScale(curr) - mx) < Math.abs(tlScale(prev) - mx) ? curr : prev
      );
      if (closest !== state.year) {
        state.year = closest;
        updateIndicator(closest);
        onYearChange();
      }
    });

  indicator.call(drag);
}

function buildBubbleTooltipHtml(d) {
  const medal = (emoji, count) => count > 0
    ? `<span class="viz3-tt-medal">${emoji} <strong>${count}</strong></span>`
    : '';

  return `
    <div class="viz3-tooltip-header">
      <span class="viz3-tt-year">${d.year}</span>
      <span class="viz3-tt-saison">${d.saison === 'summer' ? 'Été' : 'Hiver'}</span>
    </div>
    <div class="viz3-tt-country">
      <span class="viz3-tt-swatch" style="background:${CONTINENT_COLORS[d.continent] ?? '#9C755F'}"></span>
      <strong>${d.country ?? d.country_code}</strong>
      ${d.is_host ? '<span class="viz3-tt-host-badge">Hôte</span>' : ''}
    </div>
    <div class="viz3-tt-body">
      <div class="viz3-tt-row">
        <span class="viz3-tt-label">Athlètes</span>
        <span class="viz3-tt-value">${formatInteger(Number(d.nb_athletes))}</span>
      </div>
      <div class="viz3-tt-row">
        <span class="viz3-tt-label">Médailles</span>
        <span class="viz3-tt-value">${formatInteger(Number(d.medals_total))}</span>
      </div>
      <div class="viz3-tt-medals-row">
        ${medal('🥇', d.gold)} ${medal('🥈', d.silver)} ${medal('🥉', d.bronze)}
      </div>
      ${Number(d.medals_total) > 0 ? `
      <div class="viz3-tt-row">
        <span class="viz3-tt-label">Méd./athlète</span>
        <span class="viz3-tt-value">${Number(d.medals_per_athlete).toFixed(3)}</span>
      </div>` : ''}
    </div>
  `;
}
