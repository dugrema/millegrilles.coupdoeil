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
    this.parent = null;
  }

  clone() {
    let menu2 = new ConfigurationMenu();
    menu2.menuItems = this.menuItems.slice(0);
    return menu2;
  }

  // Permet d'ajouter des menus sous un parent
  setParent(route) {
    for(let item_idx in this.menuItems) {
      let item = this.menuItems[item_idx];
      if(item.route === route) {
        this.parent = item_idx+1;
      }
    }
  }

  ajouterMenuItem(route, icon, libelle, niveau=1, parametres={}) {
    let params = {
      route: route,
      parametres: parametres,
      icon: icon,
      libelle: libelle,
      niveau: niveau
    };

    if(this.parent === null) {
      this.menuItems.push(params);
    } else {
      this.menuItems.splice(this.parent++, 0, params);
    }
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

  setParametres(route, parametres) {
    for(let item_idx in this.menuItems) {
      let item = this.menuItems[item_idx];
      if(item.route === route) {
        item.parametres = parametres;
      }
    }
  }

  getParametres(route) {
    for(let item_idx in this.menuItems) {
      let item = this.menuItems[item_idx];
      if(item.route === route) {
        return item.parametres;
      }
    }

    return {};
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
  MenuSenseursPassifs.ajouterMenuItem('SenseursPassifs.Configuration.show', 'fa-sliders', 'Configuration');
  MenuSenseursPassifs.setInitialise();
} else {
  console.warn("MenuSenseursPassifs deja initialise");
}
