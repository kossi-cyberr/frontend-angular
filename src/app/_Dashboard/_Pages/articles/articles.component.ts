import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Article } from 'src/app/Models/Article';
import { ArticleService } from 'src/app/services/article.service';
import { MvtStkService } from 'src/app/services/mvt-stk.service';
import { ColonneTable } from 'src/app/_Dashboard/components/data-table/data-table.component';

interface ActionTable {
  type: 'details' | 'modifier' | 'supprimer';
  ligne: Article;
}

type EtatStock = 'ok' | 'bas' | 'rupture';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.css']
})
export class ArticlesComponent implements OnInit, OnDestroy {

  private detruit$ = new Subject<void>();

  articlesList: Article[] = [];
  articlesFiltres: Article[] = [];
  /** Stock réel par article (calculé depuis les mouvements). */
  stocksReels: Map<number, number> = new Map<number, number>();
  /** Terme venant de la recherche globale du header (?q=...) */
  termeRecherche = '';
  chargement = true;
  errorMsg = '';

  colonnes: ColonneTable<Article>[] = [
    { cle: 'codeArticle', libelle: 'col.code', triable: true },
    { cle: 'designation', libelle: 'col.designation', triable: true },
    { cle: 'category.designation', libelle: 'col.categorie', triable: true },
    { cle: 'prixUnitaireTTc', libelle: 'col.prixTtc', triable: true, monnaie: true, droite: true },
    { cle: 'statut', libelle: 'Statut', statutStock: true },
    { cle: 'seuilAlerte', libelle: 'col.seuil', triable: true, droite: true },
    { cle: 'actions', libelle: 'col.actions', actions: true }
  ];

  /** État de la modale de suppression. */
  suppressionOuverte = false;
  messageSuppression = '';
  private idSuppression: number | undefined;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private articleService: ArticleService,
              private mvtStkService: MvtStkService) {}

  ngOnInit(): void {
    // Terme venant de la recherche globale du header (?q=...)
    this.route.queryParams.subscribe(params => {
      this.termeRecherche = params['q'] ?? '';
      this.appliquerFiltre();
    });
    this.findAllArticle();
  }

  nouvelArticle(): void {
    this.router.navigate(['newarticles']);
  }

  ngOnDestroy(): void {
    this.detruit$.next();
    this.detruit$.complete();
  }

  findAllArticle(): void {
    this.chargement = true;
    this.errorMsg = '';
    forkJoin({
      articles: this.articleService.getAllArticles(),
      mvts: this.mvtStkService.findAll()
    })
      .pipe(takeUntil(this.detruit$))
      .subscribe(
        ({ articles, mvts }) => {
          const stocks = new Map<number, number>();
          for (const mvt of mvts) {
            const id = mvt.article?.id;
            if (id !== undefined) {
              stocks.set(id, (stocks.get(id) ?? 0) + Number(mvt.quantite ?? 0));
            }
          }
          this.stocksReels = stocks;
          this.articlesList = articles;
          this.appliquerFiltre();
          this.chargement = false;
        },
        () => {
          this.errorMsg = 'Erreur lors du chargement des articles.';
          this.chargement = false;
        }
      );
  }

  /** État de stock d'un article (badge 🟢🟠🔴). */
  etatStock(article: Article): EtatStock {
    const stock = this.stocksReels.get(article.id ?? -1) ?? 0;
    if (stock <= 0) {
      return 'rupture';
    }
    return stock <= (article.seuilAlerte ?? 0) ? 'bas' : 'ok';
  }

  /** Stock réel affichable. */
  stockDe(article: Article): number {
    return this.stocksReels.get(article.id ?? -1) ?? 0;
  }

  /** Filtre local sur la désignation ou le code (recherche header + filtre instantané) */
  appliquerFiltre(): void {
    const terme = (this.termeRecherche ?? '').trim().toLowerCase();
    this.articlesFiltres = terme.length === 0
      ? this.articlesList
      : this.articlesList.filter(a =>
          (a.designation ?? '').toLowerCase().includes(terme) ||
          (a.codeArticle ?? '').toLowerCase().includes(terme));
  }

  surAction(action: ActionTable): void {
    const article = action.ligne;
    if (action.type === 'details' || action.type === 'modifier') {
      this.router.navigate(['newarticles', article.id]);
      return;
    }
    if (action.type === 'supprimer') {
      this.idSuppression = article.id;
      this.messageSuppression =
        `Êtes-vous sûr de vouloir supprimer l'article « ${article.designation ?? article.codeArticle ?? ''} » ? Cette action est irréversible.`;
      this.suppressionOuverte = true;
    }
  }

  confirmerSuppression(): void {
    if (!this.idSuppression) {
      return;
    }
    this.articleService.deleteArticle(this.idSuppression).subscribe(
      () => {
        this.fermerSuppression();
        this.findAllArticle();
      },
      () => {
        this.fermerSuppression();
        this.errorMsg = 'Suppression impossible : cet article est peut-être utilisé dans des commandes ou mouvements.';
        setTimeout(() => { this.errorMsg = ''; }, 5000);
      }
    );
  }

  annulerSuppression(): void {
    this.fermerSuppression();
  }

  private fermerSuppression(): void {
    this.suppressionOuverte = false;
    this.idSuppression = undefined;
    this.messageSuppression = '';
  }
}
