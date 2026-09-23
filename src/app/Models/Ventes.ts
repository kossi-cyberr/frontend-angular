import { LigneVente } from "./LigneVente";

export interface Ventes {
  id?: number;
  code?: string;
  dateVente?: number;
  commentaire?: string;
  /** Nom facultatif du client (information enregistrée sur la vente). */
  nomClient?: string;
  /** Nom du vendeur ayant enregistré la vente (renseigné côté serveur). */
  nomVendeur?: string;
  ligneVentes?: Array<LigneVente>;
  idEntreprise?: number;
}
