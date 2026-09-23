import { Client } from "./Client";
import { LigneCommandeClient } from "./LigneCommandeClient";

export interface CommandeClient {
  id?: number;
  code?: string;
  dateComande?: number;
  etatCommande?: 'EN_PREPARATION' | 'VALIDEE' | 'LIVREE';
  client?: Client;
  /** Nom du vendeur ayant créé la commande (renseigné côté serveur). */
  nomVendeur?: string;
  /** Date horodatée par le backend au passage à LIVREE. */
  dateLivraison?: number;
  /** Montant total calculé côté serveur (somme quantité × prix). */
  montantTotal?: number;
  idEntreprise?: number;
  ligneComandeClientList?: Array<LigneCommandeClient>;
  commandeLivree?: boolean;
}
