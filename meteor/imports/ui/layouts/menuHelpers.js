// Module pour les menus
export class MenuGauche {

  constructor(divMenu) {
    this.divMenu = divMenu;
    this.menu_item_template =
      '<button class="w3-button w3-block w3-theme-l1 w3-left-align %CLASSE%">'
      + '<i class="fa %ICON% fa-fw w3-margin-right"></i>'
      + '%LIBELLE%'
      + '</button>';
    this.menuItems = [];
  };

  ajouterMenu(classe, icon, libelle) {
    let menu_item = this.menu_item_template
      .replace(/%CLASSE%/, classe)
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
