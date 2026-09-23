import { Component, Input } from '@angular/core';

/**
 * Squelette de chargement réutilisable : bloc unique ou lignes de
 * contenu, à afficher pendant les requêtes (jamais de spinner figé).
 */
@Component({
  selector: 'app-squelette',
  template: `
    <div class="space-y-2" aria-busy="true" aria-live="polite">
      <div *ngFor="let l of lignesAffichees" class="skeleton h-4"
           [style.width.%]="l"></div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class SqueletteComponent {

  /** Nombre de lignes simulées. */
  @Input() lignes = 3;

  /** Largeurs décroissantes pour un rendu naturel. */
  get lignesAffichees(): number[] {
    const largeurs = [100, 92, 96, 78, 88, 70, 94, 82];
    return Array.from({ length: Math.max(1, this.lignes) }, (_, i) => largeurs[i % largeurs.length]);
  }
}
