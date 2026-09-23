import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Toast, ToastService, TypeToast } from './toast.service';

/**
 * Conteneur des notifications (coin inférieur droit). Monté une seule
 * fois dans le layout dashboard ; les toasts disparaissent d'eux-mêmes.
 */
@Component({
  selector: 'app-toast-container',
  template: `
    <div class="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-80 flex-col gap-2">
      <div *ngFor="let toast of toasts"
           class="pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-sh-pop"
           [ngClass]="bordure(toast.type)">
        <i-lucide [name]="icone(toast.type)" size="16" class="mt-0.5 shrink-0" [ngClass]="texte(toast.type)"></i-lucide>
        <span class="min-w-0 flex-1">{{ toast.message }}</span>
        <button type="button" class="btn btn-ghost btn-xs btn-circle -mr-1 -mt-1" (click)="fermer(toast)"
                aria-label="Fermer la notification">✕</button>
      </div>
    </div>
  `,
  styles: [':host { display: contents; }']
})
export class ToastContainerComponent implements OnInit, OnDestroy {

  toasts: Toast[] = [];
  private abonnement?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.abonnement = this.toastService.flux.subscribe(toast => {
      this.toasts = [...this.toasts, toast];
      setTimeout(() => this.fermer(toast), 4500);
    });
  }

  ngOnDestroy(): void {
    this.abonnement?.unsubscribe();
  }

  fermer(toast: Toast): void {
    this.toasts = this.toasts.filter(t => t.id !== toast.id);
  }

  bordure(type: TypeToast): Record<string, boolean> {
    switch (type) {
      case 'succes': return { 'border-success/30': true, 'bg-base-100': true };
      case 'erreur': return { 'border-error/30': true, 'bg-base-100': true };
      default:       return { 'border-info/30': true, 'bg-base-100': true };
    }
  }

  texte(type: TypeToast): Record<string, boolean> {
    switch (type) {
      case 'succes': return { 'text-success': true };
      case 'erreur': return { 'text-error': true };
      default:       return { 'text-info': true };
    }
  }

  icone(type: TypeToast): string {
    switch (type) {
      case 'succes': return 'check-circle-2';
      case 'erreur': return 'alert-triangle';
      default:       return 'info';
    }
  }
}
