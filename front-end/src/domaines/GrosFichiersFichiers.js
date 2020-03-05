import React from 'react';
import { Row, Col, Button, ButtonGroup } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import {filesizeformatter, dateformatter} from '../formatters'
import {DateTimeFormatter} from '../mgcomponents/ReactFormatters'
import { IconeFichier, SectionSecurite } from '../mgcomponents/IconeFichier'
import { Feuille } from '../mgcomponents/Feuilles'
import { InputTextAreaMultilingueAutoSubmit } from '../mgcomponents/InputMultilingue'

export class ActionsFichiers {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

  renommer = (uuid, nouveauNom, champ) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.renommerFichier';
    let transaction = {
        uuid: uuid,
    }
    transaction[champ] = nouveauNom;
    // console.log("Transaction de fichier")
    // console.log(transaction);

    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  supprimer = (uuid) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.supprimerFichier';
    let transaction = {
        uuid: uuid,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  recuperer = (uuid) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.recupererFichier';
    let transaction = {
        uuid: uuid,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  modifierCommentaire = (uuid, commentaires, champ) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.commenterFichier';
    let transaction = {
        uuid: uuid,
    }
    transaction[champ] = commentaires;
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  changerEtiquettes = (uuid, etiquettes) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.changerEtiquettesFichier';
    let transaction = {
        uuid: uuid,
        etiquettes,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  decrypter = fuuid => {
    let domaine = 'millegrilles.domaines.GrosFichiers.decrypterFichier';
    let transaction = {
        fuuid: fuuid,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

}

// Affichage d'un fichier avec toutes ses versions
export class AffichageFichier extends React.Component {

  state = {
    commentaires: null,
    nouvelleEtiquette: '',
  }

  supprimer = event => {
    let uuid = event.currentTarget.value;
    this.props.actionsFichiers.supprimer(uuid);
  }

  recuperer = event => {
    let uuid = event.currentTarget.value;
    this.props.actionsFichiers.recuperer(uuid);
  }

  editerCommentaire = event => {
    const {name, value} = event.currentTarget;
    const maj = {};
    maj[name] = value;
    this.setState(maj);
  }

  appliquerCommentaire = event => {
    const champ = event.currentTarget.name;
    const commentaires = this.state[champ];

    if(commentaires && commentaires !== this.props.fichierCourant[champ]) {
      this.props.actionsFichiers.modifierCommentaire(
        this.props.fichierCourant.uuid, commentaires, champ)
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

  checkEntree = event => {
    let uuid = event.currentTarget.value;
    let dataset = event.currentTarget.dataset;
    // console.debug("Toggle selection " + uuid);
    this.props.actionsCarnet.toggle(uuid, {...dataset});
  }

  supprimerEtiquette = event => {
    let etiquetteASupprimer = event.currentTarget.value;

    const nouvelleListeEtiquettes = [];
    this.props.fichierCourant.etiquettes.forEach(etiquette=>{
      if(etiquette !== etiquetteASupprimer) {
        nouvelleListeEtiquettes.push(etiquette);
      }
    })

    this.props.actionsFichiers.changerEtiquettes(this.props.fichierCourant.uuid, nouvelleListeEtiquettes);
  }

  changerNouvelleEtiquette = event => {
    let nouvelleEtiquette = event.currentTarget.value;
    this.setState({nouvelleEtiquette});
  }

  ajouterNouvelleEtiquette = event => {
    const nouvelleListeEtiquettes = [
      ...this.props.fichierCourant.etiquettes,
      this.state.nouvelleEtiquette
    ];
    this.props.actionsFichiers.changerEtiquettes(this.props.fichierCourant.uuid, nouvelleListeEtiquettes);
    this.setState({nouvelleEtiquette: ''});
  }

  changerSecurite = event => {
    let securiteDestination = event.currentTarget.value;
    let fuuid = this.props.fichierCourant.fuuid_v_courante;
    let securiteCourante = this.props.fichierCourant.securite;

    let decrypterNecessaire = false;
    if(securiteCourante === '4.secure' || securiteCourante === '3.protege') {
      if(securiteDestination === '2.prive' || securiteDestination === '1.public') {
        decrypterNecessaire = true;
      }
    }

    if(decrypterNecessaire) {
      this.props.actionsFichiers.decrypter(fuuid, securiteDestination);
    } else {
      throw new Error("Pas implemente");
    }
  }

  // Verifier si on peut resetter les versions locales des proprietes editees.
  componentDidUpdate(prevProps) {
    const source = this.props.fichierCourant;
    const prevSource = prevProps.fichierCourant;

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

  renderSelectionCarnet() {
    let check;
    if(this.props.carnet.selection[this.props.fichierCourant.uuid]) {
      check = ((<i className="fa fa-check-square-o fa-2x"/>));
    } else {
      check = ((<i className="fa fa-square-o fa-2x"/>));
    }
    return check;
  }

  renderInformationFichier() {

    const fichierCourant = this.props.fichierCourant;
    const dateFichierCourant = dateformatter.format_datetime(fichierCourant.date_v_courante);
    // dateFichierCourant.setUTCSeconds(fichierCourant.date_v_courante);
    const versionCourante = fichierCourant.versions[fichierCourant.fuuid_v_courante];

    let fichierSupprime = fichierCourant.supprime;
    let boutonSupprimerRecuperer;
    let informationSuppression = null;
    if(fichierSupprime) {
      informationSuppression = (
        <div className="w3-row-padding">
          <div className="w3-col m3 label">Supression :</div>
          <div className="w3-col m9 champ">{dateformatter.format_datetime(fichierCourant.date_suppression)}</div>
        </div>

      )

      boutonSupprimerRecuperer = (
        <button
          title="Récupérer"
          value={fichierCourant.uuid}
          onClick={this.recuperer}>
            <i className="fa fa-recycle"/>
        </button>
      )
    } else {
      boutonSupprimerRecuperer = (
        <button
          title="Supprimer"
          value={fichierCourant.uuid}
          onClick={this.supprimer}>
            <i className="fa fa-trash-o"/>
        </button>
      )
    }

    var thumbnail;
    if(versionCourante.thumbnail) {
      thumbnail = (
        <div className="w3-row-padding">
          <img src={'data:image/jpeg;base64,' + versionCourante.thumbnail} alt={fichierCourant.nom}/>
        </div>
      );
    }

    let boutonsSecurite = []
    if(fichierCourant.securite !== '2.prive') {
      boutonsSecurite.push(
        <Button key="2.prive" variant="dark" onClick={this.changerSecurite} title="Appliquer securite privee" value="2.prive">
          <Trans>global.securite.prive</Trans>
        </Button>
      );
    }
    // if(fichierCourant.securite !== '1.public') {
    //   boutonsSecurite.push(<Button variant="danger"><Trans>global.securite.public</Trans></Button>);
    // }


    let informationFichier = (
      <Feuille>
        <div className="m3-col m12 formulaire">

          <div className="row-donnees">
            <div className="w3-col m9">
              <h2>Information</h2>
            </div>
            <div className="w3-col m2 boutons-actions-droite">
              <button className="nobutton button-2x" onClick={this.checkEntree}
                value={fichierCourant.uuid}
                data-nom={fichierCourant.nom}
                data-datemodification={fichierCourant['_mg-derniere-modification']}>
                {this.renderSelectionCarnet()}
              </button>
              <button
                title="Telecharger"
                value={fichierCourant.uuid}
                data-extension={fichierCourant.extension}
                onClick={this.props.actionsDownload.telechargerEvent}>
                  <i className="fa fa-download"/>
              </button>
            </div>
            <div className="w3-col m1 boutons-actions-droite">
              {boutonSupprimerRecuperer}
            </div>
          </div>

          {thumbnail}

          <div className="w3-row-padding">
            <div className="w3-col m3 label">Date :</div>
            <div className="w3-col m9 champ">{dateFichierCourant.toString()}</div>
          </div>
          <div className="w3-row-padding">
            <div className="w3-col m3 label">Taille : </div>
            <div className="w3-col m9 champ">{filesizeformatter.format(fichierCourant.taille)} ({fichierCourant.taille} octets)</div>
          </div>
          <div className="w3-row-padding">
            <div className="w3-col m3 label">UUID permanent :</div>
            <div className="w3-col m9 champ">{fichierCourant.uuid}</div>
          </div>
          <div className="w3-row-padding">
            <div className="w3-col m3 label">FUUID courant :</div>
            <div className="w3-col m9 champ">{fichierCourant.fuuid_v_courante}</div>
          </div>

          <Row>
            <Col>
              <SectionSecurite securite={fichierCourant.securite} colfin={5}>
                <Col sm={5}><ButtonGroup>{boutonsSecurite}</ButtonGroup></Col>
              </SectionSecurite>
            </Col>
          </Row>

          {informationSuppression}

        </div>
      </Feuille>
    );

    return informationFichier;
  }

  renderCommentaire() {
    let fichierCourant = this.props.fichierCourant;

    let boutonFavori;
    if(this.props.favorisParUuid[fichierCourant.uuid]) {
      boutonFavori = (
        <button
          title="Favori"
          value={fichierCourant.uuid}
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
          value={fichierCourant.uuid}
          onClick={this.props.actionsFavoris.ajouterFavori}>
            <i className="fa fa-star-o favori-inactif"/>
        </button>
      );
    }

    let etiquettes = [];
    if(fichierCourant.etiquettes) {
      fichierCourant.etiquettes.forEach(etiquette => {
        etiquettes.push(
          <span key={etiquette} className="etiquette">
            <li className="fa fa-tag"/> {etiquette}
            <button onClick={this.supprimerEtiquette} value={etiquette}>
              <li className="fa fa-remove"/>
            </button>
          </span>
        );
      })
    }

    let commentaires = (
      <Feuille>
        <div className="formulaire">

          <div className="w3-rowpadding">
            <div className="w3-col m11">
              <h2><i className="fa fa-tags"/> Étiquettes et commentaires</h2>
            </div>
            <div className="w3-col m1">
              {boutonFavori}
            </div>
          </div>

          <div className="w3-rowpadding">
            <div className="w3-col m12">
              {etiquettes}
            </div>
          </div>

          <div className="w3-rowpadding">
            <div className="w3-col m12">
              <label>Ajouter une étiquette : </label>
              <input type="text" onChange={this.changerNouvelleEtiquette} value={this.state.nouvelleEtiquette}/>
              <button onClick={this.ajouterNouvelleEtiquette}>
                <i className="fa fa-plus"/>
              </button>
            </div>
          </div>

          <div className="w3-rowpadding">
            <div className="w3-col m12 commentaire">

              <InputTextAreaMultilingueAutoSubmit
                controlId="commentaires" valuePrefix="commentaires"
                contenu={fichierCourant} contenuEdit={this.state}
                onChange={this.editerCommentaire} onBlur={this.appliquerCommentaire}
                languePrincipale={this.props.documentIdMillegrille.langue}
                languesAdditionnelles={this.props.documentIdMillegrille.languesAdditionnelles}
                placeholder="Ajouter un commentaire ici..."
                />

            </div>
          </div>

        </div>
      </Feuille>
    );

    // <TextareaAutosize
    //   name="commentaires"
    //   className={"autota-width-max editable " + cssEdition}
    //   onChange={this.editerCommentaire}
    //   onBlur={this.appliquerCommentaire}
    //   value={this.state.commentaires || fichierCourant.commentaires || ''}
    //   placeholder="Ajouter un commentaire ici..."
    //   />


    return commentaires;
  }

  renderVersions() {
    let fichierCourant = this.props.fichierCourant;

    let versions = [];
    for(var fuuid in fichierCourant.versions) {
      let version = fichierCourant.versions[fuuid];
      versions.push(version);
    }
    versions.sort((a,b)=>{
      let dateA = a.date_version, dateB = b.date_version;
      return dateB - dateA;
    })

    let affichageVersions = [];
    versions.forEach(version=>{
      let dateVersion = dateformatter.format_datetime(version.date_version);
      affichageVersions.push(
        <div key={version.fuuid} className="ligne-version-fichier">
          <div key={'1'+version.fuuid} className="w3-row-padding row-donnees">
            <div className="w3-col m2">
              {dateVersion.toString()}
            </div>
            <div className="w3-col m8">
              <IconeFichier securite={version.securite} type="fichier"/>
              {version.nom}
            </div>
            <div className="w3-col m2">
              <button
                onClick={this.props.actionsDownload.telechargerEvent}
                value={fichierCourant.uuid}
                data-extension={fichierCourant.extension}
                data-fuuid={version.fuuid}>
                  <i className="fa fa-download" />
              </button>
              <button
                onClick={this.props.actionsDownload.telechargerEvent}
                value={fichierCourant.uuid}
                data-extension={fichierCourant.extension}
                data-fuuid={version.fuuid}
                data-notarget='true'>
                  <i className="fa fa-download" />
              </button>
            </div>
          </div>
          <div key={'2'+version.fuuid} className="w3-row-padding row-donnees">
            <div className="w3-col m10"></div>
            <div className="w3-col m2">
              {filesizeformatter.format(version.taille)}
            </div>
          </div>
        </div>
      );
    })

    return affichageVersions;
  }

  render() {
    // Affiche l'information d'un fichier et la liste des versions
    return (
      <div className="w3-col m12 w3-card_liste_BR">
        {this.renderCommentaire()}

        {this.renderInformationFichier()}

        <Feuille>
          <h2 className="w3-opacity">Historique</h2>
          <ul>{this.renderVersions()}</ul>
        </Feuille>

      </div>
    )
  }
}

export class ActiviteFichiers extends React.Component {

  state = {
    pageCourante: '1',
    elementsParPage: 10,
    selection: {},
  }

  chargerPlusRecents = event => {
    this.props.chargerPlusRecents(true);
  }

  checkEntree = event => {
    let uuid = event.currentTarget.value;
    let dataset = event.currentTarget.dataset;
    // let etat = !this.state.selection[uuid];
    // console.debug("Selection " + uuid);
    this.props.actionsCarnet.toggle(uuid, {...dataset});
  }

  renderBoutonsPages() {
    return (
      <Button onClick={this.chargerPlusRecents}>
        Suivants
      </Button>
    );
  }

  renderBoutonsAction() {
    return (
      <div className="boutons-actions-gauche">
        <button>
          <i className="fa fa-trash"/>
        </button>
      </div>
    )
  }

  render() {

    var descriptionRapport = '';
    if(this.props.rapportActivite) {
      descriptionRapport = this.props.rapportActivite.description;
    }

    return (
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding">
          <div className="w3-row-padding">
            <h2>{descriptionRapport}</h2>
          </div>
          <div className="liste-fichiers">
            <FichiersRecents
              {...this.props}
              actions={{
                supprimerFavori: this.props.actionsFavoris.supprimerFavori,
                ajouterFavori: this.props.actionsFavoris.ajouterFavori,
                chargeruuid: this.props.actionsNavigation.chargeruuid,
                checkEntree: this.checkEntree,
                telechargerEvent: this.props.actionsDownload.telechargerEvent,
              }} />
          </div>
          <div className="bas-page">
            <div className="w3-col m12 boutons-pages">
              {this.renderBoutonsPages()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function FichiersRecents(props) {
  let fichiersRendered = [];

  if( props.activiteRecente ) {
    let activites = props.activiteRecente;
    if(activites) fichiersRendered = activites.map((fichier, idx) => {
      let check;
      if(props.carnet.selection[fichier.uuid]) {
        check = ((<i className="fa fa-check-square-o icone-fichier"/>));
      } else {
        check = ((<i className="fa fa-square-o icone-fichier"/>));
      }

      let icone = <IconeFichier className="icone-fichier" type={fichier['_mg-libelle']} securite={fichier.securite} />

      let dernierChangementRendered = (
        <DateTimeFormatter date={fichier['_mg-derniere-modification']}/>
      );
      let cssFavori, actionFavori;
      if(props.favorisParUuid[fichier.uuid]) {
        cssFavori = 'favori-actif';
        actionFavori = props.actions.supprimerFavori;
      } else {
        cssFavori = 'favori-inactif';
        actionFavori = props.actions.ajouterFavori;
      }

      let lienFichier;
      if(fichier.nom) {
        lienFichier = (
          <span className="fichierlien">
            {icone}
            <button className="aslink" onClick={props.actions.chargeruuid} value={fichier.uuid}>
              {fichier.nom}
            </button>
          </span>
        )
      } else {
        lienFichier = (
          <span className="fichierlien">
            <button className="aslink" onClick={props.actions.chargeruuid} value={fichier.uuid}>
              {icone}
            </button>
          </span>
        )
      }

      return (
        <Row key={fichier.uuid} className="tableau-fichiers">

          <Col sm={12} xl={8} className="nom-fichier">
            <button className="nobutton" onClick={props.actions.checkEntree}
              value={fichier.uuid}
              data-nom={fichier.nom}
              data-datemodification={fichier['_mg-derniere-modification']}>
              {check}
            </button>

            {lienFichier}

          </Col>

          <Col sm={6} xl={2}>
            {dernierChangementRendered}
          </Col>

          <Col sm={6} xl={2} className="boutons-actions-droite">
            <button value={fichier.uuid} onClick={actionFavori}>
              <span className={"fa-stack " + cssFavori}>
                <i className='fa fa-star fa-stack-1x fond'/>
                <i className='fa fa-star-o fa-stack-1x'/>
              </span>
            </button>
            <button value={fichier.uuid} data-extension={fichier.extension}
              onClick={props.actions.telechargerEvent}>
              <i className="fa fa-download"/>
            </button>
          </Col>

        </Row>
      );
    });
  }

  return fichiersRendered;
}
