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
      stub_liste_documents[uuid] = {
        '_mg-libelle': 'collection',
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
    pageCourante: 1,
    elementsParPage: 10,
  }

  componentDidUpdate(prevProps) {
    if(this.state.nom) {
      if(this.props.collectionCourante && this.props.collectionCourante.nom === this.state.nom) {
        // Reset nom, il a ete applique dans les props
        this.setState({nom: null});
      }
    }
  }

  renderListeDocuments() {
    let listeDocuments = [];

    return(
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding">

          <div>
            <h2>Contenu</h2>

            {this.genererListeFichiers()}
          </div>

        </div>
      </div>
    );
  }

  genererListeFichiers() {
    let fichiersRendered = [];
    console.debug("Documents de la collection");
    console.debug(this.props.collectionCourante);

    if( this.props.collectionCourante.documents ) {

      let premierElem = (this.state.pageCourante-1) * this.state.elementsParPage;
      let dernierElem = premierElem + this.state.elementsParPage; // (+1)

      let selection = this.props.collectionCourante.documents;

      // Creer une liste de fichiers/collections et la trier
      let fichiers = [];
      for(let uuid in selection) {
        let contenu = selection[uuid];
        fichiers.push({...contenu, uuid});
      }
      fichiers.sort((a,b)=>{
        let nom_a = a['nom'];
        let nom_b = b['nom'];
        if(nom_a === nom_b) return 0;
        if(!nom_a) return 1;
        return nom_a.localeCompare(nom_b);
      })

      for(let idx = premierElem; idx < dernierElem && idx < fichiers.length; idx++) {
        let fichier = fichiers[idx];

        let icone = (<i className="fa fa-file-o icone-gauche"/>);
        if(fichier['_mg-libelle'] === 'collection') {
          icone = (<i className="fa fa-folder-o"/>);
        }

        fichiersRendered.push(
          <div key={fichier.uuid} className="w3-row-padding tableau-fichiers">

            <div className="w3-col m11">
              {icone}
              <button className="aslink" onClick={this.props.actionsNavigation.chargeruuid} value={fichier.uuid}>
                {fichier.nom}
              </button>
            </div>

            <div className="w3-col m1">
              <button value={fichier.uuid} onClick={this.supprimerDocument}>
                <i className="fa fa-remove" />
              </button>
            </div>

          </div>
        );
      }
    }

    return fichiersRendered;
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

        {this.renderListeDocuments()}

      </section>
    );
  }
}
