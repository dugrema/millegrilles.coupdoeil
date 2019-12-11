import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import {filesizeformatter, dateformatter} from '../formatters'
import {DateTimeFormatter} from '../mgcomponents/ReactFormatters'
import {IconeFichier} from '../mgcomponents/IconeFichier'

export class ActionsFichiers {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

  renommer = (uuid, nouveauNom) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.renommerFichier';
    let transaction = {
        uuid: uuid,
        nom: nouveauNom,
    }
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

  modifierCommentaire = (uuid, commentaires) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.commenterFichier';
    let transaction = {
        uuid: uuid,
        commentaires: commentaires,
    }
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
    let commentaires = event.currentTarget.value;
    this.setState({commentaires});
  }

  appliquerCommentaire = event => {
    let commentaires = event.currentTarget.value;
    if(commentaires !== this.props.fichierCourant.commentaires) {
      this.props.actionsFichiers.modifierCommentaire(
        this.props.fichierCourant.uuid, commentaires)
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
    console.debug("Toggle selection " + uuid);
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

  decrypter = event => {
    let fuuid = event.currentTarget.value;
    this.props.actionsFichiers.decrypter(fuuid);
  }

  // Verifier si on peut resetter les versions locales des proprietes editees.
  componentDidUpdate(prevProps) {

    let resetState = {};
    if(this.state.commentaires) {
      if(this.state.commentaires === this.props.fichierCourant.commentaires) {
        resetState.commentaires = null;
      }
    }

    if(Object.keys(resetState).length > 0) {
      this.setState(resetState);
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

    let fichierCourant = this.props.fichierCourant;
    let dateFichierCourant = dateformatter.format_datetime(fichierCourant.date_v_courante);
    // dateFichierCourant.setUTCSeconds(fichierCourant.date_v_courante);

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

    var boutonDecrypter = null;
    if(fichierCourant.securite === '3.protege') {
      boutonDecrypter = (
        <button onClick={this.decrypter} value={fichierCourant.fuuid_v_courante} title="Decrypter">
          <span className="fa-stack fa-1g">
            <i className="fa fa-lock fa-stack-1x"/>
            <i className="fa fa-ban fa-stack-2x"/>
          </span>
        </button>
      )
    }

    let informationFichier = (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
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
                  onClick={this.props.actionsDownload.telechargerEvent}>
                    <i className="fa fa-download"/>
                </button>
              </div>
              <div className="w3-col m1 boutons-actions-droite">
                {boutonSupprimerRecuperer}
              </div>
            </div>

            <div className="w3-row-padding">
              <div className="w3-col m3 label">Date :</div>
              <div className="w3-col m9 champ">{dateFichierCourant.toString()}</div>
            </div>
            <div className="w3-row-padding">
              <div className="w3-col m3 label">Taille : </div>
              <div className="w3-col m9 champ">{filesizeformatter.format(fichierCourant.taille)} ({fichierCourant.taille} octets)</div>
            </div>
            <div className="w3-row-padding">
              <div className="w3-col m3 label">Sécurité :</div>
              <div className="w3-col m9 champ">
                <IconeFichier securite={fichierCourant.securite} type="fichier"/>
                {fichierCourant.securite} {boutonDecrypter}
              </div>
            </div>
            <div className="w3-row-padding">
              <div className="w3-col m3 label">UUID permanent :</div>
              <div className="w3-col m9 champ">{fichierCourant.uuid}</div>
            </div>
            <div className="w3-row-padding">
              <div className="w3-col m3 label">FUUID courant :</div>
              <div className="w3-col m9 champ">{fichierCourant.fuuid_v_courante}</div>
            </div>

            {informationSuppression}

          </div>
        </div>
      </div>
    );

    return informationFichier;
  }

  renderCommentaire() {
    let fichierCourant = this.props.fichierCourant;
    let cssEdition = '';
    if(this.state.commentaires) {
      cssEdition = 'edition-en-cours'
    }

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
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
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
                <TextareaAutosize
                  name="commentaires"
                  className={"autota-width-max editable " + cssEdition}
                  onChange={this.editerCommentaire}
                  onBlur={this.appliquerCommentaire}
                  value={this.state.commentaires || fichierCourant.commentaires || ''}
                  placeholder="Ajouter un commentaire ici..."
                  />
              </div>
            </div>

          </div>
        </div>
      </div>
    );

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
                data-fuuid={version.fuuid}>
                  <i className="fa fa-download" />
              </button>
              <button
                onClick={this.props.actionsDownload.telechargerEvent}
                value={fichierCourant.uuid}
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

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h2 className="w3-opacity">Historique</h2>
            <ul>{this.renderVersions()}</ul>
          </div>
        </div>

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

  changerPage = event => {
    let page = event.currentTarget.value;
    this.setState({pageCourante: page});
  }

  checkEntree = event => {
    let uuid = event.currentTarget.value;
    let dataset = event.currentTarget.dataset;
    // let etat = !this.state.selection[uuid];
    console.debug("Selection " + uuid);
    this.props.actionsCarnet.toggle(uuid, {...dataset});
  }

  renderBoutonsPages() {
    let boutonsPages = [];
    if(this.props.rapportActivite) {
      let activites = this.props.rapportActivite.activites;
      if(activites) {
        let nbPages = Math.ceil(activites.length / this.state.elementsParPage);

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
    }
    return boutonsPages;
  }

  renderFichiers() {
    let fichiersRendered = [];

    if( this.props.rapportActivite ) {
      let premierElem = (this.state.pageCourante-1) * this.state.elementsParPage;
      let dernierElem = premierElem + this.state.elementsParPage; // (+1)

      let activites = this.props.rapportActivite.activites;

      if(activites) for(let idx = premierElem; idx < dernierElem && idx < activites.length; idx++) {
        let activite = activites[idx];
        let fichier = activite.sujet;

        let check;
        if(this.props.carnet.selection[fichier.uuid]) {
          check = ((<i className="fa fa-check-square-o"/>));
        } else {
          check = ((<i className="fa fa-square-o"/>));
        }

        let icone = <IconeFichier type={fichier['_mg-libelle']} securite={fichier.securite} />

        let dernierChangementRendered = (
          <DateTimeFormatter date={fichier['_mg-derniere-modification']}/>
        );
        let cssFavori, actionFavori;
        if(this.props.favorisParUuid[fichier.uuid]) {
          cssFavori = 'favori-actif';
          actionFavori = this.props.actionsFavoris.supprimerFavori;
        } else {
          cssFavori = 'favori-inactif';
          actionFavori = this.props.actionsFavoris.ajouterFavori;
        }

        let lienFichier;
        if(fichier.nom) {
          lienFichier = (
            <span>
              {icone}
              <button className="aslink" onClick={this.props.actionsNavigation.chargeruuid} value={fichier.uuid}>
                {fichier.nom}
              </button>
            </span>
          )
        } else {
          lienFichier = (
            <button className="aslink" onClick={this.props.actionsNavigation.chargeruuid} value={fichier.uuid}>
              {icone}
            </button>
          )
        }

        fichiersRendered.push(
          <div key={activite.uuid_activite} className="w3-row-padding tableau-fichiers">

            <div className="w3-col m6">
              <button className="nobutton" onClick={this.checkEntree}
                value={fichier.uuid}
                data-nom={fichier.nom}
                data-datemodification={fichier['_mg-derniere-modification']}>
                {check}
              </button>

              {lienFichier}

            </div>

            <div className="w3-col m2">
              {activite.type_activite}
            </div>

            <div className="w3-col m2 boutons-actions-droite">
              <button value={fichier.uuid} onClick={actionFavori}>
                <span className={"fa-stack " + cssFavori}>
                  <i className='fa fa-star fa-stack-1x fond'/>
                  <i className='fa fa-star-o fa-stack-1x'/>
                </span>
              </button>
              <button value={fichier.uuid} onClick={this.props.actionsDownload.telechargerEvent}>
                <i className="fa fa-download"/>
              </button>
            </div>
            <div className="w3-col m2">
              {dernierChangementRendered}
            </div>
          </div>
        );
      }
    }

    return fichiersRendered;
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
            {this.renderFichiers()}
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
