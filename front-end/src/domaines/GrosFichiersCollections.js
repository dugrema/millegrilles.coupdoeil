import React from 'react';

export class ActionsCollections {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

  creerCollection(listeDocuments) {
    console.debug("Creer nouvelle collection avec documents: ");
    console.debug(listeDocuments);

    // Fabriquer un stub pour la collection.
    // Permet de charger a l'ecran avant de recevoir la nouvelle information
    // de creation de la collection.
    let stub_liste_documents = {};
    let listeDocumentsPlate = [];
    for(let uuid in listeDocuments) {
      let doc = listeDocuments[uuid];
      stub_liste_documents[doc.uuid] = {
        uuid: uuid,
        nom: doc.nom,
      };

      // Aplatir la liste pour la transaction
      listeDocumentsPlate.push({
        uuid: uuid,
        nom: doc.nom,
      })
    }

    let transaction = {
      documents: listeDocumentsPlate,
    }

    console.debug(transaction);

    this.webSocketManager.transmettreTransaction(
      'millegrilles.domaines.GrosFichiers.nouvelleCollection', transaction)
    .then(msg=>{

      let uuid = msg.uuid_collection;
      console.debug("Collection ajoutee: " + uuid);
      console.debug(msg);
      // Configure la collection courante, va permettre de charger
      // la page et de capturer le document une fois cree sur le serveur.
      this.reactModule.actionsNavigation.afficherDocument({
        '_mg-libelle': 'collection',
        uuid: uuid,
        documents: stub_liste_documents
      });

    }).catch(err=>{
      console.error("Erreur creation collection");
      console.error(err);
    });
  }

  supprimerCollection(uuidCollection) {
    let transaction = {
      "uuid": uuidCollection,
    }
    this.webSocketManager.transmettreTransaction(
      'millegrilles.domaines.GrosFichiers.supprimerCollection', transaction)
    .then(msg=>{
      console.debug("Collection supprime " + uuidCollection);
      let collectionCourante = this.state.collectionCourante;
      if(collectionCourante.uuid === uuidCollection) {
        // On va popper vers la liste globale
        this.setState({collectionCourante: null});
      }
    })
    .catch(err=>{
      console.error("Erreur suppression collection " + uuidCollection);
    });
  }

  ajouterDocuments(listeDocuments) {

  }

  supprimerDocuments(listeDocuments) {

  }

}

export class AffichageCollections extends React.Component {

  state = {
    nom: null,
  }

  componentDidUpdate(prevProps) {
    if(this.state.nom) {
      if(this.props.collectionCourante && this.props.collectionCourante.nom === this.state.nom) {
        // Reset nom, il a ete applique dans les props
        this.setState({nom: null});
      }
    }
  }

  render() {
    return (
      <section className="w3-card_liste_BR">

        <div className="w3-card w3-round w3-white w3-card">
          <div className="w3-container w3-padding">
            <h2><i className="fa fa-tags"/> Etiquettes</h2>
          </div>
        </div>

        <div className="w3-card w3-round w3-white w3-card">
          <div className="w3-container w3-padding">
            <h2>Commentaire</h2>
          </div>
        </div>

        <div className="w3-card w3-round w3-white w3-card">
          <div className="w3-container w3-padding">
            <h2>Contenu</h2>
          </div>
        </div>

      </section>
    );
  }
}
