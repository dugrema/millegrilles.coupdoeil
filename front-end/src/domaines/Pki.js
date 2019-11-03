import React from 'react';
import Checkbox from "../mgcomponents/Checkbox";

import webSocketManager from '../WebSocketManager';
// import {dateformatter} from '../formatters'
import './Pki.css';
import {dateformatter} from '../formatters';

// const domaine = 'millegrilles.domaines.Pki';
// const libelle_signerNoeud = 'signer.noeud';

export class SignerNoeud extends React.Component {

  state = {
    requeteCsr: '',
    domaine: '',
    erreur: null,
    certificat: null,
  }

  changementDomaine = event => {this.setState({domaine: event.currentTarget.value})}
  changementRequeteCsr = event => {this.setState({requeteCsr: event.currentTarget.value})}
  signer = event => {
    let transaction = {
      domaines: [this.state.domaine],
      csr: this.state.requeteCsr,
    }
    console.debug("Transaction de signature");
    console.debug(transaction);

    let domaine = 'millegrilles.domaines.MaitreDesCles.signerCertificatNoeud';
    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }
      console.debug("Reponse");
      console.debug(reponse);

      if(reponse.autorise) {

        this.setState({certificat: reponse.fullchain});

      } else {
        this.setState({
          erreur: {
            message: reponse.description,
            erreurRolesDemandeur: reponse.roles_demandeur,
          }
        });
      }
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });

  }

  renderErreur() {
    if(this.state.erreur) {
      return (
        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h2 className="w3-opacity w3-red">Erreur</h2>

            <p>
              Erreur de signature du certificat. Le serveur a refuse l&apos;operation.
            </p>

            <p>
              {this.state.erreur.message}
            </p>

          </div>
        </div>
      )
    }

    return null;
  }

  renderFormulaire() {
    return (
      <form onSubmit={event => event.preventDefault()}>
        <div className="w3-container formulaire">
          <div>
            <div className="w3-col m4">Domaine du certificat</div>
            <div className="w3-col m8 champ">
              <select value={this.state.domaine} onChange={this.changementDomaine}>
                <option value="">Choisir un domaine</option>
                <option value="Noeud">Noeud</option>
                <option value="NoeudPublication">Noeud de publication</option>
                <option value="SenseursPassifs">Senseurs Passifs</option>
              </select>
            </div>
          </div>

          <div>
            <div className="w3-col m12">
              Coller le texte de la requete PEM
            </div>
          </div>

          <div>
            <div className="w3-col m12">
              <textarea
                value={this.state.requeteCsr} onChange={this.changementRequeteCsr}
                rows="20" />
            </div>
          </div>

          <div className="w3-col m12 w3-center boutons buttonBar">
            <button onClick={this.signer} value="Signer">Signer</button>
            <button onClick={this.props.retourPki} value="Annuler">Annuler</button>
          </div>

        </div>
      </form>
    )
  }

  render() {

    let contenu;
    if(this.state.certificat) {
      contenu = (
        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <p>
              Copier le contenu de ce certificat dans un fichier .pem sur
              le noeud.
            </p>
            <pre>
              {this.state.certificat}
            </pre>
          </div>
        </div>
      )
    } else {
      contenu = (
        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            {this.renderFormulaire()}
          </div>
        </div>
      )
    }

    return (
      <div className="w3-col m12">
        <div className="w3-row-padding">

          <div className="w3-card w3-round w3-white">
            <div className="w3-container w3-padding">
              <h2 className="w3-opacity">Signer un certificat de noeud</h2>

              <p>
                Cette page permet de signer une requête de certificat générée
                sur un noeud qui doit se connecter à la MilleGrille
              </p>

            </div>
          </div>

          {this.renderErreur()}

          {contenu}

        </div>
      </div>
    );
  }

}

export class RenouvellerCertificats extends React.Component {

  LISTE_MIDDLEWARE = [
    "mq", "nginx", "coupdoeil", "ceduleur", "domaines",
    "fichiers", "maitredescles", "mongo", "mongoexpress", "publicateur",
    "transaction", "vitrine"];

  state = {
    renouvellementMiddlewareTransmis: '',
    renouvellementMiddlewareRoles: {},
    checkboxes: this.LISTE_MIDDLEWARE.reduce(
      (options, option) => ({
        ...options,
        [option]: false
      }),
      {}
    ),
  }

  componentWillMount = () => {
    this.renouvellementMiddlewareRoles = new Set();
  }

  handleCheckboxChange = changeEvent => {
    const { name } = changeEvent.target;

    this.setState(prevState => ({
      checkboxes: {
        ...prevState.checkboxes,
        [name]: !prevState.checkboxes[name]
      }
    }));
  };

