import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Article } from 'src/app/Models/Article';
import { Category } from 'src/app/Models/Category';
import { LigneVente } from 'src/app/Models/LigneVente';
import { Ventes } from 'src/app/Models/Ventes';
import { ArticleService } from 'src/app/services/article.service';
import { CategoryService } from 'src/app/services/category.service';
import { MvtStkService } from 'src/app/services/mvt-stk.service';
import { VentePagedService } from 'src/app/services/vente-paged.service';

interface ArticleStock extends Article {
  stockReel: number;
}

interface PanierItem {
  article: ArticleStock;
  quantite: number;
  prixUnitaire: number;
}

/**
 * Caisse POS — parcours vendeur : Rechercher → Ajouter au panier → Quantité
 * → Nom client (facultatif) → Valider la vente.
 * Raccourcis clavier : F2 = recherche, F4 = valider la vente.
 */
@Component({
  selector: 'app-caisse-nouvelle-vente',
  templateUrl: './caisse-nouvelle-vente.component.html',
  styleUrls: ['./caisse-nouvelle-vente.component.css']
})
export class CaisseNouvelleVenteComponent implements OnInit, OnDestroy {

  private detruit$ = new Subject<void>();

  articles: ArticleStock[] = [];
  categories: Category[] = [];

  recherche = '';
  categorieChoisie = '';

  panier: PanierItem[] = [];
  nomClient = '';

  chargement = true;
  enregistrement = false;
  errorMsg = '';
  succesMsg = '';

  venteCreee: Ventes | null = null;
  ticketOuvert = false;

  constructor(
    private router: Router,
    private ventePagedService: VentePagedService,
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

  /** Raccourcis clavier caisse : F2 recherche, F4 valider. */
  @HostListener('window:keydown', ['$event'])
  surTouche(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      event.preventDefault();
      const champ = document.getElementById('caisse-recherche') as HTMLInputElement | null;
      champ?.focus();
      champ?.select();
    } else if (event.key === 'F4') {
      event.preventDefault();
      this.valider();
    }
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

  /** Catégories réellement utilisées par au moins un article. */
  get categoriesUtilisees(): Category[] {
    const ids = new Set(this.articles.map(a => a.category?.id).filter(id => id !== undefined));
    return this.categories.filter(c => c.id !== undefined && ids.has(c.id));
  }

  /** Résultats filtrés : catégorie + recherche (nom ou code). */
  get resultats(): ArticleStock[] {
    const q = this.recherche.trim().toLowerCase();
    return this.articles
      .filter(a => (this.categorieChoisie ? a.category?.id === Number(this.categorieChoisie) : true))
      .filter(a =>
        !q ||
        (a.designation ?? '').toLowerCase().includes(q) ||
        (a.codeArticle ?? '').toLowerCase().includes(q))
      .sort((a, b) => (b.stockReel > 0 ? 1 : 0) - (a.stockReel > 0 ? 1 : 0));
  }

  etatStock(a: ArticleStock): { libelle: string; classe: string } {
    if (a.stockReel <= 0) {
      return { libelle: 'Rupture', classe: 'badge-error' };
    }
    if (a.stockReel <= (a.seuilAlerte ?? 0)) {
      return { libelle: 'Stock bas', classe: 'badge-warning' };
    }
    return { libelle: 'Disponible', classe: 'badge-success' };
  }

  ajouterAuPanier(a: ArticleStock): void {
    if (a.stockReel <= 0) {
      return;
    }
    const existant = this.panier.find(i => i.article.id === a.id);
    if (existant) {
      if (existant.quantite >= a.stockReel) {
        this.errorMsg = `Stock maximum atteint pour « ${a.designation} » (${a.stockReel}).`;
        return;
      }
      existant.quantite += 1;
    } else {
      this.panier.push({
        article: a,
        quantite: 1,
        prixUnitaire: a.prixUnitaireTTc ?? a.prixUnitaire ?? 0
      });
    }
    this.errorMsg = '';
  }

  /** Change la quantité d'une ligne du panier (jamais au-delà du stock). */
  changerQuantite(item: PanierItem, delta: number): void {
    const suivante = item.quantite + delta;
    if (suivante > item.article.stockReel) {
      this.errorMsg = `Stock maximum atteint pour « ${item.article.designation} » (${item.article.stockReel}).`;
      return;
    }
    if (suivante <= 0) {
      this.retirer(item);
      return;
    }
    item.quantite = suivante;
    this.errorMsg = '';
  }

  retirer(item: PanierItem): void {
    this.panier = this.panier.filter(i => i !== item);
  }

  viderPanier(): void {
    this.panier = [];
    this.nomClient = '';
  }

  get totalPanier(): number {
    return this.panier.reduce((total, i) => total + i.prixUnitaire * i.quantite, 0);
  }

  valider(): void {
    if (this.enregistrement) {
      return;
    }
    if (this.panier.length === 0) {
      this.errorMsg = 'Ajoutez au moins un produit au panier.';
      return;
    }
    this.enregistrement = true;
    this.errorMsg = '';

    const ligneVentes: LigneVente[] = this.panier.map(i => ({
      article: { id: i.article.id },
      quantite: i.quantite,
      prixUnitaire: i.prixUnitaire
    }));

    const vente: Ventes = {
      code: 'V-' + Date.now(),
      dateVente: Date.now(),
      commentaire: this.nomClient.trim(),
      ligneVentes
    };
    if (this.nomClient.trim()) {
      vente.nomClient = this.nomClient.trim();
    }

    this.ventePagedService.enregistrerVente(vente)
      .pipe(takeUntil(this.detruit$))
      .subscribe(
        (creee: Ventes) => {
          // Le backend peut ne pas renvoyer les lignes : on les joint depuis
          // le panier pour que le ticket s'affiche complet immédiatement.
          this.venteCreee = {
            ...(creee ?? vente),
            ligneVentes: (creee?.ligneVentes ?? []).length ? creee!.ligneVentes : ligneVentes
          };
          this.ticketOuvert = true;
          this.succesMsg = `Vente ${this.venteCreee.code} enregistrée avec succès.`;
          this.viderPanier();
          this.enregistrement = false;
          this.charger();
        },
        (error: any) => {
          this.enregistrement = false;
          this.errorMsg = error?.error?.message ?? 'Erreur lors de l\'enregistrement de la vente.';
        }
      );
  }

  fermerTicket(): void {
    this.ticketOuvert = false;
  }

  nouvelleVenteApresTicket(): void {
    this.ticketOuvert = false;
    this.venteCreee = null;
    this.succesMsg = '';
    this.recherche = '';
  }

  retourCaisse(): void {
    this.router.navigate(['/caisse']);
  }
}
