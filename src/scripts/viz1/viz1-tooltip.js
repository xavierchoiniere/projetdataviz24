/**
 * Tooltip de la visualisation 1.
 *
 * TODO :
 * - brancher show/hide/move sur les marks de la vraie visualisation D3
 * - enrichir le contenu selon les besoins d'interaction
 */

import { createDomNode } from '../helper.js';

const TOOLTIP_ID = 'viz1-tooltip';

/**
 * Crée ou retourne le tooltip dédié à la visualisation 1.
 * @returns {{ node: HTMLElement, show: (html: string, x: number, y: number) => void, hide: () => void }}
 */
export function createViz1Tooltip() {
  let tooltipNode = document.getElementById(TOOLTIP_ID);

  if (!tooltipNode) {
    tooltipNode = createDomNode('div', 'tooltip hidden');
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
