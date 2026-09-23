import { Injectable } from '@angular/core';
import { UserService } from './user.service';

export type Role = 'ADMIN' | 'MANAGER' | 'VENDEUR';

/**
 * Source unique de vérité sur le rôle de l'utilisateur connecté.
 * Toute la navigation et les affichages conditionnels passent par ce
 * service (plus de checks `roles[0].rolename` dispersés).
 */
@Injectable({ providedIn: 'root' })
export class RoleService {

  constructor(private userService: UserService) {}

  /** Rôle principal de l'utilisateur connecté (le premier trouvé). */
  get roleCourant(): Role | undefined {
    const roles = this.userService.getConnectedUser()?.roles ?? [];
    const premier = roles.find(r => r?.rolename === 'ADMIN' || r?.rolename === 'MANAGER' || r?.rolename === 'VENDEUR');
    return premier?.rolename as Role | undefined;
  }

  get estVendeur(): boolean {
    return this.roleCourant === 'VENDEUR';
  }

  get estManager(): boolean {
    return this.roleCourant === 'MANAGER';
  }

  get estAdmin(): boolean {
    return this.roleCourant === 'ADMIN';
  }

  /** ADMIN ou MANAGER : accès au pilotage (dashboard, exports…). */
  get peutPiloter(): boolean {
    return this.estAdmin || this.estManager;
  }

  /** ADMIN uniquement : gestion des utilisateurs, rôles… */
  get peutAdministrer(): boolean {
    return this.estAdmin;
  }

  /** ADMIN/MANAGER : gestion du catalogue et des partenaires. */
  get peutGererCatalogue(): boolean {
    return this.peutPiloter;
  }

  /** Rôles autorisés à exporter (aligné sur @PreAuthorize backend). */
  get peutExporter(): boolean {
    return this.peutPiloter;
  }

  /** Libellé lisible du rôle pour la sidebar/profil. */
  get libelleRole(): string {
    switch (this.roleCourant) {
      case 'ADMIN': return 'Administrateur';
      case 'MANAGER': return 'Manager';
      case 'VENDEUR': return 'Vendeur';
      default: return 'Utilisateur';
    }
  }
}
