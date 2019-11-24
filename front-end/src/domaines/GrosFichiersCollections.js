import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

export class ActionsCollections {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

  renommer = (uuid, nouveauNom) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.renommerCollection';
    let transaction = {
        uuid: uuid,
        nom: nouveauNom,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  creerCollection = listeDocuments => {
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

  modifierCommentaire = (uuid, commentaires) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.commenterCollection';
    let transaction = {
        uuid: uuid,
        commentaires: commentaires,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  ajouterDocuments(collectionuuid, listeDocuments) {
    console.debug("Ajouter documents du carnet a collection " + collectionuuid);
    console.debug(listeDocuments);

    let listeUuids = Object.keys(listeDocuments);

    if(listeUuids.length > 0) {
      let domaine = 'millegrilles.domaines.GrosFichiers.ajouterFichiersCollection';
      let transaction = {
          uuid: collectionuuid,
          documents: listeUuids,
      }
      return this.webSocketManager.transmettreTransaction(domaine, transaction);
    }
  }

  retirerFichiersCollection(collectionUuid, listeUuids) {
    console.debug("Ajouter documents du carnet a collection " + collectionUuid);
    console.debug(listeUuids);

    if(listeUuids.length > 0) {
      let domaine = 'millegrilles.domaines.GrosFichiers.retirerFichiersCollection';
      let transaction = {
          uuid: collectionUuid,
          documents: listeUuids,
      }
      return this.webSocketManager.transmettreTransaction(domaine, transaction);
    }
  }

}

export class AffichageCollections extends React.Component {

  state = {
    pageCourante: 1,
    elementsParPage: 10,
    commentaires: null,
  }

  ajouterCarnet = event => {
    this.props.actionsCollections.ajouterDocuments(
      this.props.collectionCourante.uuid, this.props.carnet.selection);
  }

  supprimerDuCarnet = event => {
    let uuid = event.currentTarget.value;
    this.props.actionsCollections.retirerFichiersCollection(
      this.props.collectionCourante.uuid, [uuid]
    )
  }

  editerCommentaire = event => {
    let commentaires = event.currentTarget.value;
    this.setState({commentaires});
  }

  appliquerCommentaire = event => {
    let commentaires = event.currentTarget.value;
    if(commentaires !== this.props.collectionCourante.commentaires) {
      this.props.actionsCollections.modifierCommentaire(
        this.props.collectionCourante.uuid, commentaires)
      .then(msg=>{
        // Rien a faire.
      })
      .catch(err=>{
        console.error("Erreur ajout commentaire");
        console.err(err);
        // Reset commentaire.
        this.setState({commentaires: null});
      })
    } else {
      // Rien a faire. Reset commentaire.
      this.setState({commentaires: null});
    }
  }

  // Verifier si on peut resetter les versions locales des proprietes editees.
  componentDidUpdate(prevProps) {

    let resetState = {};
    if(this.state.commentaires) {
      if(this.state.commentaires === this.props.collectionCourante.commentaires) {
        resetState.commentaires = null;
      }
    }

    if(Object.keys(resetState).length > 0) {
      this.setState(resetState);
    }
  }

  renderListeDocuments() {
    let listeDocuments = [];
    let uuid = this.props.collectionCourante.uuid;

    let boutonFavori;
    if(this.props.favorisParUuid[uuid]) {
      boutonFavori = (
        <button
          title="Favori"
          value={uuid}
          onClick={this.props.actionsFavoris.supprimerFavori}>
            <span className="fa-stack favori-actif">
              <i className='fa fa-star fa-stack-1x fond'/>
              <i className='fa fa-star-o fa-stack-1x'/>
            </span>
        </button>
      );
    } else {
      boutonFavori = (
        <button
          title="Favori"
          value={uuid}
          onClick={this.props.actionsFavoris.ajouterFavori}>
            <i className="fa fa-star-o favori-inactif"/>
        </button>
      );
    }

    return(
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding">

          <div className="w3-rowpadding">

            <h2 className="w3-col m8">Contenu</h2>

            <div className="w3-col m4 boutons-actions-droite">
              {boutonFavori}
              <span className="bouton-fa">
                <button title="Coller carnet" onClick={this.ajouterCarnet}>
                  <i className="fa fa-clipboard">
                    {this.renderBadgeCarnet()}
                  </i>
                </button>
              </span>

            </div>
          </div>

          {this.genererListeFichiers()}

        </div>
      </div>
    );
  }

  renderBadgeCarnet() {
    let badgeCarnet = '';
    if(this.props.carnet.taille > 0) {
      badgeCarnet = (
        <span className="w3-badge w3-medium w3-green badge">{this.props.carnet.taille}</span>
      )
    }
    return badgeCarnet;
  }

  renderCommentaire() {
    let collectionCourante = this.props.collectionCourante;
    let cssEdition = '';
    if(this.state.commentaires) {
      cssEdition = 'edition-en-cours'
    }

    let commentaires = (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <div className="formulaire">

            <div className="w3-col m12">
              <TextareaAutosize
                name="commentaires"
                className={"autota-width-max editable " + cssEdition}
                onChange={this.editerCommentaire}
                onBlur={this.appliquerCommentaire}
                value={this.state.commentaires || collectionCourante.commentaires || ''}
                placeholder="Ajouter un commentaire ici..."
                />
            </div>

          </div>
        </div>
      </div>
    );

    return commentaires;
  }

  genererListeFichiers() {
    let fichiersRendered = [];

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
              <button value={fichier.uuid} onClick={this.supprimerDuCarnet}>
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

        {this.renderCommentaire()}

        {this.renderListeDocuments()}

      </section>
    );
  }
}
