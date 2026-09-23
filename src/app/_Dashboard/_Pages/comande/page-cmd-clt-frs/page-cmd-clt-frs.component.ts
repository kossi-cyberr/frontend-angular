import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommandeClient } from 'src/app/Models/CommandeClient';
import { CommandeFournisseur } from 'src/app/Models/CommandeFournisseur';
import { LigneCommandeClient } from 'src/app/Models/LigneCommandeClient';
import { Utilisateur } from 'src/app/Models/Utilisateure';
import { CommandeClientService } from 'src/app/services/commande-client.service';
import { CommandeFournisseurService } from 'src/app/services/commande-fournisseur.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-page-cmd-clt-frs',
  templateUrl: './page-cmd-clt-frs.component.html',
  styleUrls: ['./page-cmd-clt-frs.component.css']
})
export class PageCmdCltFrsComponent implements OnInit {

  origin = '';
  /** Commandes clients OU fournisseurs selon l'origine de la page */
  commandes: any[] = [];
  /** Cache des lignes par commande (chargées au déploiement de l'accordéon) */
  lignesParCommande: { [idCommande: number]: any[] } = {};
  totalParCommande: { [idCommande: number]: number } = {};
  etatChoisi: { [idCommande: number]: string } = {};
  chargement = true;
  errorMsg = '';

  /* Filtres serveur (commandes clients uniquement) */
  filtreEtat = '';
  filtreVendeur = '';
  vendeurs: Utilisateur[] = [];

  /** Ticket d'une commande LIVREE. */
  commandeTicket: CommandeClient | null = null;
  ticketOuvert = false;

  constructor(private router: Router,
    private activatedRoute: ActivatedRoute,
    private commandeClientService: CommandeClientService,
    private commandeFournisseurService: CommandeFournisseurService,
    private userService: UserService) { }

  ngOnInit(): void {
    this.activatedRoute.data.subscribe((data: any) => {
      this.origin = data.origin;
      this.findAllCommandes();
      if (this.origin === 'client') {
        this.chargerVendeurs();
      }
    });
  }

  get estClient(): boolean {
    return this.origin === 'client';
  }

  get estVendeur(): boolean {
    const roles = this.userService.getConnectedUser()?.roles ?? [];
    return roles.length === 1 && roles[0]?.rolename === 'VENDEUR';
  }

  /** Liste des vendeurs pour le filtre (masqué aux vendeurs eux-mêmes). */
  private chargerVendeurs(): void {
    if (this.estVendeur) {
      return;
    }
    this.userService.findAllUtilisateurs().subscribe(
      (utilisateurs: Utilisateur[]) => {
        this.vendeurs = (utilisateurs ?? []).filter(u =>
          (u.roles ?? []).some(r => r.rolename === 'VENDEUR'));
      },
      () => this.vendeurs = []
    );
  }

  /** Applique les filtres état + vendeur (commandes clients, côté serveur). */
  appliquerFiltres(): void {
    this.findAllCommandes();
  }

  ouvrirTicket(commande: any): void {
    this.commandeTicket = commande;
    this.ticketOuvert = true;
  }

  nomVendeur(commande: any): string {
    return commande.nomVendeur || '—';
  }

  nouvellecommande(): void {
    this.router.navigate([this.estClient ? 'newcommandeclient' : 'newcommandefournisseur']);
  }

  findAllCommandes(): void {
    this.chargement = true;
    const requete$ = (this.estClient
      ? this.commandeClientService.findAllPaged(0, 1000, '', this.filtreEtat, this.filtreVendeur)
      : this.commandeFournisseurService.findAll()) as Observable<any[]>;
    requete$.subscribe(
      (reponse: any) => {
        this.commandes = this.estClient ? (reponse.content ?? []) : reponse;
        this.chargement = false;
      },
      (error: any) => {
        console.log(error);
        this.errorMsg = 'Erreur lors du chargement des commandes.';
        this.chargement = false;
      }
    );
  }

  /** Total d'une commande : montant serveur si présent, sinon calcul local (lignes chargées). */
  totalAffiche(commande: any): number {
    if (commande.montantTotal !== undefined && commande.montantTotal !== null) {
      return Number(commande.montantTotal);
    }
    return this.total(commande);
  }

  /** Charge les lignes d'une commande au premier déploiement de l'accordéon. */
  chargerLignes(commande: any): void {
    if (!commande.id || this.lignesParCommande[commande.id]) {
      return;
    }
    const requete$ = this.estClient
      ? this.commandeClientService.findLignesCommande(commande.id)
      : this.commandeFournisseurService.findLignesCommande(commande.id);
    requete$.subscribe(
      (lignes: any[]) => {
        this.lignesParCommande[commande.id!] = lignes;
        this.totalParCommande[commande.id!] = lignes.reduce(
          (somme, l) => somme + Number(l.quantite ?? 0) * Number(l.prixUnitaire ?? 0), 0);
      },
      (error: any) => console.log(error)
    );
  }

  total(commande: any): number {
    return commande.id ? (this.totalParCommande[commande.id] ?? 0) : 0;
  }

  appliquerEtat(commande: any): void {
    if (!commande.id) {
      return;
    }
    const etat = this.etatChoisi[commande.id];
    if (!etat) {
      return;
    }
    const requete$ = (this.estClient
      ? this.commandeClientService.changerEtat(commande.id, etat)
      : this.commandeFournisseurService.changerEtat(commande.id, etat)) as Observable<any>;
    requete$.subscribe(
      () => this.findAllCommandes(),
      (error: any) => {
        console.log(error);
        this.errorMsg = 'Impossible de changer l état de la commande.';
        setTimeout(() => { this.errorMsg = ''; }, 5000);
      }
    );
  }

  supprimer(commande: any): void {
    if (!commande.id) {
      return;
    }
    const requete$ = (this.estClient
      ? this.commandeClientService.deleteCommande(commande.id)
      : this.commandeFournisseurService.deleteCommande(commande.id)) as Observable<any>;
    requete$.subscribe(
      () => this.findAllCommandes(),
      (error: any) => {
        console.log(error);
        this.errorMsg = error?.error?.message ?? 'Suppression impossible.';
        setTimeout(() => { this.errorMsg = ''; }, 5000);
      }
    );
  }

  telechargerFacture(commande: any): void {
    if (!commande.id) {
      return;
    }
    this.commandeClientService.telechargerFacturePdf(commande.id).subscribe(
      (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${commande.code ?? commande.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      (error: any) => console.log(error)
    );
  }

  nomPartenaire(commande: any): string {
    const partenaire = this.estClient ? commande.client : commande.fournisseur;
    return `${partenaire?.nom ?? ''} ${partenaire?.prenom ?? ''}`.trim() || '—';
  }

  initiales(commande: any): string {
    const partenaire = this.estClient ? commande.client : commande.fournisseur;
    return ((partenaire?.nom ?? '?').charAt(0) + (partenaire?.prenom ?? '').charAt(0)).toUpperCase();
  }

  formaterDate(date: any): string {
    if (!date) {
      return '—';
    }
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
