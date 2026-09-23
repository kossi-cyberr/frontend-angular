import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommandeClient } from '../Models/CommandeClient';
import { LigneCommandeClient } from '../Models/LigneCommandeClient';
import { PageResponse } from '../Models/PageResponse';
import { Observable } from 'rxjs/internal/Observable';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class CommandeClientService {

  APP_URL = environment.apiUrl + '/commandesclients';

  constructor(private httpClient: HttpClient,
    private userService: UserService) {}

  enregistrerCommande(commande: CommandeClient): Observable<CommandeClient> {
    commande.idEntreprise = this.userService.getConnectedUser()?.entreprise?.id;
    return this.httpClient.post<CommandeClient>(`${this.APP_URL}/create`, commande);
  }

  findAll(): Observable<CommandeClient[]> {
    return this.httpClient.get<CommandeClient[]>(`${this.APP_URL}/all`);
  }

  /** Liste paginée, filtrable par code, état et vendeur (filtrage côté serveur). */
  findAllPaged(page = 0, size = 10, search = '', etatCommande = '', vendeurId = ''): Observable<PageResponse<CommandeClient>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (etatCommande) {
      params = params.set('etatCommande', etatCommande);
    }
    if (vendeurId) {
      params = params.set('vendeurId', vendeurId);
    }
    return this.httpClient.get<PageResponse<CommandeClient>>(`${this.APP_URL}/paged`, { params });
  }

  findCommandeById(idCommande: number): Observable<CommandeClient> {
    return this.httpClient.get<CommandeClient>(`${this.APP_URL}/${idCommande}`);
  }

  /** Lignes d'une commande (le détail n'est pas renvoyé par /all). */
  findLignesCommande(idCommande: number): Observable<LigneCommandeClient[]> {
    return this.httpClient.get<LigneCommandeClient[]>(`${this.APP_URL}/lignesCommande/${idCommande}`);
  }

  changerEtat(idCommande: number, etat: string): Observable<CommandeClient> {
    return this.httpClient.patch<CommandeClient>(`${this.APP_URL}/update/etat/${idCommande}/${etat}`, {});
  }

  deleteCommande(idCommande: number): Observable<any> {
    return this.httpClient.delete(`${this.APP_URL}/delete/${idCommande}`);
  }

  /** Télécharge la facture PDF de la commande. */
  telechargerFacturePdf(idCommande: number): Observable<Blob> {
    return this.httpClient.get(`${this.APP_URL}/${idCommande}/facture/pdf`, { responseType: 'blob' });
  }
}
