import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject, forkJoin } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';
import { RoleService } from 'src/app/services/role.service';
import { ArticleService } from 'src/app/services/article.service';
import { MvtStkService } from 'src/app/services/mvt-stk.service';
import { Article } from 'src/app/Models/Article';

interface ItemMenu {
  id: string;
  /** Clé de traduction (LanguageService). */
  cle: string;
  url: string;
  /** Nom Lucide de l'icône (kebab-case, fournie via LucideAngularModule.pick). */
  icone: string;
  /** Badge numérique (alertes stock sur l'item Stock). */
  badge?: number;
}

interface SectionMenu {
  id: string;
  cle: string;
  items: ItemMenu[];
}

/**
 * Sidebar STOCK-HUB : navigation par catégories métier, adaptée au rôle.
 * ADMIN   → Pilotage, Ventes, Achats, Catalogue, Stock, Gestion, Rapports
 * MANAGER → idem sans la gestion des utilisateurs
 * VENDEUR → Accueil, Vente, Produits, Profil
 */
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  private detruit$ = new Subject<void>();

  /** Nombre d'articles sous le seuil (badge sur la section Stock). */
  alertesStock = 0;

  sections: SectionMenu[] = [
    {
      id: 'pilotage',
      cle: 'section.pilotage',
      items: [
        { id: 'dashboard', cle: 'nav.dashboard', url: '', icone: 'layout-dashboard' },
        { id: 'stats', cle: 'nav.stats', url: 'statistique', icone: 'trending-up' }
      ]
    },
    {
      id: 'ventes',
      cle: 'section.ventes',
      items: [
        { id: 'ventes', cle: 'nav.ventes', url: 'ventes', icone: 'receipt' },
        { id: 'cmd-clients', cle: 'nav.cmdClients', url: 'commandeclient', icone: 'shopping-cart' }
      ]
    },
    {
      id: 'achats',
      cle: 'section.achats',
      items: [
        { id: 'cmd-fournisseurs', cle: 'nav.cmdFournisseurs', url: 'commandefournissuer', icone: 'building-2' },
        { id: 'fournisseurs', cle: 'nav.fournisseurs', url: 'fournisseurs', icone: 'truck' }
      ]
    },
    {
      id: 'catalogue',
      cle: 'section.catalogue',
      items: [
        { id: 'articles', cle: 'nav.articles', url: 'articles', icone: 'package' },
        { id: 'categories', cle: 'nav.categories', url: 'categories', icone: 'tags' }
      ]
    },
    {
      id: 'stock',
      cle: 'section.stock',
      items: [
        { id: 'stock', cle: 'nav.stock', url: 'stock', icone: 'boxes' },
        { id: 'mvtstk', cle: 'nav.mvtstk', url: 'mvtstk', icone: 'arrow-left-right' }
      ]
    },
    {
      id: 'gestion',
      cle: 'section.gestion',
      items: [
        { id: 'clients', cle: 'nav.clients', url: 'client', icone: 'users' },
        { id: 'utilisateurs', cle: 'nav.utilisateurs', url: 'utilisateur', icone: 'user-cog' }
      ]
    },
    {
      id: 'rapports',
      cle: 'section.rapports',
      items: [
        { id: 'exports', cle: 'nav.exports', url: 'exports', icone: 'file-down' }
      ]
    },
    // ================= VENDEUR =================
    {
      id: 'accueil',
      cle: 'section.accueil',
      items: [
        { id: 'caisse-home', cle: 'nav.caisse', url: 'caisse', icone: 'layout-dashboard' }
      ]
    },
    {
      id: 'vente',
      cle: 'section.vente',
      items: [
        { id: 'caisse-nouvelle', cle: 'nav.nouvelleVente', url: 'caisse/nouvelle-vente', icone: 'shopping-cart' },
        { id: 'caisse-ventes', cle: 'nav.mesVentes', url: 'caisse/mes-ventes', icone: 'receipt' }
      ]
    },
    {
      id: 'produits',
      cle: 'section.produits',
      items: [
        { id: 'caisse-produits', cle: 'nav.produits', url: 'caisse/produits', icone: 'package' },
        { id: 'caisse-stock', cle: 'nav.stock', url: 'stock', icone: 'boxes' }
      ]
    }
  ];

  /** Route courante (pour l'état actif des liens). */
  urlCourante = '';

  constructor(
    private router: Router,
    public langueService: LanguageService,
    public roleService: RoleService,
    private articleService: ArticleService,
    private mvtStkService: MvtStkService
  ) {}

  ngOnInit(): void {
    this.urlCourante = this.router.url;
    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(this.detruit$)
      )
      .subscribe((e: RouterEvent) => {
        this.urlCourante = (e as NavigationEnd).urlAfterRedirects;
      });

    if (this.roleService.peutPiloter) {
      this.chargerAlertesStock();
    }
  }

  ngOnDestroy(): void {
    this.detruit$.next();
    this.detruit$.complete();
  }

  /** Compte les articles sous le seuil (stock réel via mouvements). */
  private chargerAlertesStock(): void {
    forkJoin({
      articles: this.articleService.getAllArticles(),
      mvts: this.mvtStkService.findAll()
    })
      .pipe(takeUntil(this.detruit$))
      .subscribe(({ articles, mvts }) => {
        const stocks = new Map<number, number>();
        for (const mvt of mvts) {
          const id = mvt.article?.id;
          if (id !== undefined) {
            stocks.set(id, (stocks.get(id) ?? 0) + Number(mvt.quantite ?? 0));
          }
        }
        this.alertesStock = (articles as Article[]).filter(a => {
          const stock = stocks.get(a.id ?? -1) ?? 0;
          return stock <= (a.seuilAlerte ?? 0);
        }).length;
      });
  }

  /** Vrai si l'item correspond à la route active. */
  estActif(item: ItemMenu): boolean {
    if (item.url === '') {
      return this.urlCourante === '/' || this.urlCourante === '';
    }
    const url = '/' + item.url;
    return this.urlCourante === url || this.urlCourante.startsWith(url + '/') || this.urlCourante.startsWith(url + '?');
  }

  naviguer(item: ItemMenu): void {
    this.router.navigate([item.url]);
  }

  /** Traduction directe d'une clé dans le template. */
  t(cle: string): string {
    return this.langueService.t(cle);
  }

  /** Retourne les sections visibles selon le rôle connecté. */
  get sectionsVisibles(): SectionMenu[] {
    if (this.roleService.estVendeur) {
      // Vendeur : Accueil, Vente, Produits (avec stock, sans gestion)
      return this.sections
        .filter(s => ['accueil', 'vente', 'produits'].includes(s.id));
    }
    const sections = this.sections.filter(s =>
      !['accueil', 'vente', 'produits'].includes(s.id));
    if (this.roleService.peutAdministrer) {
      return sections;
    }
    // MANAGER : tout sauf la gestion des utilisateurs
    return sections
      .map(s => s.id === 'gestion'
        ? { ...s, items: s.items.filter(i => i.id !== 'utilisateurs') }
        : s)
      .filter(s => s.items.length > 0);
  }
}
