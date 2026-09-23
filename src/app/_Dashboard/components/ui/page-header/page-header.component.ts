import { Component, Input } from '@angular/core';

/**
 * En-tête de page standard STOCK-HUB : titre, sous-titre contextuel et
 * zone d'actions (boutons principaux à droite). Remplace les entêtes
 * ad-hoc dispersées dans les pages.
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent {

  @Input() titre = '';
  @Input() sousTitre = '';

  /** Libellé du bouton d'action principal (vide = pas d'action). */
  @Input() actionLibelle = '';

  /** Nom Lucide de l'icône de l'action principale. */
  @Input() actionIcone = 'plus';

  /** Déclenché au clic sur l'action principale. */
  actionClick = () => { /* fourni par la page via (actionClick) */ };
}
