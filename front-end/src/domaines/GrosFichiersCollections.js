import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Form, Button, ButtonGroup, ListGroup,
         Container, Row, Col } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import { dateformatter } from '../formatters';
import { IconeFichier, SectionSecurite } from '../mgcomponents/IconeFichier';
import { Feuille } from '../mgcomponents/Feuilles'

export class ActionsCollections {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

  renommer = (uuid, nouveauNom, champ) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.renommerCollection';
    let transaction = {
        uuid: uuid,
    }
    transaction[champ] = nouveauNom;
    // console.log("Transaction de collection")
    // console.log(transaction);

    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  creerCollection = listeDocuments => {
    // console.debug("Creer nouvelle collection avec documents: ");
    // console.debug(listeDocuments);

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

    // console.debug(transaction);

    this.webSocketManager.transmettreTransaction(
      'millegrilles.domaines.GrosFichiers.nouvelleCollection', transaction)
    .then(msg=>{

      let uuid = msg.uuid_collection;
      // console.debug("Collection ajoutee: " + uuid);
      // console.debug(msg);
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
      // console.debug("Collection supprime " + uuidCollection);
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
    // console.debug("Ajouter documents du carnet a collection " + collectionuuid);
    // console.debug(listeDocuments);

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

  changerEtiquettes = (uuid, etiquettes) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.changerEtiquettesCollection';
    let transaction = {
        uuid: uuid,
        etiquettes,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  changerNiveauSecurite = (collectionUuid, niveau) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.changerSecuriteCollection';
    let transaction = {
        uuid: collectionUuid,
        "niveau_securite_destination": niveau,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  retirerFichiersCollection(collectionUuid, listeUuids) {
    // console.debug("Ajouter documents du carnet a collection " + collectionUuid);
    // console.debug(listeUuids);

    if(listeUuids.length > 0) {
      let domaine = 'millegrilles.domaines.GrosFichiers.retirerFichiersCollection';
      let transaction = {
          uuid: collectionUuid,
          documents: listeUuids,
      }
      return this.webSocketManager.transmettreTransaction(domaine, transaction);
    }
  }

  figerCollection(collectionUuid) {
    // console.debug("Figer la collection " + collectionUuid);
    let domaine = 'millegrilles.domaines.GrosFichiers.figerCollection';
    let transaction = {
        uuid: collectionUuid,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  requeteTorrents(listeHashstrings) {
    return this.webSocketManager.transmettreRequete('requete.torrent.etat', {hashstrings: listeHashstrings})
    .then( docsRecu => {
      // console.log("Etat torrents:");
      // console.log(docsRecu);

      return docsRecu.torrents;
    })
    .catch( err => {
      console.error("Erreur reception sommaire torrents");
      console.error(err);
    });
  }

  demarrerTorrent(uuidCollection) {
    return this.webSocketManager.transmettreRequete('commande.torrent.seederTorrent', {uuid: uuidCollection})
    .catch( err => {
      console.error("Erreur demarrage torrents");
      console.error(err);
    });
  }

  arreterTorrents(listeHashstrings) {
    return this.webSocketManager.transmettreRequete('commande.torrent.supprimer', {hashlist: listeHashstrings})
    .catch( err => {
      console.error("Erreur arret torrents");
      console.error(err);
    });
  }

}

export class AffichageCollections extends React.Component {

  state = {
    pageCourante: '1',
    elementsParPage: 10,
    commentaires: null,
    nouvelleEtiquette: '',
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

  changerPage = event => {
    let page = event.currentTarget.value;
    this.setState({pageCourante: page});
  }

  appliquerCommentaire = event => {
    let commentaires = event.currentTarget.value;
    if(commentaires !== this.props.collectionCourante.commentaires) {
      this.props.actionsCollections.modifierCommentaire(
        this.props.collectionCourante.uuid, commentaires)
      .catch(err=>{
        console.error("Erreur ajout commentaire");
        console.error(err);
        // Reset commentaire.
        this.setState({commentaires: null});
      })
    } else {
      // Rien a faire. Reset commentaire.
      this.setState({commentaires: null});
    }
  }

  figerCollection = event => {
    this.props.actionsCollections.figerCollection(this.props.collectionCourante.uuid)
    .catch(err=>{
      console.error("Erreur figer collection");
      console.error(err);
    })
  }

  supprimerEtiquette = event => {
    let etiquetteASupprimer = event.currentTarget.value;

    const nouvelleListeEtiquettes = [];
    this.props.collectionCourante.etiquettes.forEach(etiquette=>{
      if(etiquette !== etiquetteASupprimer) {
        nouvelleListeEtiquettes.push(etiquette);
      }
    })

    this.props.actionsCollections.changerEtiquettes(this.props.collectionCourante.uuid, nouvelleListeEtiquettes);
  }

  changerNouvelleEtiquette = event => {
    let nouvelleEtiquette = event.currentTarget.value;
    this.setState({nouvelleEtiquette});
  }

  ajouterNouvelleEtiquette = event => {
    const nouvelleListeEtiquettes = [
      ...this.props.collectionCourante.etiquettes,
      this.state.nouvelleEtiquette
    ];
    this.props.actionsCollections.changerEtiquettes(this.props.collectionCourante.uuid, nouvelleListeEtiquettes);
    this.setState({nouvelleEtiquette: ''});
  }

  changerNiveauSecurite = event => {
    var niveauSecurite = event.currentTarget.value;
    this.props.actionsCollections.changerNiveauSecurite(
      this.props.collectionCourante.uuid, niveauSecurite);
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
    // let listeDocuments = [];
    // let uuid = this.props.collectionCourante.uuid;

    return(
      <Feuille>

        <div className="w3-rowpadding">

          <h2 className="w3-col m8">Contenu</h2>

          <div className="w3-col m4 boutons-actions-droite">
            <span className="bouton-fa">
              <button title="Figer" onClick={this.figerCollection}>
                <i className="fa fa-thumb-tack"/>
              </button>
            </span>
            <span className="bouton-fa">
              <button title="Coller carnet" onClick={this.ajouterCarnet}>
                <i className="fa fa-clipboard">
                  {this.renderBadgeCarnet()}
                </i>
              </button>
            </span>

          </div>
        </div>

        <div className="liste-fichiers">
          {this.genererListeFichiers()}
        </div>

        <div className="bas-page">
          <div className="w3-col m12 boutons-pages">
            {this.renderBoutonsPages()}
          </div>
        </div>

      </Feuille>
    );
  }

  renderSecuriteCollection() {

    var niveauSecurite;
    if(this.props.collectionCourante) {
      niveauSecurite = this.props.collectionCourante.securite;
    }

    let boutons = []
    if(niveauSecurite !== '2.prive') {
      boutons.push(
        <Button key="2.prive" variant="dark" onClick={this.changerNiveauSecurite} value="2.prive">
          <Trans>global.securite.prive</Trans>
        </Button>
      );
    }
    if(niveauSecurite !== '1.public') {
      boutons.push(
        <Button key="1.public" variant="danger" onClick={this.changerNiveauSecurite} value="1.public">
          <Trans>global.securite.public</Trans>
        </Button>
      );
    }

    return (
      <Feuille>
        <Row>
          <Col>
            <h2><Trans>grosFichiers.niveauSecurite</Trans></h2>
          </Col>
        </Row>
        <Row>
          <Col>
            <SectionSecurite securite={niveauSecurite} colfin={5}>
              <Col sm={5}><ButtonGroup>{boutons}</ButtonGroup></Col>
            </SectionSecurite>
          </Col>
        </Row>
      </Feuille>
    )
  }

  renderListeImages() {
    // Verifier si on a au moins une image - active la section thumbnail/preview
    var listeImages = [];
    for(let uuid in this.props.collectionCourante.documents) {
      let doc = this.props.collectionCourante.documents[uuid];
      if(doc.thumbnail) {
        // On a une image
        listeImages.push(
          <button className="aslink" onClick={this.props.actionsNavigation.chargeruuid} value={doc.uuid}>
            <img key={doc.uuid} src={'data:image/jpeg;base64,' + doc.thumbnail}/>
          </button>
        );
      }
    }

    var sectionImages;
    if(listeImages.length > 0) {
      sectionImages = (
        <Feuille>
          <Row>
            <Col>
              {listeImages}
            </Col>
          </Row>
        </Feuille>
      )
    }

    return sectionImages;
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

    let boutonFavori;
    if(this.props.favorisParUuid[collectionCourante.uuid]) {
      boutonFavori = (
        <button
          title="Favori"
          value={collectionCourante.uuid}
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
          value={collectionCourante.uuid}
          onClick={this.props.actionsFavoris.ajouterFavori}>
            <i className="fa fa-star-o favori-inactif"/>
        </button>
      );
    }

    let titre = (
      <div className="w3-rowpadding">
        <div className="w3-col m11">
          <h2><i className="fa fa-tags"/> Étiquettes et commentaires</h2>
        </div>
        <div className="w3-col m1">
          {boutonFavori}
        </div>
      </div>
    );

    let etiquettes = [];
    if(collectionCourante.etiquettes) {
      collectionCourante.etiquettes.forEach(etiquette => {
        etiquettes.push(
          <span key={etiquette} className="etiquette">
            <li className="fa fa-tag"/> {etiquette}
            <button onClick={this.supprimerEtiquette} value={etiquette}>
              <li className="fa fa-remove"/>
            </button>
          </span>
        );
      })
    };

    let ajouterEtiquette = (
      <div className="w3-rowpadding">
        <div className="w3-col m12">
          <label>Ajouter une étiquette : </label>
          <input type="text" onChange={this.changerNouvelleEtiquette} value={this.state.nouvelleEtiquette}/>
          <button onClick={this.ajouterNouvelleEtiquette}>
            <i className="fa fa-plus"/>
          </button>
        </div>
      </div>
    );

    let commentaires = (
      <div className="w3-rowpadding">
        <div className="w3-col m12 commentaire">
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
    );

    return (
      <Feuille>
        <div className="formulaire">
          {titre}

          <div className="w3-rowpadding">
            <div className="w3-col m12">
              {etiquettes}
            </div>
          </div>

          {ajouterEtiquette}

          {commentaires}
        </div>
      </Feuille>
    );
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

        let icone = <IconeFichier type={fichier['_mg-libelle']} securite={fichier.securite} />

        // fichier.securite.split('.')[1];
        //
        // let icone;
        // if(fichier['_mg-libelle'] === 'collection') {
        //   icone = (
        //     <span className="fa-stack fa-1g">
        //       <i className={"fa fa-file fa-stack-1x icone-gauche " + securitecss}/>
        //       <i className={"fa fa-file-o fa-stack-1x icone-gauche"}/>
        //     </span>
        //   );
        // } else if(fichier['_mg-libelle'] === 'collection') {
        //   icone = (
        //     <span className="fa-stack fa-1g">
        //       <i className={"fa fa-folder fa-stack-1x icone-gauche " + securitecss}/>
        //       <i className={"fa fa-folder-o fa-stack-1x icone-gauche"}/>
        //     </span>
        //   );
        // }


        fichiersRendered.push(
          <div key={fichier.uuid} className="w3-row-padding tableau-fichiers">

            <div className="w3-col m11">
              {icone}
              <button className="aslink" onClick={this.props.actionsNavigation.chargeruuid} value={fichier.uuid}>
                {fichier.nom}
              </button>
            </div>

            <div className="w3-col m1">
              <button
                title="Telecharger"
                value={fichier.uuid}
                onClick={this.props.actionsDownload.telechargerEvent}>
                  <i className="fa fa-download"/>
              </button>
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

  renderBoutonsPages() {
    let boutonsPages = [];
    if(this.props.collectionCourante.documents) {
      let fichiers = this.props.collectionCourante.documents;
      let nbPages = Math.ceil(Object.keys(fichiers).length / this.state.elementsParPage);

      for(let page=1; page<=nbPages; page++) {
        let cssCourante = '';
        if(this.state.pageCourante === ''+page) {
          cssCourante = 'courante';
        }
        boutonsPages.push(
          <button key={page} onClick={this.changerPage} value={page} className={cssCourante}>
            {page}
          </button>
        );
      }
    }
    return boutonsPages;
  }

  render() {
    return (
      <section className="w3-card_liste_BR">

        {this.renderCommentaire()}

        {this.renderSecuriteCollection()}

        {this.renderListeImages()}

        {this.renderListeDocuments()}

        <AffichageListeCollectionsFigees
          collectionCourante={this.props.collectionCourante}
          actionsCollections={this.props.actionsCollections}
          actionsNavigation={this.props.actionsNavigation}/>
      </section>
    );
  }
}

export class AffichageCollectionFigee extends React.Component {

  state = {
    pageCourante: '1',
    elementsParPage: 10,
  }

  changerPage = event => {
    let page = event.currentTarget.value;
    this.setState({pageCourante: page});
  }

  renderListeDocuments() {
    // let listeDocuments = [];
    // let uuid = this.props.collectionCourante.uuid;

    return(
      <Feuille>
        <div className="w3-rowpadding">

          <h2 className="w3-col m12"><i className="fa fa-thumb-tack"/> Contenu</h2>

        </div>

        <div className="liste-fichiers">
          {this.genererListeFichiers()}
        </div>

        <div className="bas-page">
          <div className="w3-col m12 boutons-pages">
            {this.renderBoutonsPages()}
          </div>
        </div>
      </Feuille>
    );
  }

  renderCommentaire() {
    let collectionCourante = this.props.collectionCourante;
    // let cssEdition = '';
    // if(this.state.commentaires) {
    //   cssEdition = 'edition-en-cours'
    // }

    let boutonFavori;
    if(this.props.favorisParUuid[collectionCourante.uuid]) {
      boutonFavori = (
        <button
          title="Favori"
          value={collectionCourante.uuid}
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
          value={collectionCourante.uuid}
          onClick={this.props.actionsFavoris.ajouterFavori}>
            <i className="fa fa-star-o favori-inactif"/>
        </button>
      );
    }

    let titre = (
      <div className="w3-rowpadding">
        <div className="w3-col m11">
          <h2><i className="fa fa-tags"/> Étiquettes et commentaires</h2>
        </div>
        <div className="w3-col m1">
          {boutonFavori}
        </div>
      </div>
    );

    let etiquettes = [];
    if(collectionCourante.etiquettes) {
      collectionCourante.etiquettes.forEach(etiquette => {
        etiquettes.push(
          <span key={etiquette} className="etiquette">
            {etiquette}
          </span>
        );
      })
    };

    let commentaires = (
      <div className="w3-rowpadding">
        <div className="w3-col m12 commentaire">
            {collectionCourante.commentaires}
        </div>
      </div>
    );

    return (
      <Feuille>
        <div className="formulaire">
          {titre}
          {etiquettes}
          {commentaires}
        </div>
      </Feuille>
    );
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

        let icone = <IconeFichier type={fichier['_mg-libelle']} securite={fichier.securite} />

        fichiersRendered.push(
          <div key={fichier.uuid} className="w3-row-padding tableau-fichiers">

            <div className="w3-col m11">
              {icone}
              <button className="aslink" onClick={this.props.actionsNavigation.chargeruuid} value={fichier.uuid}>
                {fichier.nom}
              </button>
            </div>

            <div className="w3-col m1">
              <button
                title="Telecharger"
                value={fichier.uuid}
                onClick={this.props.actionsDownload.telechargerEvent}>
                  <i className="fa fa-download"/>
              </button>
            </div>

          </div>
        );
      }
    }

    return fichiersRendered;
  }

  renderBoutonsPages() {
    let boutonsPages = [];
    if(this.props.collectionCourante.documents) {
      let fichiers = this.props.collectionCourante.documents;
      let nbPages = Math.ceil(Object.keys(fichiers).length / this.state.elementsParPage);

      for(let page=1; page<=nbPages; page++) {
        let cssCourante = '';
        if(this.state.pageCourante === ''+page) {
          cssCourante = 'courante';
        }
        boutonsPages.push(
          <button key={page} onClick={this.changerPage} value={page} className={cssCourante}>
            {page}
          </button>
        );
      }
    }
    return boutonsPages;
  }

  render() {
    return (
      <section className="w3-card_liste_BR">

        {this.renderCommentaire()}

        {this.renderListeDocuments()}

      </section>
    );
  }
}

class AffichageListeCollectionsFigees extends React.Component {

  intervalRefresh = null;

  state = {
    torrentsActifs: null,
  }

  demarrerTorrent = event => {
    let uuidCollection = event.currentTarget.value;
    this.props.actionsCollections.demarrerTorrent(uuidCollection)
  }

  arreterTorrent = event => {
    let hashstring = event.currentTarget.value;
    this.props.actionsCollections.arreterTorrents([hashstring])
  }

  rafraichirTorrents = () => {
    // console.log("Tenter de rafraichir info torrents")
    if(this.props.collectionCourante && this.props.collectionCourante.figees) {
      const collectionsFigees = this.props.collectionCourante.figees;

      const listeHashstrings = [];
      for(let idx in collectionsFigees) {
        let coll = collectionsFigees[idx];
        if(coll['torrent_hashstring']) {
          listeHashstrings.push(coll['torrent_hashstring']);
        }
      }

      this.props.actionsCollections.requeteTorrents(listeHashstrings)
      .then(reponse=>{
        // console.log("Reponse torrents demandes");
        // console.log(reponse);

        // Indexer par hashstring
        const torrentsActifs = {};
        for(let idx in reponse) {
          let torrent = reponse[idx];
          torrentsActifs[torrent.hashString] = torrent;
        }

        this.setState({torrentsActifs});
      })
    }
  }

  componentDidMount() {
    // console.debug("componentDidMount collections figees");
    this.rafraichirTorrents();  // Rafraichir immediatement
    this.intervalRefresh = setInterval(this.rafraichirTorrents, 10000);
  }

  componentWillUnmount() {
    // console.debug("componentWillUnmount collections figees");
    clearInterval(this.intervalRefresh);
  }

  afficherListe() {
    var liste = null;
    if(this.props.collectionCourante && this.props.collectionCourante.figees) {
      const collectionsFigees = this.props.collectionCourante.figees;

      liste = [];
      for(let idx in collectionsFigees) {
        let collectionFigee = collectionsFigees[idx];
        let uuidCollection = collectionFigee.uuid;
        let hashstring = collectionFigee['torrent_hashstring'];
        var boutonsTorrent;

        if(this.state.torrentsActifs) {
          const torrentInfo = this.state.torrentsActifs[hashstring];

          if(torrentInfo && torrentInfo.status === 6) { // Seeding
            // Afficher bouton arret
            boutonsTorrent = (
              <button onClick={this.arreterTorrent} value={hashstring}>
                <i className="fa fa-stop" />
              </button>
            );
          } else {
            // Afficher bouton demarrer
            boutonsTorrent = (
              <button onClick={this.demarrerTorrent} value={uuidCollection}>
                <i className="fa fa-play" />
              </button>
            );
          }
        }


        liste.push(
          <div key={collectionFigee.uuid}>
            <div>
              <button className='aslink' value={collectionFigee.uuid} onClick={this.props.actionsNavigation.chargeruuid}>
                {dateformatter.format_datetime(collectionFigee.date)}
              </button>
            </div>
            <div>{hashstring}</div>
            <div>{boutonsTorrent}</div>
          </div>
        )
      }

    }

    return liste;
  }

  render() {
    return (
      <Feuille>
        <h2><i className="fa fa-thumb-tack"/> Collections figees</h2>

        <div>
          {this.afficherListe()}
        </div>
      </Feuille>
    );
  }
}
