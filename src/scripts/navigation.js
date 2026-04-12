/**
 * Module de navigation.
 *
 * Rôle actuel :
 * - générer une barre de navigation locale basée sur les sections du document
 *
 * TODO :
 * - ajouter une logique d'état actif liée au scroll
 * - synchroniser la navigation avec les filtres / états de vue si nécessaire
 */

import { clearNode, createDomNode } from './helper.js';

/**
 * Construit la navigation principale à partir des sections annotées.
 * @param {string|HTMLElement} containerSelector
 * @returns {{ destroy: () => void }}
 */
export function createNavigation(containerSelector = '#navigation-root') {
  const container = clearNode(containerSelector);
  const sections = [...document.querySelectorAll('[data-nav-title]')];

  for (const section of sections) {
    const label = section.dataset.navTitle ?? section.id;
    const button = createDomNode('button', 'button', label);

    button.addEventListener('click', () => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    container.append(button);
  }

  return {
    destroy() {
      container.innerHTML = '';
    }
  };
}
