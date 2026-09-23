import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Article } from 'src/app/Models/Article';
import { UserService } from 'src/app/services/user.service';
import { MvtStkService } from 'src/app/services/mvt-stk.service';
import { ArticleService } from 'src/app/services/article.service';
import {
  dateHeure,
  money,
  montantVente,
  nombreArticles,
  statsDuJour,
  ventesDuJour
} from 'src/app/services/vente-paged.service';
import { VentePagedService } from 'src/app/services/vente-paged.service';
import { Ventes } from 'src/app/Models/Ventes';

interface ArticleStock extends Article {
  stockReel: number;
}

/**
 * Dashboard vendeur / caisse : ventes du jour, chiffre d'affaires du jour,
 * articles vendus, dernières ventes et produits sous le seuil.
 * Uniquement des informations utiles au vendeur (pas de données entreprise).
 */
@Component({
  selector: 'app-caisse-dashboard',
  templateUrl: './caisse-dashboard.component.html',
  styleUrls: ['./caisse-dashboard.component.css']
})
export class CaisseDashboardComponent implements OnInit, OnDestroy {

  private detruit$ = new Subject<void>();

  ventes: Ventes[] = [];
  articles: ArticleStock[] = [];
  chargement = true;
  errorMsg = '';

  constructor(
    private router: Router,
    private ventePagedService: VentePagedService,
    private articleService: ArticleService,
    private mvtStkService: MvtStkService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.charger();
  }

  ngOnDestroy(): void {
    this.detruit$.next();
    this.detruit$.complete();
  }

  charger(): void {
    this.chargement = true;
    this.errorMsg = '';
    this.ventePagedService.findAll()
      .pipe(takeUntil(this.detruit$))
      .subscribe(
        (ventes: Ventes[]) => {
          this.ventes = ventes;
          this.chargerStocks();
        },
        () => {
          this.errorMsg = 'Impossible de charger vos ventes. Vérifiez que le serveur est démarré.';
          this.chargement = false;
        }
      );
  }

  /** Charge les stocks réels (mouvements) + les articles sous le seuil. */
  private chargerStocks(): void {
    this.mvtStkService.findAll()
      .pipe(takeUntil(this.detruit$))
      .subscribe(
        (mvts: any[]) => {
          const stocks = new Map<number, number>();
          for (const mvt of mvts) {
            const id = mvt.article?.id;
            if (id !== undefined) {
              stocks.set(id, (stocks.get(id) ?? 0) + Number(mvt.quantite ?? 0));
            }
          }
          this.articleService.getAllArticles()
            .pipe(takeUntil(this.detruit$))
            .subscribe(
              (articles: Article[]) => {
                this.articles = articles.map(a => ({
                  ...a,
                  stockReel: stocks.get(a.id ?? -1) ?? 0
                }));
                this.chargement = false;
              },
              () => {
                this.articles = [];
                this.chargement = false;
              }
            );
        },
        () => {
          this.articles = [];
          this.chargement = false;
        }
      );
  }

  get stats(): { nombreVentes: number; chiffreAffaires: number; nombreArticles: number } {
    return statsDuJour(this.ventes);
  }

  get dernieresVentes(): Ventes[] {
    return ventesDuJour(this.ventes).slice(0, 5);
  }

  get articlesSousSeuil(): ArticleStock[] {
    return this.articles.filter(a =>
      a.stockReel > 0 ? a.stockReel <= (a.seuilAlerte ?? 0) : true
    );
  }

  nomVendeur(): string {
    const u = this.userService.getConnectedUser();
    return `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim();
  }

  nouvelleVente(): void {
    this.router.navigate(['/caisse/nouvelle-vente']);
  }

  voirProduits(): void {
    this.router.navigate(['/caisse/produits']);
  }

  voirMesVentes(): void {
    this.router.navigate(['/caisse/mes-ventes']);
  }

  voirCommandes(): void {
    this.router.navigate(['/commandeclient']);
  }

  /** Affichage sécurisé pour le template. */
  m(v: number): string {
    return money(v);
  }

  dh(v: number | undefined): string {
    return dateHeure(v);
  }

  articlesVendus(vente: Ventes): number {
    return nombreArticles(vente);
  }

  montant(vente: Ventes): number {
    return montantVente(vente);
  }
}