  setRenouvellerRoleMiddleware = event => {
    let valeur = event.currentTarget.value;

    // Copier valeurs
    let valeurs = Object.assign({}, this.setState.renouvellementMiddlewareRoles);
    valeurs[valeur] = 1;

    this.setState({renouvellementMiddlewareRoles: valeurs});
  }

  createCheckbox = option => (
      <div key={option} className="w3-col m12">
        <Checkbox
          label={option}
          isSelected={this.state.checkboxes[option]}
          onCheckboxChange={this.handleCheckboxChange}
        />
      </div>
    );

  createCheckboxes = () => this.LISTE_MIDDLEWARE.map(this.createCheckbox);

  renouvellerMiddleware = event => {
    let roles = [];

    Object.keys(this.state.checkboxes)
      .filter(checkbox => this.state.checkboxes[checkbox])
      .forEach(checkbox => {
        roles.push(checkbox);
      });

    let commande = {
      roles,
    }
    console.debug("Commande de renouvellement");
    console.debug(commande);

    this.setState({renouvellementMiddlewareTransmis: 'Demande transmise'});

    let domaine = 'commande.monitor.maj.certificatsParRole';
    webSocketManager.transmettreCommande(domaine, commande)
    .then(reponse=>{
      if(reponse.err) {
        this.setState({renouvellementMiddlewareTransmis: 'Erreur dans la demande, reessayer plus tard'});
        console.error("Erreur commande");
        console.error(reponse.err);
      }
      console.debug("Reponse");
      console.debug(reponse);

      if(reponse.autorise) {

        this.setState({
          renouvellementMiddlewareTransmis: "Renouvellement en cours",
        });

      } else {
        this.setState({
          renouvellementMiddlewareTransmis: "Renouvellement non autorise ou erreur",
        });
      }
    })
    .catch(err=>{
      this.setState({
        renouvellementMiddlewareTransmis: "Erreur dans la demande - voir un administrateur",
      });
      console.error("Erreur demande renouvellement certificats");
      console.error(err);
    });
  }

  feuilleEntete() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-col m12 w3-opacity">Renouveller des certificats</h2>
        </div>
      </div>
    );
  }

  middleware() {

    let message = null;
    if(this.state.renouvellementMiddlewareTransmis !== '') {
      message = (
        <div>
          <div className="w3-col m12">
            {this.state.renouvellementMiddlewareTransmis}
          </div>
        </div>
      );
    }

    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding formulaire">
          <div>
            <h3 className="w3-col m12 w3-opacity">Middleware</h3>
          </div>
          <div>
            {this.createCheckboxes()}
          </div>
          {message}
          <div>
            <div className="w3-col m12 w3-center boutons buttonBar">
              <button onClick={this.renouvellerMiddleware} value="Soumettre">Sauvegarder</button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  render() {

    let contenu = (
      <div className="w3-col m12">
        {this.feuilleEntete()}
        {this.middleware()}
      </div>
    );

    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">
            {contenu}
        </div>
      </div>
    );
  }

}

export class AfficherCertificatsRoot extends React.Component {

  state = {
    certificatsRoot: [],
    certificatsMillegrille: [],
    parametresPublics: null,
  }

  componentDidMount() {
    let requeteCerts =  {
      'requetes': [
        {
          'filtre': {
            '_mg-libelle': 'certificat.root',
            'chaine_complete': true,
          }
        },
        {
          'filtre': {
            '_mg-libelle': 'certificat.millegrille',
            'chaine_complete': true,
          }
        },
      ]};

    // Requete pour charger certificats root du domaine
    let domaine = 'requete.millegrilles.domaines.Pki.certificatsRoot';

    // Enregistrer les routingKeys, demander le document initial.
    webSocketManager.transmettreRequete(domaine, requeteCerts)
    .then( docInitial => {
      let certificatsRoot = docInitial[0];
      let certificatsMillegrille = docInitial[1];
      this.setState({certificatsRoot, certificatsMillegrille});
    })
    .catch( err=>{
      console.error("Erreur chargement document initial");
      console.error(err);
    });

    // Aller chercher le URL public de la millegrille
    let requeteParametres =  {
      'requetes': [{
          'filtre': {
            '_mg-libelle': 'publique.configuration',
          }
      }]};
    // Requete pour charger certificats root du domaine
    let domaineParametres = 'requete.millegrilles.domaines.Parametres.publique.configuration';

    // Enregistrer les routingKeys, demander le document initial.
    webSocketManager.transmettreRequete(domaineParametres, requeteParametres)
    .then( docParametres => {
      let parametresPublics = docParametres[0][0];
      this.setState({parametresPublics});
    })
    .catch( err=>{
      console.error("Erreur chargement parametres publics");
      console.error(err);
    });
  }

  genererListeRoots() {
    let roots = null;
    if(this.state.certificatsRoot) {
      roots = this.genererListeCertificats(this.state.certificatsRoot);
    }
    return roots;
  }

