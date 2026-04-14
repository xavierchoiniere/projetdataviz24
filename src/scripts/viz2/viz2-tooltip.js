/**
 * Tooltip de la visualisation 2.
 *
 * Affiche les informations détaillées au survol des barres,
 * incluant le nombre d'épreuves et les jalons historiques.
 */

import { GENDER_COLORS } from '../config.js';
import { createDomNode, formatInteger } from '../helper.js';

const TOOLTIP_ID = 'viz2-tooltip';

const GENDER_LABELS = {
  masculine: 'Épreuves masculines',
  feminine: 'Épreuves féminines',
  mixed: 'Épreuves mixtes'
};

const GENDER_KEYS = {
  masculine: 'masculine',
  feminine: 'feminine',
  mixed: 'mixed'
};

/**
 * Crée ou retourne le tooltip dédié à la visualisation 2.
 * @returns {{ node: HTMLElement, show: (html: string, x: number, y: number) => void, hide: () => void }}
 */
export function createViz2Tooltip() {
  let tooltipNode = document.getElementById(TOOLTIP_ID);

  if (!tooltipNode) {
    tooltipNode = createDomNode('div', 'tooltip viz2-tooltip hidden');
    tooltipNode.id = TOOLTIP_ID;
    document.body.append(tooltipNode);
  }

  return {
    node: tooltipNode,

    show(html, x, y) {
      tooltipNode.innerHTML = html;
      tooltipNode.style.left = `${x + 12}px`;
      tooltipNode.style.top = `${y + 12}px`;
      tooltipNode.classList.remove('hidden');
    },

    hide() {
      tooltipNode.classList.add('hidden');
    }
  };
}

/**
 * Affiche le tooltip avec les informations de l'année survolée.
 * @param {{ node: HTMLElement, show: Function }} tooltip
 * @param {{ year: number, masculine: number, feminine: number, mixed: number }} data
 * @param {string} genderCategory - 'masculine', 'feminine', ou 'mixed'
 * @param {MouseEvent} event
 * @param {string[]} milestones
 */
export function showTooltip(tooltip, data, genderCategory, event, milestones) {
  const total = data.masculine + data.feminine + data.mixed;
  const genderValue = data[GENDER_KEYS[genderCategory]];
  const genderLabel = GENDER_LABELS[genderCategory];

  let html = `
    <div class="tooltip-header">
      <span class="tooltip-year">${data.year}</span>
    </div>
    <div class="tooltip-section">
      <div class="tooltip-row tooltip-highlight">
        <span class="tooltip-gender-indicator" style="background-color: ${getGenderColor(genderCategory)}"></span>
        <span class="tooltip-label">${genderLabel}:</span>
        <span class="tooltip-value">${formatInteger(genderValue)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Total épreuves:</span>
        <span class="tooltip-value">${formatInteger(total)}</span>
      </div>
    </div>
  `;

  if (milestones && milestones.length > 0) {
    html += `
      <div class="tooltip-section tooltip-milestones">
        <div class="tooltip-section-title">Jalons historiques:</div>
        ${milestones.map((m) => `
          <div class="milestone-item">
            <span class="milestone-icon">◆</span>
            <span>${escapeHtml(m)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (data.feminine === 0 && data.mixed === 0) {
    html += `
      <div class="tooltip-note">
        Édition sans épreuves féminines
      </div>
    `;
  }

  tooltip.show(html, event.clientX, event.clientY);
}

/**
 * Masque le tooltip.
 * @param {{ hide: Function }} tooltip
 */
export function hideTooltip(tooltip) {
  tooltip.hide();
}

/**
 * Retourne la couleur associée à une catégorie de genre.
 * @param {string} genderCategory
 * @returns {string}
 */
function getGenderColor(genderCategory) {
  const colorMap = {
    masculine: GENDER_COLORS.Men,
    feminine: GENDER_COLORS.Women,
    mixed: GENDER_COLORS.Mixed
  };

  return colorMap[genderCategory] || '#94a3b8';
}

/**
 * Échappe les caractères HTML spéciaux.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';

  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
