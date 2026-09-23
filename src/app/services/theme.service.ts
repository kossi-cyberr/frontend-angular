import { Injectable } from '@angular/core';

/**
 * Thème applicatif global : Light / Dark.
 * - Persistance du choix utilisateur (localStorage).
 * - Détection du thème système par défaut (prefers-color-scheme).
 * - Bascule via l'attribut `data-theme` sur <html> (mode DaisyUI).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly STORAGE_KEY = 'stockhub-theme';
  private static readonly LIGHT = 'stockhub-light';
  private static readonly DARK = 'stockhub-dark';

  private courant: 'stockhub-light' | 'stockhub-dark';

  constructor() {
    // Priorité : paramètre d'URL (?theme=stockhub-dark) > choix sauvegardé > préférence système
    const parametreUrl = new URLSearchParams(window.location.search).get('theme');
    const sauvegarde = localStorage.getItem(ThemeService.STORAGE_KEY) as 'stockhub-light' | 'stockhub-dark' | null;
    const systemeSombre = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.courant = parametreUrl === ThemeService.DARK || parametreUrl === ThemeService.LIGHT
      ? parametreUrl
      : sauvegarde ?? (systemeSombre ? ThemeService.DARK : ThemeService.LIGHT);
    this.appliquer();
  }

  get theme(): 'stockhub-light' | 'stockhub-dark' {
    return this.courant;
  }

  get estSombre(): boolean {
    return this.courant === ThemeService.DARK;
  }

  toggle(): void {
    this.courant = this.estSombre ? ThemeService.LIGHT : ThemeService.DARK;
    localStorage.setItem(ThemeService.STORAGE_KEY, this.courant);
    this.appliquer();
  }

  private appliquer(): void {
    document.documentElement.setAttribute('data-theme', this.courant);
  }
}
