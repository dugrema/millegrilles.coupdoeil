// Module pour les menus
export class MenuGauche {

  constructor(divMenu) {
    this.divMenu = divMenu;
    this.menu_item_template =
      '<button class="w3-button w3-block w3-theme-l1 w3-left-align bouton-menu-gauche">'
      + '<!-- route="%ROUTE%" -->'
      + '<i class="fa %ICON% fa-fw w3-margin-right"></i>'
      + '%LIBELLE%'
      + '</button>';
    this.menuItems = [];
  };

  ajouterMenu(route, icon, libelle) {
    let menu_item = this.menu_item_template
      .replace(/%ROUTE%/, route)
      .replace(/%ICON%/, icon)
      .replace(/%LIBELLE%/, libelle);

    this.menuItems.push(menu_item);
  };

  appliquer() {
    this.divMenu.empty();

    let menu = '';
    for(let menuItem in this.menuItems) {
      let menuItemContent = this.menuItems[menuItem];
      this.divMenu.append(menuItemContent);
    }
  };
}
