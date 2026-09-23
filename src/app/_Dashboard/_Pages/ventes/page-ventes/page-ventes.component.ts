import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Ventes } from 'src/app/Models/Ventes';
import { VentePagedService, montantVente, nombreArticles } from 'src/app/services/vente-paged.service';
import { UserService } from 'src/app/services/user.service';
import { ColonneTable } from 'src/app/_Dashboard/components/data-table/data-table.component';
import { ToastService } from 'src/app/_Dashboard/components/ui/toast/toast.service';

interface ActionTable {
  type: 'details' | 'modifier' | 'supprimer';
  ligne: Ventes;
}

/**
 * Ventes (ADMIN/MANAGER : toutes les ventes ; VENDEUR : les siennes via
 * mes-ventes). Tableau dense : numéro, date, client, articles, montant,
 * avec détail dépliable et ticket imprimable.
 */
@Component({
  selector: 'app-page-ventes',
  templateUrl: './page-ventes.component.html',
  styleUrls: ['./page-ventes.component.css']
})
export class PageVentesComponent implements OnInit, OnDestroy {

  private detruit$ = new Subject<void>();

  ventes: Ventes[] = [];
  chargement = true;
  errorMsg = '';
  estVendeur = false;

  /** Vente déployée (détail des lignes). */
  venteDeployee: Ventes | null = null;

  /** Ticket en cours d'affichage. */
  venteTicket: Ventes | null = null;
  ticketOuvert = false;

  /** Modale de suppression (ADMIN/MANAGER). */
  suppressionOuverte = false;
  messageSuppression = '';
  private idSuppression: number | undefined;

  colonnes: ColonneTable<Ventes>[] = [
    { cle: 'code', libelle: 'N° / Code', triable: true },
    { cle: 'dateVente', libelle: 'Date', triable: true, formateur: v => this.formaterDateHeure((v as Ventes).dateVente) },
    { cle: 'nomClient', libelle: 'Client', formateur: v => (v as Ventes).nomClient ?? '—' },
    { cle: 'lignes', libelle: 'Articles', droite: true, formateur: v => String(nombreArticles(v as Ventes)) },
    { cle: 'total', libelle: 'Montant', triable: true, monnaie: true, droite: true, formateur: v => String(montantVente(v as Ventes)) },
    { cle: 'actions', libelle: 'Actions', actions: true }
  ];

  constructor(
    private router: Router,
    private venteService: VentePagedService,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.userService.getConnectedUser();
    const roles = user?.roles ?? [];
    this.estVendeur = roles.length === 1 && roles[0]?.rolename === 'VENDEUR';
    this.chargerVentes();
  }

  ngOnDestroy(): void {
    this.detruit$.next();
    this.detruit$.complete();
  }

  nouvelleVente(): void {
    this.router.navigate(['newvente']);
  }

  chargerVentes(): void {
    this.chargement = true;
    const requete$ = this.estVendeur
      ? this.venteService.findMesVentes(0, 500)
      : this.venteService.findAllPaged(0, 500);
    requete$
      .pipe(takeUntil(this.detruit$))
      .subscribe(
        (reponse) => {
          this.ventes = (reponse.content ?? [])
            .slice()
            .sort((a, b) => new Date(b.dateVente ?? 0).getTime() - new Date(a.dateVente ?? 0).getTime());
          this.chargement = false;
        },
        (error: any) => {
          console.log(error);
          this.errorMsg = 'Erreur lors du chargement des ventes.';
          this.chargement = false;
        }
      );
  }

  deployer(vente: Ventes): void {
    this.venteDeployee = this.venteDeployee?.id === vente.id ? null : vente;
  }

  ouvrirTicket(vente: Ventes): void {
    this.venteTicket = vente;
    this.ticketOuvert = true;
  }

  surAction(action: ActionTable): void {
    const vente = action.ligne;
    if (action.type === 'details') {
      this.deployer(vente);
      return;
    }
    if (action.type === 'supprimer') {
      this.idSuppression = vente.id;
      this.messageSuppression =
        `Êtes-vous sûr de vouloir supprimer la vente ${vente.code ?? ''} ? Le stock sera restauré. Cette action est irréversible.`;
      this.suppressionOuverte = true;
    }
  }

  confirmerSuppression(): void {
    if (!this.idSuppression) {
      return;
    }
    this.venteService.enregistrerSuppression(this.idSuppression)
      .pipe(takeUntil(this.detruit$))
      .subscribe(
        () => {
          this.fermerSuppression();
          this.toastService.succes('Vente supprimée.');
          this.chargerVentes();
        },
        () => {
          this.fermerSuppression();
          this.toastService.erreur('Suppression impossible.');
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

  totalMontant(vente: Ventes): number {
    return montantVente(vente);
  }

  totalLignes(vente: Ventes): number {
    return nombreArticles(vente);
  }

  formaterDateHeure(date: any): string {
    if (!date) {
      return '—';
    }
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  formaterDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
