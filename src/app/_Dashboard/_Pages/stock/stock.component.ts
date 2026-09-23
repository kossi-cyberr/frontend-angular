import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Article } from 'src/app/Models/Article';
import { ArticleService } from 'src/app/services/article.service';
import { MvtStkService } from 'src/app/services/mvt-stk.service';
import { RoleService } from 'src/app/services/role.service';
import { ToastService } from 'src/app/_Dashboard/components/ui/toast/toast.service';

interface LigneStock {
  article: Article;
  stock: number;
  seuil: number;
  etat: 'ok' | 'bas' | 'rupture';
}

interface MvtAffiche {
  date: number;
  article: string;
  code: string;
  quantite: number;
  type: string;
  source: string;
}

/**
 * Page Stock STOCK-HUB : vue d'ensemble du stock (disponibles, faibles,
 * ruptures), alertes et derniers mouvements. Le stock réel est calculé
 * depuis l'historique des mouvements (API existante /mvtstk/all).
 */
@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit, OnDestroy {

  private detruit$ = new Subject<void>();

  lignes: LigneStock[] = [];
  mouvements: MvtAffiche[] = [];

  recherche = '';
  filtreEtat = '';

  chargement = true;
  errorMsg = '';

  /** Article dont l'historique est déployé (accordéon). */
  articleHistorique: number | null = null;
  historiqueChargement = false;
  historiqueMvts: MvtAffiche[] = [];

  constructor(
    private articleService: ArticleService,
    private mvtStkService: MvtStkService,
    public roleService: RoleService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
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
          this.lignes = (articles as Article[])
            .map(article => {
              const stock = stocks.get(article.id ?? -1) ?? 0;
              const seuil = article.seuilAlerte ?? 0;
              const etat: LigneStock['etat'] = stock <= 0 ? 'rupture' : (stock <= seuil ? 'bas' : 'ok');
              return { article, stock, seuil, etat };
            })
            .sort((a, b) => a.etat.localeCompare(b.etat) || (a.article.designation ?? '').localeCompare(b.article.designation ?? ''));

          this.mouvements = (mvts as any[])
            .slice()
            .sort((a, b) => new Date(b.dateMvt ?? 0).getTime() - new Date(a.dateMvt ?? 0).getTime())
            .slice(0, 8)
            .map(m => this.vueMvt(m));

          this.chargement = false;
        },
        () => {
          this.errorMsg = 'Impossible de charger le stock. Vérifiez que le serveur est démarré.';
          this.chargement = false;
        }
      );
  }

  private vueMvt(m: any): MvtAffiche {
    return {
      date: new Date(m.dateMvt ?? 0).getTime(),
      article: m.article?.designation ?? '—',
      code: m.article?.codeArticle ?? '',
      quantite: Number(m.quantite ?? 0),
      type: m.typeMvt ?? '',
      source: m.sourceMvt ?? ''
    };
  }

  get totals(): { ok: number; bas: number; rupture: number; valeurEstimee: number } {
    const ok = this.lignes.filter(l => l.etat === 'ok').length;
    const bas = this.lignes.filter(l => l.etat === 'bas').length;
    const rupture = this.lignes.filter(l => l.etat === 'rupture').length;
    const valeurEstimee = this.lignes.reduce(
      (somme, l) => somme + l.stock * Number(l.article.prixUnitaire ?? 0), 0);
    return { ok, bas, rupture, valeurEstimee };
  }

  get resultats(): LigneStock[] {
    const q = this.recherche.trim().toLowerCase();
    return this.lignes
      .filter(l => (this.filtreEtat ? l.etat === this.filtreEtat : true))
      .filter(l =>
        !q ||
        (l.article.designation ?? '').toLowerCase().includes(q) ||
        (l.article.codeArticle ?? '').toLowerCase().includes(q));
  }

  /** Déploie l'historique des mouvements d'un article. */
  basculerHistorique(ligne: LigneStock): void {
    const id = ligne.article.id;
    if (id === undefined) {
      return;
    }
    if (this.articleHistorique === id) {
      this.articleHistorique = null;
      return;
    }
    this.articleHistorique = id;
    this.historiqueChargement = true;
    this.historiqueMvts = [];
    this.mvtStkService.mvtStkArticle(id)
      .pipe(takeUntil(this.detruit$))
      .subscribe(
        (mvts: any[]) => {
          this.historiqueMvts = (mvts ?? [])
            .sort((a, b) => new Date(b.dateMvt ?? 0).getTime() - new Date(a.dateMvt ?? 0).getTime())
            .map(m => this.vueMvt(m));
          this.historiqueChargement = false;
        },
        () => {
          this.historiqueChargement = false;
          this.toastService.erreur('Impossible de charger l\'historique de cet article.');
        }
      );
  }

  /** Le vendeur est renvoyé vers sa vue produits lecture seule. */
  voirArticle(ligne: LigneStock): void {
    if (this.roleService.estVendeur) {
      this.router.navigate(['/caisse/produits']);
    } else {
      this.router.navigate(['/newarticles', ligne.article.id]);
    }
  }
}
