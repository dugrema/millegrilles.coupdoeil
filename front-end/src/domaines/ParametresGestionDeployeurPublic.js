import React from 'react';
import webSocketManager from '../WebSocketManager';
import {dateformatter} from '../formatters'

const domaine = 'millegrilles.domaines.Parametres';
const libelle_publique_configuration = 'publique.configuration';

export class GestionDeployeurPublic extends React.Component {

  state = {
    urlPublicWeb: '',
    urlPublicCoupdoeil: '',
    portHttp: 80,
    portHttps: 443,
    urlPublicMq: '',
    portMq: 5673,
    noeudsDocker: [],
  }

  config = {
    subscriptions: [
      'noeuds.source.millegrilles_domaines_Parametres.documents.publique.configuration',
      'noeuds.monitor.docker.nodes',
    ]
  };

  // Fonctions publier sur noeud docker
  publierSurNoeudDocker = event => {
    let noeudId = event.currentTarget.value;
    console.debug("Publier sur noeud " + noeudId);

    var noeud = null;
    for(let idx in this.state.noeudsDocker) {
      noeud = this.state.noeudsDocker[idx];
      if(noeud.ID === noeudId) {
        break;  // On a trouve le noeud
      }
    }

    if(noeud) {
      let transaction = {
        noeud_docker_hostname: noeud.Description.Hostname,
        noeud_docker_id: noeudId,
        ipv4_interne: noeud.Status.Addr,
      }
      let domaine = 'millegrilles.domaines.Parametres.public.deployer';

      webSocketManager.transmettreTransaction(domaine, transaction)
      .then(reponse=>{
        if(reponse.err) {
          console.error("Erreur transaction");
        }
      })
      .catch(err=>{
        console.error("Erreur sauvegarde");
        console.error(err);
      });

    }
  }

  privatiserNoeudDocker = event => {
    let noeudId = event.currentTarget.value;
    console.debug("Privatiser le noeud " + noeudId);

    var noeud = null;
    for(let idx in this.state.noeudsDocker) {
      noeud = this.state.noeudsDocker[idx];
      if(noeud.ID === noeudId) {
        break;  // On a trouve le noeud
      }
    }

    if(noeud) {
      let transaction = {
        noeud_docker_hostname: noeud.Description.Hostname,
        noeud_docker_id: noeudId,
        ipv4_interne: noeud.Status.Addr,
      }
      let domaine = 'millegrilles.domaines.Parametres.public.privatiser';

      webSocketManager.transmettreTransaction(domaine, transaction)
      .then(reponse=>{
        if(reponse.err) {
          console.error("Erreur transaction");
        }
      })
      .catch(err=>{
        console.error("Erreur sauvegarde");
        console.error(err);
      });

    }
  }

  // Fonctions Formulaire Configuration Publique
  changerUrlWeb = event => {this.setState({urlPublicWeb: event.currentTarget.value})}
  changerUrlCoupdoeil = event => {this.setState({urlPublicCoupdoeil: event.currentTarget.value})}
  changerHttp = event => {this.setState({portHttp: parseInt(event.currentTarget.value)})}
  changerHttps = event => {this.setState({portHttps: parseInt(event.currentTarget.value)})}
  changerUrlMq = event => {this.setState({urlPublicMq: event.currentTarget.value})}
  changerMq = event => {this.setState({portMq: parseInt(event.currentTarget.value)})}

  sauvegarder = event => {
    let domaine = 'millegrilles.domaines.Parametres.public.sauvegarder';
    this.soumettreConfiguration(event, domaine);
  }

  soumettreConfiguration(event, domaine) {
    let transaction = {
      url_web: this.state.urlPublicWeb,
      url_coupdoeil: this.state.urlPublicCoupdoeil,
      port_http: this.state.portHttp,
      port_https: this.state.portHttps,
      url_mq: this.state.urlPublicMq,
      port_mq: this.state.portMq,
    }

    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }
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
       urlPublicCoupdoeil: documentPubliqueConfiguration.url_coupdoeil || '',
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