  genererListeCertificatsMilleGrille() {
    let certs = null;
    if(this.state.certificatsMillegrille) {
      certs = this.genererListeCertificats(this.state.certificatsMillegrille);
    }
    return certs;
  }

  genererListeCertificats(liste) {
    let certificats = [];

    for(let idx in liste) {
      let certRoot = liste[idx];
      certificats.push(
        <div key={certRoot.fingerprint} className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding formulaire">
            <div>
              <div className="w3-col m4 label">MilleGrille</div>
              <div className="w3-col m8">{certRoot.sujet.organizationName}</div>
            </div>
            <div>
              <div className="w3-col m4 label">Fingerprint</div>
              <div className="w3-col m8">{certRoot.fingerprint}</div>
            </div>
            <div>
              <div className="w3-col m4 label">Authority key</div>
              <div className="w3-col m8">{certRoot.authority_key}</div>
            </div>
            <div>
              <div className="w3-col m4 label">Subject key</div>
              <div className="w3-col m8">{certRoot.subject_key}</div>
            </div>
            <div>
              <div className="w3-col m4 label">Not valid before</div>
              <div className="w3-col m8">{dateformatter.format_datetime(certRoot.not_valid_before)}</div>
            </div>
            <div>
              <div className="w3-col m4 label">Not valid after</div>
              <div className="w3-col m8">{dateformatter.format_datetime(certRoot.not_valid_after)}</div>
            </div>
            <div>
              <div className="w3-col m12">
                <pre>
                  {certRoot.certificat_pem}
                </pre>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return certificats;
  }

  contenu() {
    let nomMilleGrille = this.props.documentIdMillegrille.nom_millegrille;
    let urlBase = this.props.documentIdMillegrille.adresse_url_base;
    var urlLocal = null;

    if(this.state.parametresPublics && this.state.parametresPublics['url_web']) {
      urlLocal = (<span>(<a href={'https://'+ urlBase + '/certs/' + nomMilleGrille + '.CA.cert.pem'}>local</a>)</span>);
      urlBase = this.state.parametresPublics['url_web'];
    }
    let lienCAs = 'https://'+ urlBase + '/certs/' + nomMilleGrille + '.CA.cert.pem';

    let entete = (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-col m12 w3-opacity">Liste de référence des certificats de la MilleGrille</h2>

          <p>
            Les certificats racines (premiers dans la liste) sont ceux qui doivent
            être utilisés pour valider les chaines.
          </p>

          <div className="w3-col m12">
            <p>
              Noter que les fichiers de certificats racines sont disponibles via lien web :<br/>
              <a href={lienCAs}>{lienCAs}</a> {urlLocal}
            </p>
          </div>
        </div>
      </div>
    );

    let enteteCertsMilleGrilles = (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-col m12 w3-opacity">Certificats intermédiaires</h2>

          <p>
            Les certificats suivants sont des certificats intermédiaires
            fournis en référence.
          </p>

        </div>
      </div>
    );

    return (
      <div className="w3-col m12">
        {entete}
        {this.genererListeRoots()}

        {enteteCertsMilleGrilles}
        {this.genererListeCertificatsMilleGrille()}
      </div>
    );

  }

  render() {
    return (

      <div className="w3-col m12">
        <div className="w3-row-padding">
            {this.contenu()}
        </div>
      </div>
    );
  }

}

export class Pki extends React.Component {

  state = {
    ecranCourant: null,
  }

  sousPages = {
    'SignerNoeud': SignerNoeud,
    'RenouvellerCertificats': RenouvellerCertificats,
    'AfficherCertificatsRoot': AfficherCertificatsRoot,
  }

  fonctionsNavigation = {
    retourPki: () => {
      this.setState({ecranCourant: null});
    },
    afficherEcran: event => {
      let sousPage = this.sousPages[event.currentTarget.value];
      this.setState({ecranCourant: sousPage});
    }
  }

  fonctionsGestion() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-opacity">Gestion des certificats (Public Key Infrastructure)</h2>

          <ul>
            <li>
              <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="AfficherCertificatsRoot">
                Afficher certificats racines
              </button>
            </li>
            <li>
              <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="SignerNoeud">
                Signer un certificat de noeud
              </button>
            </li>
            <li>
              <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="RenouvellerCertificats">
                Renouveller des certificats
              </button>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  render() {
    let contenu;
    if(this.state.ecranCourant) {
      let ModuleGestion = this.state.ecranCourant;

      contenu = (
        <ModuleGestion
          {...this.fonctionsNavigation}
          documentIdMillegrille={this.props.documentIdMillegrille}
          />
      );
    } else {
      contenu = (
        <div className="w3-col m12">
          {this.fonctionsGestion()}
        </div>
      )
    }

    return (

      <div className="w3-col m9">
        <div className="w3-row-padding">
            {contenu}
        </div>
      </div>
    )
  }

}
