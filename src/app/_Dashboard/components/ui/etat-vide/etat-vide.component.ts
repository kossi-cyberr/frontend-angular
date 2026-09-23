import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Empty state réutilisable STOCK-HUB : icône, message, action optionnelle.
 * Utilisé dans les tableaux, listes et recherches sans résultat.
 */
@Component({
  selector: 'app-etat-vide',
  template: `
    <div class="flex flex-col items-center gap-2 py-10 text-center">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-base-200">
        <i-lucide [name]="icone" size="22" class="text-base-content/40"></i-lucide>
      </div>
      <p class="mb-0 text-sm font-medium text-base-content/70">{{ message }}</p>
      <p class="mb-0 text-xs text-base-content/50" *ngIf="detail">{{ detail }}</p>
      <button type="button" class="btn btn-outline btn-sm mt-2" *ngIf="actionLibelle" (click)="action.emit()">
        <i-lucide [name]="actionIcone" size="14"></i-lucide>
        {{ actionLibelle }}
      </button>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class EtatVideComponent {

  @Input() message = 'Aucune donnée';
  @Input() detail = '';
  @Input() icone = 'inbox';

  @Input() actionLibelle = '';
  @Input() actionIcone = 'plus';

  @Output() action = new EventEmitter<void>();
}
