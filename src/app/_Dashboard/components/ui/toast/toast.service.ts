import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type TypeToast = 'succes' | 'erreur' | 'info';

export interface Toast {
  id: number;
  type: TypeToast;
  message: string;
}

/**
 * Notifications globales STOCK-HUB : feedback court après une action
 * (succès, erreur, info). Affichées par le composant ToastContainer
 * monté une seule fois dans le layout.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {

  private suivant$ = new Subject<Toast>();
  private compteur = 0;

  /** Flux des toasts à afficher (le container s'y abonne). */
  get flux(): Observable<Toast> {
    return this.suivant$.asObservable();
  }

  succes(message: string): void {
    this.emettre('succes', message);
  }

  erreur(message: string): void {
    this.emettre('erreur', message);
  }

  info(message: string): void {
    this.emettre('info', message);
  }

  private emettre(type: TypeToast, message: string): void {
    this.compteur += 1;
    this.suivant$.next({ id: this.compteur, type, message });
  }
}
