/**
 * Tooltip de la visualisation 3.
 *
 * TODO :
 * - réutiliser ce tooltip sur les marks line et bubble finaux
 */

import { createDomNode } from '../helper.js';

const TOOLTIP_ID = 'viz3-tooltip';

/**
 * Crée ou retourne le tooltip dédié à la visualisation 3.
 * @returns {{ node: HTMLElement, show: (html: string, x: number, y: number) => void, hide: () => void }}
 */
export function createViz3Tooltip() {
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
