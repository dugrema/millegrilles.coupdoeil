// Module pour les menus
import { ReactiveVar } from 'meteor/reactive-var';

// Variable qui conserve l'object pour le menu courant
export const menuCourant = new ReactiveVar();

// Classe utilisee pour configurer le menu de chaque domaine
export class ConfigurationMenu {

  constructor() {
    this.menu_item_template =
      '<button class="w3-button w3-block w3-theme-l%NIVEAU% w3-left-align bouton-menu-gauche">'
      + '<!-- route="%ROUTE%" -->'
      + '<i class="fa %ICON% fa-fw w3-margin-right"></i>'
      + '%LIBELLE%'
      + '</button>';

    this.menuItems = [];
    this.initialise = false;
  }

  ajouterMenuItem(route, icon, libelle, niveau=1, parametres={}) {
    let params = {
      route: route,
      parametres: parametres,
      icon: icon,
      libelle: libelle,
      niveau: niveau
    };

    this.menuItems.push(params);
  }

  getItems() {
    return this.menuItems;
  }

  isInitialise() {
    return this.initialise;
  }

  setInitialise() {
    this.initialise = true;
  }

  appliquer(divMenu) {
    divMenu.empty(); // Vider le menu existant, on le regenere.

    for(let item_idx in this.menuItems) {
      let item = this.menuItems[item_idx];
      let menu_item_html = this.menu_item_template
        .replace(/%ROUTE%/, item['route'])
        .replace(/%ICON%/, item['icon'])
        .replace(/%LIBELLE%/, item['libelle'])
        .replace(/%NIVEAU%/, item['niveau']+1);

      // Appliquer au menu de gauche dans la page web
      divMenu.append(menu_item_html);
    }
  }

  html() {
    let contenu_html = '';
    for(let item_idx in this.menuItems) {
      let item = this.menuItems[item_idx];
      let menu_item_html = this.menu_item_template
        .replace(/%ROUTE%/, item['route'])
        .replace(/%ICON%/, item['icon'])
        .replace(/%LIBELLE%/, item['libelle'])
        .replace(/%NIVEAU%/, item['niveau']+1);

      contenu_html += menu_item_html;
    }

    return contenu_html;
  }

};

// Domaine Principale
export const MenuPrincipale = new ConfigurationMenu();
if(!MenuPrincipale.isInitialise()) {
  MenuPrincipale.ajouterMenuItem('Principale.show', 'fa-globe', 'Sommaire');
  MenuPrincipale.ajouterMenuItem('Principale.parametres.show', 'fa-sliders', 'Paramètres');
  MenuPrincipale.setInitialise();
} else {
  console.warn("MenuPrincipale deja initialise");
}

// Domaine SenseursPassifs
export const MenuSenseursPassifs = new ConfigurationMenu();
if(!MenuSenseursPassifs.isInitialise()) {
  MenuSenseursPassifs.ajouterMenuItem('SenseursPassifs.show', 'fa-globe', 'Liste noeuds');
  MenuSenseursPassifs.ajouterMenuItem('SenseursPassifs.Senseur.show', 'fa-sliders', 'Senseur');
  MenuSenseursPassifs.setInitialise();
} else {
  console.warn("MenuSenseursPassifs deja initialise");
}
