import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PageResponse } from 'src/app/Models/PageResponse';
import { Ventes } from 'src/app/Models/Ventes';
import {
  VentePagedService,
  montantVente,
  nombreArticles
} from 'src/app/services/vente-paged.service';

/**
 * Historique des ventes du vendeur connecté : numéro/date, client
 * (facultatif), nombre d'articles, montant, détail et ticket imprimable.
 */
@Component({
  selector: 'app-caisse-mes-ventes',
  templateUrl: './caisse-mes-ventes.component.html',
  styleUrls: ['./caisse-mes-ventes.component.css']
})
export class CaisseMesVentesComponent implements OnInit, OnDestroy {

  private detruit$ = new Subject<void>();

  page = 0;
  taille = 10;
  reponse: PageResponse<Ventes> | null = null;
  ventes: Ventes[] = [];

  /** Vente déployée (accordéon). */
  venteDeployee: Ventes | null = null;

  /** Ticket en cours d'affichage. */
  venteTicket: Ventes | null = null;
  ticketOuvert = false;

  chargement = true;
  errorMsg = '';

  constructor(private ventePagedService: VentePagedService) {}

  ngOnInit(): void {
    this.charger();
  }

  ngOnDestroy(): void {
    this.detruit$.next();
    this.detruit$.complete();
  }

  charger(): void {
    this.chargement = true;
    this.ventePagedService.findMesVentes(this.page, this.taille)
      .pipe(takeUntil(this.detruit$))
      .subscribe(
        (reponse: PageResponse<Ventes>) => {
          this.reponse = reponse;
          this.ventes = reponse.content ?? [];
          this.chargement = false;
        },
        () => {
          this.errorMsg = 'Impossible de charger vos ventes. Vérifiez que le serveur est démarré.';
          this.chargement = false;
        }
      );
  }

  allerPage(p: number): void {
    if (p < 0 || (this.reponse && p >= this.reponse.totalPages)) {
      return;
    }
    this.page = p;
    this.charger();
  }

  deployer(vente: Ventes): void {
    this.venteDeployee = this.venteDeployee?.id === vente.id ? null : vente;
  }

  ouvrirTicket(vente: Ventes): void {
    this.venteTicket = vente;
    this.ticketOuvert = true;
  }

  total(vente: Ventes): number {
    return montantVente(vente);
  }

  articles(vente: Ventes): number {
    return nombreArticles(vente);
  }

  formaterDate(value?: number | null): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleDateString('fr-FR');
  }

  formaterHeure(value?: number | null): string {
    if (!value) {
      return '';
    }
    return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
