import React from 'react';
import { Row, Col, Button, Form } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import forge from '@dugrema/node-forge';

import Checkbox from "../components/Checkbox";
import { DateTimeFormatter } from '../components/ReactFormatters';
import { Feuille } from '../components/Feuilles';

import './Pki.css';

export class SignerNoeud extends React.Component {

  state = {
    requeteCsr: '',
    domaine: '',
    erreur: null,
    certificat: null,
    verifie: false,
    infoCsr: {},
  }

  changementDomaine = event => {this.setState({domaine: event.currentTarget.value})}

  changementRequeteCsr = event => {
    this.setState({requeteCsr: event.currentTarget.value}, ()=>{
      this.verifierCsr();
    })
  }

  signer = event => {
    let transaction = {
      domaines: [this.state.domaine],
      csr: this.state.requeteCsr,
    }
    // console.debug("Transaction de signature");
    // console.debug(transaction);

    let domaine = 'MaitreDesCles.signerCertificatNoeud';
    this.props.rootProps.websocketApp.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }
      // console.debug("Reponse");
      // console.debug(reponse);

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

  verifierCsr() {
    // Tenter de charger le CSR et extraire l'information
    const csrPem = this.state.requeteCsr;
    var infoCsr = {};
    var verifie = false;
    try {
      const csr = forge.pki.certificationRequestFromPem(csrPem);
      verifie = csr.verify()
      const idmg = csr.subject.getField('O').value;
      const typeCertificat = csr.subject.getField('OU').value;
      // console.debug("CSR information, idmg : %s, type : %s, verifie : %s", idmg, typeCertificat, verifie);

      // Afficher l'information si le certificat est valide
      infoCsr = verifie?{idmg, typeCertificat}:{};
    } catch (err) {
      console.debug("Erreur verification CSR");
      // console.debug(err);
    }
    this.setState({verifie, infoCsr});
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

    var basFormulaire = null;
    if(this.state.verifie) {
      const {typeCertificat, idmg} = this.state.infoCsr;

      const idmgLocal = this.props.documentIdMillegrille.idmg;

      var infoIdmg = null;
      if(idmg === idmgLocal) {
        infoIdmg = (
          <Row>
            <Col lg={4}>IDMG :</Col>
            <Col lg={6}>{idmg}</Col>
          </Row>
        );
      } else {
        infoIdmg = (
          <Row>
            <Col lg={4}>IDMG tiers :</Col>
            <Col lg={6}>{idmg}</Col>
          </Row>
        );
      }

      basFormulaire = (
        <div>
          <Row>
            <Col>Fichier CSR valide, verifier le contenu avant de signer</Col>
          </Row>

          {infoIdmg}

          <Row>
            <Col lg={4}>Type Certificat a generer :</Col>
            <Col lg={6}>{typeCertificat}</Col>
          </Row>

          <Row className="w3-center boutons buttonBar">
            <Col>
              <Button variant="primary" onClick={this.signer} value="Signer">Signer</Button>
            </Col>
          </Row>
        </div>
      );
    } else if (this.state.requeteCsr !== '') {
      basFormulaire = (
        <Row>
          <Col>Requete invalide</Col>
        </Row>
      );
    }

    return (
      <form onSubmit={event => event.preventDefault()}>
        <div className="w3-container formulaire">

          <div>
            <div className="w3-col m12">
              Coller le texte de la requete PEM (fichier CSR)
            </div>
          </div>

          <div>
            <div className="w3-col m12">
              <textarea
                value={this.state.requeteCsr} onChange={this.changementRequeteCsr}
                rows="20" />
            </div>
          </div>

          {basFormulaire}

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
        <Feuille>
            {this.renderFormulaire()}
        </Feuille>
      )
    }

    return (
      <div className="w3-col m12 w3-row-padding">
        <div className="w3-row-padding">

          <Feuille>
            <h2 className="w3-opacity">Signer un certificat de noeud</h2>

            <p>
              Cette page permet de signer une requête de certificat générée
              sur un noeud qui doit se connecter à la MilleGrille
            </p>

          </Feuille>

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
    "fichiers", "maitredescles", "mongo", "mongoexpress",
    "transaction", "vitrine"];

