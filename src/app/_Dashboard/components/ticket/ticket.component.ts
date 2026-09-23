import { Component, Input } from '@angular/core';
import { CommandeClient } from 'src/app/Models/CommandeClient';
import { Ventes } from 'src/app/Models/Ventes';

type Ligne = { designation?: string; codeArticle?: string; quantite?: number; prixUnitaire?: number };

/**
 * Ticket / facture imprimable, partagé entre les ventes caisse et les
 * commandes clients livrées. L'impression utilise window.print() avec une
 * zone d'impression dédiée (@media print dans le CSS global).
 */
@Component({
  selector: 'app-ticket',
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.css']
})
export class TicketComponent {

  /** Contexte : vente caisse ou commande client livrée. */
  @Input() vente: Ventes | null = null;
  @Input() commande: CommandeClient | null = null;

  @Input() visible = false;
  @Input() titre = 'Ticket de vente';

  /** Lignes normalisées selon le contexte. */
  get lignes(): Ligne[] {
    if (this.vente) {
      return (this.vente.ligneVentes ?? []).map(l => ({
        designation: l.article?.designation,
        codeArticle: l.article?.codeArticle,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire
      }));
    }
    return (this.commande?.ligneComandeClientList ?? []).map(l => ({
      designation: l.article?.designation,
      codeArticle: l.article?.codeArticle,
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire
    }));
  }

  get code(): string {
    return this.vente?.code ?? this.commande?.code ?? '';
  }

  get date(): number | undefined {
    return this.vente?.dateVente ?? this.commande?.dateComande;
  }

  /** Nom du client (facultatif sur une vente ; complet sur une commande). */
  get nomClient(): string {
    if (this.vente) {
      return this.vente.nomClient ?? '';
    }
    const c = this.commande?.client;
    return `${c?.nom ?? ''} ${c?.prenom ?? ''}`.trim();
  }

  get nomVendeur(): string {
    return this.vente?.nomVendeur ?? this.commande?.nomVendeur ?? '';
  }

  get dateLivraison(): number | undefined {
    return this.commande?.dateLivraison;
  }

  get total(): number {
    return this.lignes.reduce((somme, l) => somme + Number(l.quantite ?? 0) * Number(l.prixUnitaire ?? 0), 0);
  }

  /** Nombre total d'articles (somme des quantités). */
  get nombreArticles(): number {
    return this.lignes.reduce((somme, l) => somme + Number(l.quantite ?? 0), 0);
  }

  fermer(): void {
    this.visible = false;
  }

  imprimer(): void {
    window.print();
  }
}
