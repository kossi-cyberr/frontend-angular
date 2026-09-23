import { Component, Input } from '@angular/core';

export type EtatStock = 'ok' | 'bas' | 'rupture';
export type StatutWorkflow =
  | 'EN_PREPARATION' | 'VALIDEE' | 'LIVREE' | 'ANNULEE'
  | 'BROUILLON' | 'EN_ATTENTE';

/**
 * Badge de statut métier STOCK-HUB : états de stock (🟢 ok, 🟠 bas,
 * 🔴 rupture) et statuts de workflow des commandes. Un seul composant
 * garantit la même lecture visuelle dans tous les tableaux et détails.
 */
@Component({
  selector: 'app-badge-statut',
  template: `
    <span class="badge-statut" [ngClass]="classes">
      <span class="puce-statut" [ngClass]="couleurPuce" *ngIf="avecPuce"></span>
      {{ libelle }}
    </span>
  `,
  styles: [':host { display: inline-flex; }']
})
export class BadgeStatutComponent {

  /** Type d'état : stock ou statut de commande. */
  @Input() etat: EtatStock | StatutWorkflow = 'ok';

  /** Affiche la puce colorée devant le libellé. */
  @Input() avecPuce = true;

  private readonly LIBELLES: Record<string, string> = {
    'ok': 'Stock normal',
    'bas': 'Stock faible',
    'rupture': 'Rupture',
    'EN_PREPARATION': 'En préparation',
    'VALIDEE': 'Validée',
    'LIVREE': 'Livrée',
    'ANNULEE': 'Annulée',
    'BROUILLON': 'Brouillon',
    'EN_ATTENTE': 'En attente'
  };

  /** Classes du badge selon l'état. */
  get classes(): Record<string, boolean> {
    switch (this.etat) {
      case 'ok':        return { 'bg-success/10': true, 'text-success': true };
      case 'bas':       return { 'bg-warning/10': true, 'text-warning': true };
      case 'rupture':   return { 'bg-error/10': true, 'text-error': true };
      case 'LIVREE':    return { 'bg-success/10': true, 'text-success': true };
      case 'VALIDEE':   return { 'bg-primary/10': true, 'text-primary': true };
      case 'EN_PREPARATION': return { 'bg-warning/10': true, 'text-warning': true };
      case 'EN_ATTENTE': return { 'bg-info/10': true, 'text-info': true };
      case 'BROUILLON': return { 'bg-base-content/10': true, 'text-base-content/70': true };
      case 'ANNULEE':   return { 'bg-error/10': true, 'text-error': true };
      default:          return { 'bg-base-content/10': true, 'text-base-content/70': true };
    }
  }

  /** Couleur de la puce interne. */
  get couleurPuce(): Record<string, boolean> {
    switch (this.etat) {
      case 'ok': case 'LIVREE':    return { 'bg-success': true };
      case 'bas': case 'EN_PREPARATION': return { 'bg-warning': true };
      case 'rupture': case 'ANNULEE':    return { 'bg-error': true };
      case 'VALIDEE':              return { 'bg-primary': true };
      case 'EN_ATTENTE':           return { 'bg-info': true };
      default:                     return { 'bg-base-content/40': true };
    }
  }

  get libelle(): string {
    return this.LIBELLES[this.etat] ?? this.etat;
  }
}