  // Liste des services avec un URL accessible a l'exterieur de docker
  DICT_SERVICES_URL = {"mq": true, "coupdoeil": true, "nginx": true, "mongoexpress": true};

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
    altdomains: Object.keys(this.DICT_SERVICES_URL).reduce(
      (services, service) => ({
        ...services,
        [service]: ''
      }),
      {}
    )
  }

  componentDidMount = () => {
    this.renouvellementMiddlewareRoles = new Set();

    // Charger configuration des alt domains
    let requeteDomaine = 'requete.millegrilles.domaines.Pki.altdomains';
    let requete = {
      'filtre': {
          '_mg-libelle': {'$in': ['configuration.certdocker']},
      },
    };
    let requetes = {'requetes': [requete]};

    this.props.rootProps.websocketApp.transmettreRequete(requeteDomaine, requetes)
    .then( docsRecu => {
      // console.debug("Docs recus");
      // console.debug(docsRecu);
      return docsRecu[0][0];
    })
    .then( certDocker => {
      var altdomainsRecus = certDocker.altdomains;
      if( altdomainsRecus ) {
        var altdomains = Object.assign({}, this.state.altdomains);
        for(let moduleDocker in altdomainsRecus) {
          // console.debug("Set " + moduleDocker);
          altdomains[moduleDocker] = altdomainsRecus[moduleDocker];
        }
        // console.debug(altdomains);
        this.setState({altdomains});
      }
    })
    .catch( err => {
      console.error("Erreur chargement document alt domains");
      console.error(err);
    });

  }

  changerAltDomain = event => {
    var nomDomaine = event.currentTarget.name.split("_")[1];
    var valeur = event.currentTarget.value;
    // console.debug("Changer alt domaine nom : " + nomDomaine);
    var altdomains = Object.assign({}, this.state.altdomains);
    altdomains[nomDomaine] = valeur;
    var checkboxes = this.state.checkboxes;
    checkboxes[nomDomaine] = true;
    this.setState({altdomains, checkboxes});
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

  renouvellerMiddleware = event => {
    let roles = [];

    Object.keys(this.state.checkboxes)
      .filter(checkbox => this.state.checkboxes[checkbox])
      .forEach(checkbox => {
        roles.push(checkbox);
      });

    let altdomains = this.state.altdomains;

    let commande = {
      roles,
      altdomains,
    }
    // console.debug("Transaction de renouvellement");
    // console.debug(commande);

    this.setState({renouvellementMiddlewareTransmis: 'Demande transmise'});

    let domaine = 'Pki.renouvellerCertDocker';
    this.props.rootProps.websocketApp.transmettreTransaction(domaine, commande)
    .then(reponse=>{
      if(reponse.err) {
        this.setState({renouvellementMiddlewareTransmis: 'Erreur dans la demande, reessayer plus tard'});
        console.error("Erreur commande");
        console.error(reponse.err);
      }
      // console.debug("Reponse");
      // console.debug(reponse);

      if(reponse.succes) {

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
      <Feuille>
        <h2 className="w3-col m12 w3-opacity">Renouveller des certificats</h2>
      </Feuille>
    );
  }

  render() {

    let contenu = (
      <div>
        {this.feuilleEntete()}
        <ListeMiddlewareCertificats
          renouvellementMiddlewareTransmis={this.state.renouvellementMiddlewareTransmis}
          checkboxes={this.state.checkboxes}
          altdomains={this.state.altdomains}
          listeMiddleware={this.LISTE_MIDDLEWARE}
          dictServicesMiddleware={this.DICT_SERVICES_URL}
          actions={{
            handleCheckboxChange: this.handleCheckboxChange,
            renouvellerMiddleware: this.renouvellerMiddleware,
            changerAltDomain: this.changerAltDomain,
          }}
          />
      </div>
    );

    return (
      <div className="w3-col m12">
        <div className="w3-row-padding">
          {contenu}
        </div>
      </div>
    );
  }

}

function ListeMiddlewareCertificats(props) {
  let message = null;
  if(props.renouvellementMiddlewareTransmis !== '') {
    message = (
      <div>
        <div className="w3-col m12">
          {props.renouvellementMiddlewareTransmis}
        </div>
      </div>
    );
  }

  return (
    <Feuille>
      <Row>
        <h3 className="w3-col m12 w3-opacity">Middleware</h3>
      </Row>

      <Form>
        <Row>
          <Col lg={2}>
            Module
          </Col>
          <Col lg={10}>
            Alt domain (url)
          </Col>
        </Row>

        <CreateCheckBoxes
          checkboxes={props.checkboxes}
          listeMiddleware={props.listeMiddleware}
          dictServicesMiddleware={props.dictServicesMiddleware}
          altdomains={props.altdomains}
          actions={{...props.actions}}
          />
      </Form>

      {message}

      <Row>
        <Col>
          <Button onClick={props.actions.renouvellerMiddleware} value="Soumettre">Sauvegarder</Button>
        </Col>
      </Row>
    </Feuille>
  );
}

function CreateCheckBoxes(props) {
  let checkboxes = props.listeMiddleware.map(option => {
    let formUrl = null;
    if(props.dictServicesMiddleware[option]) {
      formUrl = (
        <Form.Control type="text" placeholder="URL 1, URL2"
                      name={"altDomain_" + option}
                      onChange={props.actions.changerAltDomain}
                      value={props.altdomains[option]} />
      );
    }

    return (
      <Row key={option}>
        <Col lg={2}>
          <Checkbox
            label={option}
            isSelected={props.checkboxes[option]}
            onCheckboxChange={props.actions.handleCheckboxChange}
          />
        </Col>
        <Col lg={10}>
          {formUrl}
        </Col>
      </Row>
    );

  })

  return checkboxes;
}

export class AfficherCertificatsRoot extends React.Component {

  state = {
    certificatsRoot: [],
    certificatsMillegrille: [],
    parametresPublics: null,
  }

  componentDidMount() {
    // Requete pour charger certificats root du domaine
    let domaine = 'Pki.certificatsCA';

    // Enregistrer les routingKeys, demander le document initial.
    this.props.rootProps.websocketApp.transmettreRequete(domaine, {})
    .then( certificats => {
      // console.debug("Reponse certificats");
      // console.debug(certificats);

      const roots = Object.values(certificats).filter(a=>{return a.type_certificat==='certificat.root'});
      const intermediaires = Object.values(certificats).filter(a=>{return a.type_certificat==='certificat.millegrille'});

      let certificatsRoot = roots;
      let certificatsMillegrille = intermediaires;
      this.setState({certificatsRoot, certificatsMillegrille});
    })
    .catch( err=>{
      console.error("Erreur chargement certificats CA");
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
        <Feuille key={certRoot.fingerprint}>

          <Row>
            <Col lg={3}>MilleGrille</Col>
            <Col lg={9}>{certRoot.idmg}</Col>
          </Row>
          <Row>
            <Col lg={3}>Fingerprint</Col>
            <Col lg={9}>{certRoot.fingerprint}</Col>
          </Row>
          <Row>
            <Col lg={3}>Authority key</Col>
            <Col lg={9}>{certRoot.authority_key}</Col>
          </Row>
          <Row>
            <Col lg={3}>Subject key</Col>
            <Col lg={9}>{certRoot.subject_key}</Col>
          </Row>
          <Row>
            <Col lg={3}>Not valid before</Col>
            <Col lg={9}><DateTimeFormatter date={certRoot.not_valid_before}/></Col>
          </Row>
          <Row>
            <Col lg={3}>Not valid after</Col>
            <Col lg={9}><DateTimeFormatter date={certRoot.not_valid_after}/></Col>
          </Row>
          <Row>
            <Col>
              <pre>
                {certRoot.certificat_pem}
              </pre>
            </Col>
          </Row>

        </Feuille>
      );
    }

    return certificats;
  }

  contenu() {
    let entete = (
      <Feuille>
        <h2 className="w3-col m12 w3-opacity"><Trans>pki.afficher.titre</Trans></h2>

        <p>
          <Trans>pki.afficher.description_1</Trans>
        </p>
      </Feuille>
    );

    let enteteCertsMilleGrilles = (
      <Feuille>
        <h2 className="w3-col m12 w3-opacity">Certificats intermédiaires</h2>

        <p>
          Les certificats suivants sont des certificats intermédiaires
          fournis en référence.
        </p>

      </Feuille>
    );

    return (
      <div className="w3-col m12 w3-row-padding">
        <div className="w3-row-padding">
          {entete}
          {this.genererListeRoots()}

          {enteteCertsMilleGrilles}
          {this.genererListeCertificatsMilleGrille()}
        </div>
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
          rootProps={this.props.rootProps}
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