   let routingKeyNoeudsDocker = 'requete.monitor.services.noeuds';
   webSocketManager.transmettreRequete(routingKeyNoeudsDocker, {'requetes': []})
   .then( docsRecu => {
     console.debug("Doc noeuds");
     console.debug(docsRecu);
     this.setState({
       noeudsDocker: docsRecu,
     })
    })
    .catch(err=>{
      console.error("Erreur requete noeuds docker");
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
    } else if(routingKey === 'noeuds.monitor.docker.nodes') {
      this.setState({noeudsDocker: doc.noeuds});
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

  renderEtatConfiguration() {

    let configurationPublique = this.state.publiqueConfiguration;

    let upnpDisponible = 'non disponible';
    let deploiementMilleGrille = 'non déployée';
    let listeMappings = [];

    if(configurationPublique) {
      if(configurationPublique.upnp_supporte) {
        upnpDisponible = 'disponible';
      }

      if(configurationPublique.actif) {
        deploiementMilleGrille = 'déployée';
      }

      for(let idx in configurationPublique.mappings_ipv4) {
        let mapping = configurationPublique.mappings_ipv4[idx];
        listeMappings.push(
          <div key={mapping.port_ext}>
            <div className="w3-col m4">{mapping.port_mapping_nom}</div>
            <div className="w3-col m3">{mapping.port_ext}</div>
            <div className="w3-col m5">{mapping.ipv4_interne}:{mapping.port_int}</div>
          </div>
        );
      }
    } else {
      configurationPublique = {}
    }

    return (
      <div className="w3-container formulaire">
        <div>
          <div className="w3-col m4 label">État public de la MilleGrille</div>
          <div className="w3-col m8 champ">{deploiementMilleGrille}</div>
        </div>

        <div>
          <div className="w3-col m4 label">URL web</div>
          <div className="w3-col m8 champ">{configurationPublique.url_web}</div>
        </div>

        <div>
          <div className="w3-col m4 label">URL RabbitMQ</div>
          <div className="w3-col m8 champ">{configurationPublique.url_mq}</div>
        </div>

        <div>
          <div className="w3-col m4 label">uPNP</div>
          <div className="w3-col m8 champ">{upnpDisponible}</div>
        </div>

        <div className="w3-col m12"><br/></div>
        <div className="w3-col m4">Nom du mapping</div>
        <div className="w3-col m3">Port externe</div>
        <div className="w3-col m5">URL:port interne</div>
        {listeMappings}
        <div className="w3-col m12"><br/></div>

      </div>
    );
  }

  renderNoeudsDocker() {

    let noeuds = [];
    if(this.state.noeudsDocker) {
      let noeudsDocker = this.state.noeudsDocker;
      for(let idx in noeudsDocker) {
        let noeud = noeudsDocker[idx];

        let idNoeud = noeud.ID;

        let estPublic = noeud.Spec.Labels['netzone.public'];
        let boutonPublic = (
          <button key={'public'+idNoeud} onClick={this.publierSurNoeudDocker} value={idNoeud}>Publier</button>
        )
        let boutonPrivatiser = (
          <button key={'public'+idNoeud} onClick={this.privatiserNoeudDocker} value={idNoeud}>Privatiser</button>
        )
        let boutons = [];
        if(estPublic) {
          boutons.push(boutonPrivatiser);
        } else {
          boutons.push(boutonPublic);
        }

        let labels = [];
        for(let labelKey in noeud.Spec.Labels) {
          let labelValue = noeud.Spec.Labels[labelKey];
          labels.push(
            <li key={idNoeud + labelKey}>
              {labelKey + " = " + labelValue}
            </li>
          )
        }

        let noeud_rendered = (
          <div key={noeud.ID} className='w3-card w3-row-padding row-donnees'>
            <div className="w3-col m3">
              <span className='valeur'>{noeud.Description.Hostname}</span>
              <span className='valeur'>IP: {noeud.Status.Addr}</span>
            </div>
            <div className="w3-col m7 nodelabels"><ul>{labels}</ul></div>
            <div className="w3-col m2">
              {noeud.Status.State}
              {boutons}
            </div>
          </div>
        )
        noeuds.push(noeud_rendered);
      }
    }

    return (
      <form onSubmit={event => event.preventDefault()}>
        <div className="w3-container formulaire">
          <div className='w3-card w3-row-padding row-donnees'>
            <div className="w3-col m3">Noeud</div>
            <div className="w3-col m7">Labels</div>
            <div className="w3-col m2">Status</div>
          </div>
          {noeuds}
        </div>
      </form>
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
            <div className="w3-col m4 label">URL public Coup D&apos;Oeil</div>
            <div className="w3-col m8 champ">
              <input type="text" value={this.state.urlPublicCoupdoeil} onChange={this.changerUrlCoupdoeil} size="40" placeholder="coupdoeil.millegrilles.com"/>
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
          <div className="w3-col m12 w3-center boutons buttonBar">
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
              {this.renderEtatConfiguration()}
            </div>
          </div>
        </div>

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h2 className="w3-text-blue-grey">Noeuds docker</h2>
            <div>
              {this.renderNoeudsDocker()}
            </div>
          </div>
        </div>

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h2 className="w3-text-blue-grey">Modifier paramètres routeur</h2>
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
