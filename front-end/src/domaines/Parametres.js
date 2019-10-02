import React from 'react';
import webSocketManager from '../WebSocketManager';
import {dateformatter} from '../formatters'
import './Parametres.css';

const domaine = 'millegrilles.domaines.Parametres';
const libelle_emailSmtp = 'email.stmp';
const libelle_publique_configuration = 'publique.configuration';

export class Parametres extends React.Component {

  state = {
    parametreCourant: null,
    publiqueConfiguration: null,
  }

  sousPages = {
    'GestionEmailSmtp': GestionEmailSmtp,
    'GestionDeployeurPublic': GestionDeployeurPublic,
  }

  fonctionsNavigation = {
    retourParametres: () => {
      this.setState({parametreCourant: null});
    },
    afficherEcran: event => {
      let sousPage = this.sousPages[event.currentTarget.value];
      this.setState({parametreCourant: sousPage});
    }
  }

  fonctionsGestion() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-opacity">Parametres d&apos;administration de la MilleGrille</h2>

          <ul>
            <li>
              <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="GestionEmailSmtp">
                Gerer serveurs de notification par courriel (SMTP)
              </button>
            </li>
            <li>
              <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="GestionDeployeurPublic">
                Deployeur public sur internet
              </button>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  render() {
    let contenu;
    if(this.state.parametreCourant) {
      let ModuleGestion = this.state.parametreCourant;

      contenu = (
        <ModuleGestion
          {...this.fonctionsNavigation} />
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

class GestionEmailSmtp extends React.Component {
  state = {
    actif: false,
    host: '',
    port: 465,
    usager: '',
    destinataires: '',
    origine: '',

    contenuCrypte: '',
    motDePasse: '',
    changerMotDePasse: false,
  }

  extraireDonnees(source) {
    let donnees =  {
      actif: source.actif,
      origine: source.origine,
      destinataires: source.destinataires,
      host: source.host,
      port: source.port,
      usager: source.usager,
    }

    return donnees;
  }

  changeActif = event => {
    this.setState({actif: event.currentTarget.value});
  }
  changeHost = event => {
    this.setState({host: event.currentTarget.value});
  }
  changePort = event => {
    this.setState({port: event.currentTarget.value});
  }
  changeOrigine = event => {
    this.setState({origine: event.currentTarget.value});
  }
  changeDestinataires = event => {
    this.setState({destinataires: event.currentTarget.value});
  }
  changeUsager = event => {
    this.setState({usager: event.currentTarget.value});
  }
  changeMotDePasse = event => {
    this.setState({motDePasse: event.currentTarget.value});
  }
  toggleChangerMotDePasse = event => {
    this.setState({changerMotDePasse: true});
  }
  soumettre = event => {
    let transaction = this.extraireDonnees(this.state);
    if(this.state.changerMotDePasse) {
      transaction['a_crypter'] = {
        motDePasse: this.state.motDePasse
      }
    }
    console.debug("Soumettre formulaire");

    let idDocumentCrypte = {
      domaine: 'millegrilles.domaines.Parametres',
      '_mg-libelle': 'email.stmp',
    };

    let domaine = 'millegrilles.domaines.Parametres.modifierEmailSmtp';
    webSocketManager.transmettreTransaction(domaine, transaction, {idDocumentCrypte})
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }

      // Complet, on retourne a la page Parametres
      this.props.retourParametres(event);
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });
  }

  chargerParametresCourriel() {
    let routingKey = 'requete.' + domaine;;
    let requete = {
      'filtre': {
          '_mg-libelle': libelle_emailSmtp,
          // 'categories': {'$in': ['cat1']},
      },
    };
    let requetes = {'requetes': [requete]};
    webSocketManager.transmettreRequete(routingKey, requetes)
    .then( docsRecu => {
      console.debug("Docs recus requete");
      console.debug(docsRecu);
      return docsRecu[0][0];  // Recuperer avec un then(resultats=>{})
   })
   .then(paramsEmailSmtp => {
     var changerMotDePasse = true;
     if(paramsEmailSmtp.crypte && paramsEmailSmtp.crypte !== '') {
       changerMotDePasse = false;
     }
     let donnees = this.extraireDonnees(paramsEmailSmtp);
     donnees.changerMotDePasse = changerMotDePasse;

     this.setState(donnees);
   })
   .catch(err=>{
     console.error("Erreur requete documents plume");
     console.error(err);
   });
  }

  componentDidMount() {
    this.chargerParametresCourriel();
  }

  renderFormulaire() {

    let boutonMotDePasse;
    if(this.state.changerMotDePasse) {
      boutonMotDePasse = (
        <input type="password" value={this.state.motDePasse} onChange={this.changeMotDePasse} size="40"/>
      )
    } else {
      boutonMotDePasse = (
        <button onClick={this.toggleChangerMotDePasse}>Changer</button>
      )
    }

    return (
      <div className="w3-container formulaire">
        <div>
          <div className="w3-col m4 label">Activer</div>
          <div className="w3-col m8 champ">
            <select value={this.state.actif} onChange={this.changeActif} size="2">
              <option value={true}>Actif</option>
              <option value={false}>Inactif</option>
            </select>
          </div>
        </div>
        <div>
          <div className="w3-col m4 label">Serveur SMTP</div>
          <div className="w3-col m8 champ"><input type="text" value={this.state.host} onChange={this.changeHost} size="40"/></div>
        </div>
        <div>
          <div className="w3-col m4 label">Port (SSL)</div>
          <div className="w3-col m8 champ"><input type="text" value={this.state.port} onChange={this.changePort} size="40"/></div>
        </div>
        <div>
          <div className="w3-col m4 label">Courriel origine</div>
          <div className="w3-col m8 champ"><input type="text" value={this.state.origine} onChange={this.changeOrigine} size="40"/></div>
        </div>
        <div>
          <div className="w3-col m4 label">Courriels destinataire <i className="fa fa-info-circle" title="Separer par des virgules"></i></div>
          <div className="w3-col m8 champ"><input type="text" value={this.state.destinataires} onChange={this.changeDestinataires} size="40"/></div>
        </div>
        <div>
          <div className="w3-col m4 label">Usager</div>
          <div className="w3-col m8 champ"><input type="text" value={this.state.usager} onChange={this.changeUsager} size="40"/></div>
        </div>
        <div>
          <div className="w3-col m4 label">Mot de passe</div>
          <div className="w3-col m8 champ">
            {boutonMotDePasse}
          </div>
        </div>
        <div className="w3-col m12 w3-center boutons">
          <button onClick={this.soumettre} value="Soumettre">Soumettre</button>
          <button onClick={this.props.retourParametres} value="Soumettre">Annuler</button>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="w3-col m12">

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <div>
              <h2 className="w3-opacity">Notifications courriel</h2>
              <p>
                Cette page permet de configurer un serveur courriel (SMTP) pour transmettre des notifications.
              </p>
            </div>
          </div>
        </div>

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <div>
              {this.renderFormulaire()}
            </div>
          </div>
        </div>

      </div>
    );
  }
}

class GestionDeployeurPublic extends React.Component {

