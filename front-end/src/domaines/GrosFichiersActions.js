export class ActionsFavoris {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

  ajouterFavori = event => {
    let uuidFavori = event.currentTarget.value;
    console.debug("Ajouter favori " + uuidFavori);

    let transaction = {
      "uuid": uuidFavori,
    }

    this.webSocketManager.transmettreTransaction(
      'millegrilles.domaines.GrosFichiers.ajouterFavori', transaction)
    .then(msg=>{
      console.debug("Favori ajoute: " + uuidFavori);
    }).catch(err=>{
      console.error("Erreur ajout favori");
      console.error(err);
    });

  }

  supprimerFavori = event => {
    let uuidFavori = event.currentTarget.value;
    console.debug("Supprimer favori " + uuidFavori);

    let transaction = {
      "uuid": uuidFavori,
    }

    this.webSocketManager.transmettreTransaction(
      'millegrilles.domaines.GrosFichiers.supprimerFavori', transaction)
    .then(msg=>{
      console.debug("Favori supprime: " + uuidFavori);
    }).catch(err=>{
      console.error("Erreur suppression favori");
      console.error(err);
    });

  }

}
