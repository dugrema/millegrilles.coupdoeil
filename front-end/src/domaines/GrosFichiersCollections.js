import React from 'react';
import { Button, ButtonGroup, Row, Col } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import { dateformatter } from '../formatters';
import { IconeFichier, SectionSecurite } from '../mgcomponents/IconeFichier';
import { Feuille } from '../mgcomponents/Feuilles'
import { InputTextAreaMultilingueAutoSubmit } from '../mgcomponents/InputMultilingue'
import { PanneauListeFichiers } from './GrosFichiersFichiers';

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

  supprimerCollection = (uuidCollection) => {
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

  modifierCommentaire = (uuid, commentaires, champ) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.commenterCollection';
    let transaction = {
        uuid: uuid,
    }
    transaction[champ] = commentaires;
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  ajouterDocuments = (collectionuuid, listeDocuments) => {
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

  retirerFichiersCollection = (collectionUuid, listeUuids) => {
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

  figerCollection = (collectionUuid) => {
    // console.debug("Figer la collection " + collectionUuid);
    let domaine = 'millegrilles.domaines.GrosFichiers.figerCollection';
    let transaction = {
        uuid: collectionUuid,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  requeteTorrents = (listeHashstrings) => {
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

  demarrerTorrent = (uuidCollection) => {
    return this.webSocketManager.transmettreRequete('commande.torrent.seederTorrent', {uuid: uuidCollection})
    .catch( err => {
      // console.error("Erreur demarrage torrents");
      // console.error(err);
    });
  }

  arreterTorrents = (listeHashstrings) => {
    // console.debug("Arreter torrents");
    // console.debug(listeHashstrings);
    return this.webSocketManager.transmettreRequete('commande.torrent.supprimer', {hashlist: listeHashstrings})
    .catch( err => {
      // console.error("Erreur arret torrents");
      // console.error(err);
    });
  }

}

export class AffichageCollections extends React.Component {

  state = {
    commentaires: null,
    nouvelleEtiquette: '',
  }

  ajouterCarnet = event => {
    this.props.actionsCollections.ajouterDocuments(
      this.props.collectionCourante.uuid, this.props.carnet.selection);
  }

  retirerFichiersCollection = event => {
    let uuid = event.currentTarget.value;
    this.props.actionsCollections.retirerFichiersCollection(
      this.props.collectionCourante.uuid, [uuid]
    )
  }

  editerCommentaire = event => {
    const {name, value} = event.currentTarget;
    const maj = {};
    maj[name] = value;
    this.setState(maj);
  }

  changerPage = event => {
    let page = event.currentTarget.value;
    this.setState({pageCourante: page});
  }

  appliquerCommentaire = event => {
    const champ = event.currentTarget.name;
    const commentaires = this.state[champ];
    const maj = {};
    maj[champ] = null;

    if(commentaires && commentaires !== this.props.collectionCourante[champ]) {
      console.debug("Changer commentaire " + champ);
      console.debug(commentaires);

      this.props.actionsCollections.modifierCommentaire(
        this.props.collectionCourante.uuid, commentaires, champ)
      .catch(err=>{
        console.error("Erreur ajout commentaire");
        console.error(err);
        // Reset commentaire.
        this.setState(maj);
      })
    } else {
      // Rien a faire. Reset commentaire.
      this.setState(maj);
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
    const source = this.props.collectionCourante;
    const prevSource = prevProps.collectionCourante;

    const resetEtats = {};
    var changementRequis = false;
    if(source && prevSource) {
      for(let champ in source) {
        if(champ.startsWith('commentaires') &&
           source[champ] !== prevSource[champ] &&
           this.state[champ] === source[champ]) {
          // console.debug("Reset champ state : " + champ);
          resetEtats[champ] = null;
          changementRequis = true;
        }
      }
    }

    if(changementRequis){
      this.setState(resetEtats);
    }
  }

  render() {
    return (
      <section className="w3-card_liste_BR">

        <Commentaire
          actions={{
            changerNouvelleEtiquette: this.changerNouvelleEtiquette,
            ajouterNouvelleEtiquette: this.ajouterNouvelleEtiquette,
            supprimerEtiquette: this.supprimerEtiquette,
            nouvelleEtiquette: this.nouvelleEtiquette,
            editerCommentaire: this.editerCommentaire,
            appliquerCommentaire: this.appliquerCommentaire,
            supprimerFavori: this.props.actionsFavoris.supprimerFavori,
            ajouterFavori: this.props.actionsFavoris.ajouterFavori,
          }}
          {...this.state}
          {...this.props} />

        <SecuriteCollection
          actions={{
            changerNiveauSecurite: this.changerNiveauSecurite,
          }}
          {...this.props} />

        <ListeImages {...this.props} />

        <ListeDocuments
          actions={{
            ajouterCarnet: this.ajouterCarnet,
            figerCollection: this.figerCollection,
            retirerFichiersCollection: this.retirerFichiersCollection,
            chargeruuid: this.props.actionsNavigation.chargeruuid,
            telechargerEvent: this.props.actionsDownload.telechargerEvent,
            changerPage: this.changerPage,
            toggle: this.props.actionsCarnet.toggle,
          }}
          {...this.state}
          {...this.props} />

        <AffichageListeCollectionsFigees
          actions={{
            demarrerTorrent: this.props.actionsCollections.demarrerTorrent,
            arreterTorrents: this.props.actionsCollections.arreterTorrents,
            requeteTorrents: this.props.actionsCollections.requeteTorrents,
            chargeruuid: this.props.actionsNavigation.chargeruuid,
          }}
          collectionCourante={this.props.collectionCourante} />
      </section>
    );
  }
}

function SecuriteCollection(props) {

  var niveauSecurite;
  if(props.collectionCourante) {
    niveauSecurite = props.collectionCourante.securite;
  }

  let boutons = []
  if(niveauSecurite !== '2.prive') {
    boutons.push(
      <Button key="2.prive" variant="dark" onClick={props.actions.changerNiveauSecurite} value="2.prive">
        <Trans>global.securite.prive</Trans>
      </Button>
    );
  }
  if(niveauSecurite !== '1.public') {
    boutons.push(
      <Button key="1.public" variant="danger" onClick={props.actions.changerNiveauSecurite} value="1.public">
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

function ListeImages(props) {
  // Verifier si on a au moins une image - active la section thumbnail/preview
  var listeImages = [];
  for(let uuid in props.collectionCourante.documents) {
    let doc = props.collectionCourante.documents[uuid];
    if(doc.thumbnail) {
      // On a une image
      listeImages.push(
        <button key={doc.uuid} className="aslink imagefichier" onClick={props.actionsNavigation.chargeruuid} value={doc.uuid}>
          <img key={doc.uuid} src={'data:image/jpeg;base64,' + doc.thumbnail} alt={doc.nom}/>
        </button>
      );
    }
  }

  var sectionImages = null;
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

function Commentaire(props) {
  const collectionCourante = props.collectionCourante;

  let boutonFavori;
  if(props.favorisParUuid[collectionCourante.uuid]) {
    boutonFavori = (
      <button
        title="Favori"
        value={collectionCourante.uuid}
        onClick={props.actions.supprimerFavori}>
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
        onClick={props.actions.ajouterFavori}>
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
          <button onClick={props.actions.supprimerEtiquette} value={etiquette}>
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
        <input type="text" onChange={props.actions.changerNouvelleEtiquette} value={props.nouvelleEtiquette}/>
        <button onClick={props.actions.ajouterNouvelleEtiquette}>
          <i className="fa fa-plus"/>
        </button>
      </div>
    </div>
  );

  let commentaires = (
    <div className="w3-rowpadding">
      <div className="w3-col m12 commentaire">

        <InputTextAreaMultilingueAutoSubmit
          controlId="commentaires" valuePrefix="commentaires"
          contenu={collectionCourante} contenuEdit={props}
          onChange={props.actions.editerCommentaire} onBlur={props.actions.appliquerCommentaire}
          languePrincipale={props.documentIdMillegrille.langue}
          languesAdditionnelles={props.documentIdMillegrille.languesAdditionnelles}
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

export class AffichageCollectionFigee extends React.Component {

  state = {
    pageCourante: '1',
    elementsParPage: 10,
  }

  changerPage = event => {
    let page = event.currentTarget.value;
    this.setState({pageCourante: page});
  }

  render() {
    return (
      <section className="w3-card_liste_BR">
        <Commentaire {...this.props} />
        <ListeDocuments {...this.props} />
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
    this.props.actions.demarrerTorrent(uuidCollection)
    .catch(err=>{
      // Pass
    })
    .finally(()=>{
      this.rafraichirTorrents();
    })
  }

  arreterTorrent = event => {
    let hashstring = event.currentTarget.value;
    // console.debug("AffichageListeCollectionsFigees : arreter torrents " + hashstring);
    this.props.actions.arreterTorrents([hashstring])
    .catch(err=>{
      // Pass
    })
    .finally(()=>{
      this.rafraichirTorrents();
    })
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

      this.props.actions.requeteTorrents(listeHashstrings)
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

  render() {
    return (
      <Feuille>
        <h2><i className="fa fa-thumb-tack"/> Collections figees</h2>

        <div>
          <ListeCollectionsFigees
            {...this.props}
            torrentsActifs={this.state.torrentsActifs}
            actions={{
              chargeruuid: this.props.actions.chargeruuid,
              arreterTorrent: this.arreterTorrent,
              demarrerTorrent: this.demarrerTorrent,
            }} />
        </div>
      </Feuille>
    );
  }
}


function ListeDocuments(props) {
  // let listeDocuments = [];
  // let uuid = this.props.collectionCourante.uuid;

  return(
    <Feuille>

      <Row>

        <Col md={8}>
          <h2 className="w3-col m8">Contenu</h2>
        </Col>

        <Col md={4}>
          <div className="boutons-actions-droite">
            <span className="bouton-fa">
              <button title="Figer" onClick={props.actions.figerCollection}>
                <i className="fa fa-thumb-tack"/>
              </button>
            </span>
            <span className="bouton-fa">
              <button title="Coller carnet" onClick={props.actions.ajouterCarnet}>
                <i className="fa fa-clipboard">
                  <BadgeCarnet carnet={props.carnet}/>
                </i>
              </button>
            </span>

          </div>
        </Col>
      </Row>

      <ListeFichiers
        {...props}
        actions={{
          telechargerEvent: props.actionsDownload.telechargerEvent,
          ...props.actions
        }}
        />

    </Feuille>
  );
}

function BadgeCarnet(props) {
  let badgeCarnet = '';
  if(props.carnet.taille > 0) {
    badgeCarnet = (
      <span className="w3-badge w3-medium w3-green badge">{props.carnet.taille}</span>
    )
  }
  return badgeCarnet;
}

class ListeFichiers extends React.Component {

  state = {
    tri: 'nom',
    elementsParChargement: 50,
    nombreElementsCourants: 50,
  }

  suivant = event => {
    this.setState({
      nombreElementsCourants: this.state.nombreElementsCourants + this.state.elementsParChargement
    });
  }

  checkEntree = event => {
    let uuid = event.currentTarget.value;
    let dataset = event.currentTarget.dataset;
    // console.debug("Toggle selection " + uuid);
    // console.debug(dataset);
    this.props.actions.toggle(uuid, {...dataset});
  }

  render() {
    let fichiersRendered = [];

    if( this.props.collectionCourante.documents ) {

      let premierElem = (this.props.pageCourante-1) * this.props.elementsParPage;
      let dernierElem = premierElem + this.props.elementsParPage; // (+1)

      let selection = this.props.collectionCourante.documents;

      // Creer une liste de fichiers/collections et la trier
      let fichiers = [];
      for(let uuid in selection) {
        let contenu = selection[uuid];
        fichiers.push({...contenu, uuid});
      }
      fichiers.sort((a,b)=>{
        let nom_a = a[this.state.tri];
        let nom_b = b[this.state.tri];
        if(nom_a === nom_b) return 0;
        if(!nom_a) return 1;
        return nom_a.localeCompare(nom_b);
      })

      // console.debug("Collection fichiers");
      // console.debug(fichiers);

      var listeFichiersTronquee = fichiers;
      var boutonSuivant = null;
      if(this.state.nombreElementsCourants < fichiers.length) {
        listeFichiersTronquee = fichiers.slice(0, this.state.nombreElementsCourants);
        boutonSuivant = (
          <Row className="bas-page">
            <Col className="boutons-pages">
              <Button onClick={this.suivant}>
                Suivants
              </Button>
            </Col>
          </Row>
        );
      }

      fichiersRendered = (
        <div>
          <PanneauListeFichiers
            listeFichiers={listeFichiersTronquee}
            carnet={this.props.carnet}
            favorisParUuid={this.props.favorisParUuid}
            actions={{
              supprimerFavori: this.props.actionsFavoris.supprimerFavori,
              ajouterFavori: this.props.actionsFavoris.ajouterFavori,
              chargeruuid: this.props.actionsNavigation.chargeruuid,
              checkEntree: this.checkEntree,
              telechargerEvent: this.props.actionsDownload.telechargerEvent,
              retirerFichiersCollection: this.props.actions.retirerFichiersCollection,
            }} />

          {boutonSuivant}

        </div>
      );

      // for(let idx = premierElem; idx < dernierElem && idx < fichiers.length; idx++) {
      //   let fichier = fichiers[idx];
      //
      //   let icone = <IconeFichier type={fichier['_mg-libelle']} securite={fichier.securite} />
      //
      //   fichiersRendered.push(
      //     <div key={fichier.uuid} className="w3-row-padding tableau-fichiers">
      //
      //       <div className="w3-col m11">
      //         {icone}
      //         <button className="aslink" onClick={props.actions.chargeruuid} value={fichier.uuid}>
      //           {fichier.nom}
      //         </button>
      //       </div>
      //
      //       <div className="w3-col m1">
      //         <button
      //           title="Telecharger"
      //           value={fichier.uuid}
      //           onClick={props.actions.telechargerEvent}>
      //             <i className="fa fa-download"/>
      //         </button>
      //         <button value={fichier.uuid} onClick={props.actions.supprimerDuCarnet}>
      //           <i className="fa fa-remove" />
      //         </button>
      //       </div>
      //
      //     </div>
      //   );
      // }
    }

    return fichiersRendered;
  }
}

function BoutonsPages(props) {
  let boutonsPages = [];
  if(props.collectionCourante.documents) {
    let fichiers = props.collectionCourante.documents;
    let nbPages = Math.ceil(Object.keys(fichiers).length / props.elementsParPage);

    for(let page=1; page<=nbPages; page++) {
      let cssCourante = '';
      if(props.pageCourante === ''+page) {
        cssCourante = 'courante';
      }
      boutonsPages.push(
        <button key={page} onClick={props.actions.changerPage} value={page} className={cssCourante}>
          {page}
        </button>
      );
    }
  }
  return boutonsPages;
}

function ListeCollectionsFigees(props) {
  var liste = null;
  if(props.collectionCourante && props.collectionCourante.figees) {
    const collectionsFigees = props.collectionCourante.figees;

    liste = [];
    for(let idx in collectionsFigees) {
      let collectionFigee = collectionsFigees[idx];
      let uuidCollection = collectionFigee.uuid;
      let hashstring = collectionFigee['torrent_hashstring'];
      var boutonsTorrent;

      if(props.torrentsActifs) {
        const torrentInfo = props.torrentsActifs[hashstring];

        if(torrentInfo && torrentInfo.status === 6) { // Seeding
          // Afficher bouton arret
          boutonsTorrent = (
            <button onClick={props.actions.arreterTorrent} value={hashstring}>
              <i className="fa fa-stop" />
            </button>
          );
        } else {
          // Afficher bouton demarrer
          boutonsTorrent = (
            <button onClick={props.actions.demarrerTorrent} value={uuidCollection}>
              <i className="fa fa-play" />
            </button>
          );
        }
      }

      liste.push(
        <div key={collectionFigee.uuid}>
          <div>
            <button className='aslink' value={collectionFigee.uuid} onClick={props.actions.chargeruuid}>
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
