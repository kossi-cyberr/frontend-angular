import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/_Dashboard/components/ui/toast/toast.service';

interface TypeExport {
  id: string;
  libelle: string;
  description: string;
  icone: string;
}

/**
 * Page Rapports / Exports (ADMIN / MANAGER) : téléchargement des
 * exports Excel et CSV générés par le backend — aucune donnée inventée,
 * uniquement les 5 familles d'export disponibles.
 */
@Component({
  selector: 'app-exports',
  template: `
    <div class="space-y-4">
      <div>
        <h1 class="page-title mb-0">Rapports & exports</h1>
        <p class="page-subtitle mb-0">Téléchargez les données de l'entreprise au format Excel ou CSV.</p>
      </div>

      <div class="alert alert-warning" *ngIf="generationsEnCours > 0">
        <i-lucide name="loader" size="16" class="animate-spin"></i-lucide>
        <span>{{ generationsEnCours }} export(s) en cours de génération…</span>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div class="panel p-4" *ngFor="let t of types">
          <div class="mb-3 flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <i-lucide [name]="t.icone" size="20"></i-lucide>
            </span>
            <div class="min-w-0">
              <h2 class="mb-0 text-sm font-semibold">{{ t.libelle }}</h2>
              <p class="mb-0 text-xs text-base-content/50">{{ t.description }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn btn-outline btn-xs flex-1" [disabled]="generationsEnCours > 0"
                    (click)="telecharger(t.id, 'xlsx')">
              <i-lucide name="file-spreadsheet" size="13"></i-lucide> Excel
            </button>
            <button type="button" class="btn btn-outline btn-xs flex-1" [disabled]="generationsEnCours > 0"
                    (click)="telecharger(t.id, 'csv')">
              <i-lucide name="file-text" size="13"></i-lucide> CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class ExportsComponent {

  readonly types: TypeExport[] = [
    { id: 'articles', libelle: 'Articles', description: 'Catalogue complet : codes, prix, seuils, catégories', icone: 'package' },
    { id: 'ventes', libelle: 'Ventes', description: 'Historique des ventes enregistrées', icone: 'receipt' },
    { id: 'commandesclients', libelle: 'Commandes clients', description: 'Commandes clients et leur état', icone: 'shopping-cart' },
    { id: 'clients', libelle: 'Clients', description: 'Répertoire clients avec contacts', icone: 'users' },
    { id: 'fournisseurs', libelle: 'Fournisseurs', description: 'Répertoire fournisseurs', icone: 'truck' }
  ];

  generationsEnCours = 0;

  constructor(
    private httpClient: HttpClient,
    private toastService: ToastService
  ) {}

  telecharger(type: string, format: 'xlsx' | 'csv'): void {
    this.generationsEnCours += 1;
    // Endpoints backend : /exports/{type}/excel et /exports/{type}/csv
    this.httpClient.get(`${environment.apiUrl}/exports/${type}/${format === 'xlsx' ? 'excel' : 'csv'}`,
      { responseType: 'blob' })
      .subscribe(
        (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${type}-${new Date().toISOString().slice(0, 10)}.${format}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          this.generationsEnCours -= 1;
          this.toastService.succes(`Export ${type} (${format.toUpperCase()}) téléchargé.`);
        },
        () => {
          this.generationsEnCours -= 1;
          this.toastService.erreur(`Échec de la génération de l'export ${type}.`);
        }
      );
  }
}