  state = {
    urlPublicWeb: '',
    portHttp: 80,
    portHttps: 443,
    urlPublicMq: '',
    portMq: 5673,
  }

  config = {
    subscriptions: [
      'noeuds.source.millegrilles_domaines_Parametres.documents.publique.configuration',
    ]
  };

  // Fonctions Formulaire
  changerUrlWeb = event => {this.setState({urlPublicWeb: event.currentTarget.value})}
  changerHttp = event => {this.setState({portHttp: parseInt(event.currentTarget.value)})}
  changerHttps = event => {this.setState({portHttps: parseInt(event.currentTarget.value)})}
  changerUrlMq = event => {this.setState({urlPublicMq: event.currentTarget.value})}
  changerMq = event => {this.setState({portMq: parseInt(event.currentTarget.value)})}

  sauvegarder = event => {
    let transaction = {
      url_web: this.state.urlPublicWeb,
      port_http: this.state.portHttp,
      port_https: this.state.portHttps,
      url_mq: this.state.urlPublicMq,
      port_mq: this.state.portMq,
    }

    let domaine = 'millegrilles.domaines.Parametres.public.sauvegarder';
    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }

      // Complet, on retourne a la page Parametres
      this.props.retourParametres(event);
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });
  }

  chargerInformationCourante() {
    let routingKey = 'requete.' + domaine;
    let requete = {
      'filtre': {
          '_mg-libelle': libelle_publique_configuration,
      },
    };
    let requetes = {'requetes': [requete]};
    webSocketManager.transmettreRequete(routingKey, requetes)
    .then( docsRecu => {
      console.debug("Docs recus requete");
      console.debug(docsRecu);
      return docsRecu[0][0];  // Recuperer avec un then(resultats=>{})
   })
   .then(documentPubliqueConfiguration => {
     this.setState({
       publiqueConfiguration: documentPubliqueConfiguration,
       urlPublicWeb: documentPubliqueConfiguration.url_web || '',
       portHttp: documentPubliqueConfiguration.port_http || 80,
       portHttps: documentPubliqueConfiguration.port_https || 443,
       urlPublicMq: documentPubliqueConfiguration.url_mq || '',
       portMq: documentPubliqueConfiguration.port_mq || 5673,
     })
   })
   .catch(err=>{
     console.error("Erreur requete documents publiqueConfiguration");
     console.error(err);
   });
  }

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.subscribe(this.config.subscriptions, this.processMessage);
    this.chargerInformationCourante();
  }

  componentWillUnmount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.unsubscribe(this.config.subscriptions);
  }

  processMessage = (routingKey, doc) => {
    if(routingKey === 'noeuds.source.millegrilles_domaines_Parametres.documents.publique.configuration') {
      console.debug("Configuration publique mise a jour/activite")
      console.debug(doc);
      this.setState({publiqueConfiguration: doc});
    }
  }

  renderActivite() {

    let listeActivites = [];

    if(this.state.publiqueConfiguration) {
      let activites = this.state.publiqueConfiguration.activite;
      for(let idx in activites) {
        let activite = activites[idx];
        listeActivites.push(
          <div key={activite.date} className='w3-card w3-row-padding row-donnees'>
            <div className="w3-col m2 w3-text-blue-grey">
              {dateformatter.format_datetime(activite.date)}
            </div>
            <div className="w3-col m10 nowrap w3-small">
              <span className="w3-hide w3-hide-large w3-hide-medium w3-show-inline-block label">Description </span>{activite.description}
            </div>
          </div>
        );
      }
    }

    return (
      <div>
        <ul>
          {listeActivites}
        </ul>
      </div>
    );
  }

  renderFormulaire() {
    return (
      <form onSubmit={event => event.preventDefault()}>
        <div className="w3-container formulaire">
          <div>
            <div className="w3-col m4 label">URL public web</div>
            <div className="w3-col m8 champ">
              <input type="text" value={this.state.urlPublicWeb} onChange={this.changerUrlWeb} size="40" placeholder="www.millegrilles.com"/>
            </div>
          </div>
          <div>
            <div className="w3-col m4 label">Port http</div>
            <div className="w3-col m8 champ">
              <input type="number" value={this.state.portHttp} onChange={this.changerHttp} size="5"/>
            </div>
          </div>
          <div>
            <div className="w3-col m4 label">Port https</div>
            <div className="w3-col m8 champ">
              <input type="number" value={this.state.portHttps} onChange={this.changerHttps} size="5"/>
            </div>
          </div>
          <div>
            <div className="w3-col m4 label">URL public mq</div>
            <div className="w3-col m8 champ">
              <input type="text" value={this.state.urlPublicMq} onChange={this.changerUrlMq} size="40" placeholder="mq.millegrilles.com"/>
            </div>
          </div>
          <div>
            <div className="w3-col m4 label">Port RabbitMQ</div>
            <div className="w3-col m8 champ">
              <input type="number" value={this.state.portMq} onChange={this.changerMq} size="5"/>
            </div>
          </div>
          <div className="w3-col m12 w3-center boutons">
            <button onClick={this.sauvegarder} value="Soumettre">Sauvegarder</button>
            <button onClick={this.props.retourParametres} value="Annuler">Annuler</button>
          </div>
        </div>
      </form>
    )
  }

  render() {

    return (
      <div className="w3-col m12">

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <div>
              <h2 className="w3-opacity">Gestion Deployeur Public</h2>
              <p>
                Cette page permet de configurer l&apos;exposition de la MilleGrille sur internet.
              </p>
            </div>
          </div>
        </div>

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h2 className="w3-text-blue-grey">Configuration publique</h2>
            <div>
              {this.renderFormulaire()}
            </div>
          </div>
        </div>

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h2 className="w3-text-blue-grey">Activité</h2>
            <div>
              {this.renderActivite()}
            </div>
          </div>
        </div>

      </div>
    );
  }
}
