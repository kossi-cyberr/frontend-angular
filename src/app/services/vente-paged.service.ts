import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Article } from '../Models/Article';
import { PageResponse } from '../Models/PageResponse';
import { Ventes } from '../Models/Ventes';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class VentePagedService {

  private readonly APP_URL = environment.apiUrl + '/ventes';

  constructor(private httpClient: HttpClient, private userService: UserService) {}

  /** Crée une vente ; le vendeur est rattaché côté serveur (JWT). */
  enregistrerVente(vente: Ventes): Observable<Ventes> {
    vente.idEntreprise = this.userService.getConnectedUser()?.entreprise?.id;
    return this.httpClient.post<Ventes>(`${this.APP_URL}/create`, vente);
  }

  /** Liste paginée de toutes les ventes (recherche par code). */
  findAllPaged(page = 0, size = 10, search = ''): Observable<PageResponse<Ventes>> {
    const params: Record<string, string> = {
      page: String(page),
      size: String(size)
    };
    if (search && search.trim()) {
      params['search'] = search.trim();
    }
    return this.httpClient.get<PageResponse<Ventes>>(`${this.APP_URL}/paged`, { params });
  }

  /** Ventes du vendeur connecté uniquement (paginées). */
  findMesVentes(page = 0, size = 10): Observable<PageResponse<Ventes>> {
    return this.httpClient.get<PageResponse<Ventes>>(`${this.APP_URL}/mes-ventes`, {
      params: { page: String(page), size: String(size) }
    });
  }

  /** Toutes les ventes (non paginées) — pour les statistiques du jour. */
  findAll(): Observable<Ventes[]> {
    return this.httpClient.get<Ventes[]>(`${this.APP_URL}/all`);
  }
}

/* ------------------------------------------------------------------ */
/* Helpers de calcul (miroir de lib/ventes.ts côté Next.js)            */
/* ------------------------------------------------------------------ */

/** Montant d'une ligne de vente (quantité × prix unitaire). */
export function montantLigne(ligne: { quantite?: number; prixUnitaire?: number }): number {
  return Number(ligne.quantite ?? 0) * Number(ligne.prixUnitaire ?? 0);
}

/** Montant total d'une vente = somme des lignes. */
export function montantVente(vente: { ligneVentes?: Array<{ quantite?: number; prixUnitaire?: number }> } | null | undefined): number {
  return (vente?.ligneVentes ?? []).reduce((total, l) => total + montantLigne(l), 0);
}

/** Nombre total d'articles d'une vente (somme des quantités). */
export function nombreArticles(vente: { ligneVentes?: Array<{ quantite?: number }> } | null | undefined): number {
  return (vente?.ligneVentes ?? []).reduce((total, l) => total + Number(l.quantite ?? 0), 0);
}

/** Vrai si la date (timestamp ou ISO) tombe aujourd'hui. */
export function estAujourdhui(value?: number | string | null): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  const d = new Date(value as any);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

export interface StatsJour {
  nombreVentes: number;
  chiffreAffaires: number;
  nombreArticles: number;
}

/** Agrège les ventes du jour : nombre de ventes, CA et articles vendus. */
export function statsDuJour(ventes: Ventes[]): StatsJour {
  const ventesJour = ventes.filter(v => estAujourdhui(v.dateVente));
  return {
    nombreVentes: ventesJour.length,
    chiffreAffaires: ventesJour.reduce((total, v) => total + montantVente(v), 0),
    nombreArticles: ventesJour.reduce((total, v) => total + nombreArticles(v), 0)
  };
}

/** Ventes du jour, les plus récentes d'abord. */
export function ventesDuJour(ventes: Ventes[]): Ventes[] {
  return ventes
    .filter(v => estAujourdhui(v.dateVente))
    .sort((a, b) => new Date(b.dateVente ?? 0).getTime() - new Date(a.dateVente ?? 0).getTime());
}

/**
 * Stock réel par article, calculé à partir de l'historique des mouvements
 * (API existante : GET /mvtstk/all — accessible aux VENDEUR en lecture).
 */
export function calculerStocksReels(mvts: Array<{ article?: { id?: number }; quantite?: number }>): Map<number, number> {
  const stocks = new Map<number, number>();
  for (const mvt of mvts) {
    const id = mvt.article?.id;
    if (id === undefined) {
      continue;
    }
    stocks.set(id, (stocks.get(id) ?? 0) + Number(mvt.quantite ?? 0));
  }
  return stocks;
}

/** Enrichit une liste d'articles avec leur stock réel. */
export function articlesAvecStock(articles: Article[], stocks: Map<number, number>): Array<Article & { stockReel: number }> {
  return articles.map(a => ({ ...a, stockReel: stocks.get(a.id ?? -1) ?? 0 }));
}

/** Formatage monétaire uniforme (FCFA). */
export function money(valeur: number | undefined | null): string {
  return Number(valeur ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' FCFA';
}

/** Formatage date + heure. */
export function dateHeure(value?: number | string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value as any).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
