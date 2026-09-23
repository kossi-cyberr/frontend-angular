import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Article } from 'src/app/Models/Article';
import { Category } from 'src/app/Models/Category';
import { ArticleService } from 'src/app/services/article.service';
import { CategoryService } from 'src/app/services/category.service';
import { MvtStkService } from 'src/app/services/mvt-stk.service';

interface ArticleStock extends Article {
  stockReel: number;
}

/**
 * Vue produits du vendeur : consultation seule (prix, stock, catégorie,
 * état du stock, recherche et filtres). Aucune modification possible.
 */
@Component({
  selector: 'app-caisse-produits',
  templateUrl: './caisse-produits.component.html',
  styleUrls: ['./caisse-produits.component.css']
})
export class CaisseProduitsComponent implements OnInit, OnDestroy {

  private detruit$ = new Subject<void>();

  articles: ArticleStock[] = [];
  categories: Category[] = [];

  recherche = '';
  categorieChoisie = '';
  etatChoisi = '';

  chargement = true;
  errorMsg = '';

  constructor(
    private articleService: ArticleService,
    private categoryService: CategoryService,
    private mvtStkService: MvtStkService
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
    this.articleService.getAllArticles()
      .pipe(takeUntil(this.detruit$))
      .subscribe(
        (articles: Article[]) => {
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
                this.articles = articles.map(a => ({
                  ...a,
                  stockReel: stocks.get(a.id ?? -1) ?? 0
                }));
                this.chargement = false;
              },
              () => {
                this.articles = articles.map(a => ({ ...a, stockReel: 0 }));
                this.chargement = false;
              }
            );
        },
        () => {
          this.errorMsg = 'Impossible de charger les produits. Vérifiez que le serveur est démarré.';
          this.chargement = false;
        }
      );

    this.categoryService.findAll()
      .pipe(takeUntil(this.detruit$))
      .subscribe(
        (cats: Category[]) => this.categories = cats,
        () => this.categories = []
      );
  }

  get categoriesUtilisees(): Category[] {
    const ids = new Set(this.articles.map(a => a.category?.id).filter(id => id !== undefined));
    return this.categories.filter(c => c.id !== undefined && ids.has(c.id));
  }

  get resultats(): ArticleStock[] {
    const q = this.recherche.trim().toLowerCase();
    return this.articles
      .filter(a => (this.categorieChoisie ? a.category?.id === Number(this.categorieChoisie) : true))
      .filter(a => (this.etatChoisi ? this.etatStock(a) === this.etatChoisi : true))
      .filter(a =>
        !q ||
        (a.designation ?? '').toLowerCase().includes(q) ||
        (a.codeArticle ?? '').toLowerCase().includes(q))
      .sort((a, b) => (a.designation ?? '').localeCompare(b.designation ?? ''));
  }

  /** État de stock simplifié utilisé par le filtre et les badges. */
  etatStock(a: ArticleStock): string {
    if (a.stockReel <= 0) {
      return 'RUPTURE';
    }
    if (a.stockReel <= (a.seuilAlerte ?? 0)) {
      return 'BAS';
    }
    return 'DISPO';
  }

  classeEtat(a: ArticleStock): string {
    switch (this.etatStock(a)) {
      case 'RUPTURE': return 'badge-error';
      case 'BAS': return 'badge-warning';
      default: return 'badge-success';
    }
  }

  libelleEtat(a: ArticleStock): string {
    switch (this.etatStock(a)) {
      case 'RUPTURE': return 'Rupture';
      case 'BAS': return 'Stock bas';
      default: return 'Disponible';
    }
  }
}
