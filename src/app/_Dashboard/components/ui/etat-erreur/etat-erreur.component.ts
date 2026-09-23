import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * État d'erreur API réutilisable : message + bouton « Réessayer ».
 * Standardise la gestion des échecs de chargement dans tous les écrans.
 */
@Component({
  selector: 'app-etat-erreur',
  template: `
    <div class="flex flex-col items-center gap-3 py-10 text-center">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
        <i-lucide name="alert-triangle" size="22" class="text-error"></i-lucide>
      </div>
      <div>
        <p class="mb-0 text-sm font-medium">{{ message }}</p>
        <p class="mb-0 text-xs text-base-content/50" *ngIf="detail">{{ detail }}</p>
      </div>
      <button type="button" class="btn btn-outline btn-sm" (click)="reessayer.emit()">
        <i-lucide name="refresh-cw" size="14"></i-lucide>
        Réessayer
      </button>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class EtatErreurComponent {

  @Input() message = 'Impossible de charger les données.';
  @Input() detail = '';

  @Output() reessayer = new EventEmitter<void>();
}
