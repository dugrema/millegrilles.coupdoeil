import React from 'react';

// CSS pour l'application
import './Ecran.css';
import './w3.css';
import './w3-theme-blue-grey.css';
import './font-awesome.min.css';
import webSocketManager from './WebSocketManager';

import dateformatter from './formatters';

class NavBar extends React.Component {

  render() {
    return (
      <div className="w3-top">
       <div className="w3-bar w3-theme-d2 w3-left-align w3-large">
        <button className="w3-bar-item w3-button w3-hide-medium w3-hide-large w3-right w3-padding-large w3-hover-white w3-large w3-theme-d2">
          <i className="fa fa-bars"></i>
        </button>
        <button className="w3-bar-item w3-button w3-padding-large w3-theme-d4 Principal">
          <i className="fa fa-home w3-margin-right"></i>
          Coup D'Oeil
        </button>
        <button className="w3-bar-item w3-button w3-hide-small w3-padding-large w3-hover-white" title="Mes tâches">
          <i className="fa fa-calendar-check-o"></i>
        </button>
       </div>
      </div>
    );
  }
}

class Contenu extends React.Component {

  render() {
    return (
      <div className="w3-container w3-content divtop">
        <div className="w3-row">
          <MenuGauche/>
          <ContenuDomaine/>
        </div>
      </div>
    );
  }
}

function AfficherNoeuds(props) {
  const noeuds = props.listeNoeuds;

  const liste = [];
  if(noeuds) {
    noeuds.map(noeud=>{

      const senseurs = [];
      for(var noSenseur in noeud.dict_senseurs) {
        let senseur = noeud.dict_senseurs[noSenseur];
        let date_formattee = dateformatter.format_monthhour(senseur.temps_lecture);

        senseurs.push(
          <li key={noSenseur} className="senseur">
            <div className="location">
              {senseur.location}
              <button data-noeud={noeud.noeud} data-nosenseur={noSenseur} onClick={props.versPageSenseur}>GO</button>
            </div>
            <div className="numerique temperature">{senseur.temperature}&deg;C</div>
            <div className="numerique humidite">{senseur.humidite}%</div>
            <div className="numerique pression">{senseur.pression} kPa</div>
            <div className="temps">{date_formattee}</div>
          </li>
        );
      }

      var date_derniere_modification = dateformatter.format_monthhour(noeud['_mg-derniere-modification']);
      liste.push(
        <div key={noeud.noeud} className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h6 className="w3-opacity">
              <button data-noeud={noeud.noeud} onClick={props.versPageNoeud}>Noeud {noeud.noeud}</button>
            </h6>
            <div>
              Dernière modification: {date_derniere_modification}
            </div>
            <ul className="listeSenseurs">
              {senseurs}
            </ul>
          </div>
        </div>
      );

      return liste;
    });

  }

  return (
    <div className="w3-col m9">
      <div className="w3-row-padding">
        <div className="w3-col m12">
          <h1>Domaine SenseursPassifs</h1>
          {liste}
        </div>
      </div>
    </div>
  )
}

class SenseurPassifIndividuel extends React.Component {

  state = {

  };

  componentDidMount() {
    // Transmettre requete pour recevoir le document du senseur
    let requeteDocumentInitial =  {
      'requetes': [{
        'filtre': {
          '_mg-libelle': 'senseur.individuel',
          'noeud': this.props.noeud_id,
          'senseur': Number(this.props.senseur_id)
        }
      }]};
    console.debug("Requete senseur:");
    console.debug(requeteDocumentInitial);

    this.props.chargerDocument(requeteDocumentInitial, 'documentSenseur');
  }

  render() {

    const documentSenseur = this.props.documentSenseur;

    var detailSenseur = "Chargement en cours";
    var historiqueHoraire, historiqueQuotidien;

    if(documentSenseur) {
      detailSenseur = (
        <div className="w3-container w3-padding">
          <h6 className="w3-opacity">
            "Senseur " + documentSenseur.location { documentSenseur.location }
          </h6>
          { /* senseur_actuel */ }
        </div>
      );

      historiqueHoraire = (
        <div className="w3-container w3-card w3-white w3-round w3-margin"><br/>
          ** senseur_historique_horaire
        </div>
      );

      historiqueQuotidien = (
        <div className="w3-container w3-card w3-white w3-round w3-margin"><br/>
          ** senseur_historique_quotidien
        </div>
      );
    }

    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">
          <div className="w3-col m12">
            <div className="w3-card w3-round w3-white">
              { detailSenseur }
            </div>
          </div>
        </div>

        { historiqueHoraire }

        { historiqueQuotidien }
      </div>
    );
  }

}

class ContenuDomaine extends React.Component {

  state = {
    listeNoeuds: null,
    noeud_id: null,
    senseur_id: null,
    documentNoeud: null,
    documentSenseur: null
  };

  // Configuration statique du composant:
  //   subscriptions: Le nom des routing keys qui vont etre ecoutees
  config = {
    subscriptions: ['noeuds.source.millegrilles_domaines_SenseursPassifs.documents']
  };

  processMessage = (routingKey, doc) => {
    // console.log("Process message " + routingKey);
    if(routingKey === 'noeuds.source.millegrilles_domaines_SenseursPassifs.documents') {
      const mg_libelle = doc["_mg-libelle"];
      if(mg_libelle === 'noeud.individuel') {
        // MAJ d'un document de noeud.
        // console.log("Traitement d'un noeud!");
        var noeud_idx_trouve = null, listeNoeudsActuelle = this.state.listeNoeuds;

        for(var noeud_idx in this.state.listeNoeuds) {
          let noeud = listeNoeudsActuelle[noeud_idx];
          if(noeud.noeud === doc.noeud) {
            noeud_idx_trouve = noeud_idx;
            break;
          }
        }

        let copie_liste_noeuds = listeNoeudsActuelle.slice(); // Copie
        if(noeud_idx_trouve) {
          // MAJ du document de noeud dans la liste
          copie_liste_noeuds[noeud_idx_trouve] = doc;
        } else {
          // Nouveau noeud
          copie_liste_noeuds.push(doc);
        }

        this.setState({'listeNoeuds': copie_liste_noeuds});
      } else if(mg_libelle === 'senseur.individuel') {
        if(this.state.senseur_id === doc.senseur) {
          // Update du document presentement affiche
          this.setState({documentSenseur: doc});
        }
      }

    }
  };

  chargerDocument = (requete, nomDocument) => {
    // Enregistrer les routingKeys, demander le document initial.
    webSocketManager.transmettreRequete(
      'requete.millegrilles.domaines.SenseursPassifs', requete)
    .then( docInitial => {
      // console.log("Recu doc noeuds");

      let resultats = docInitial[0];
      console.log("Doc " + nomDocument + ": ");
      console.log(resultats);

      let parametres = {};
      parametres[nomDocument] = resultats
      this.setState(parametres);
    })
    .catch( err=>{
      console.error("Erreur chargement document initial");
      console.error(err);
    });
  }

  versPageListeNoeuds = () => {
    this.setState({
      noeud_id: null,
      senseur_id: null
    });
  }

  versPageNoeud = (event) => {
    const dataset = event.currentTarget.dataset;
    this.setState({
      noeud_id: dataset.noeud,
      senseur_id: null
    });
  }

  versPageSenseur = (event) => {
    const dataset = event.currentTarget.dataset;
    this.setState({
      noeud_id: dataset.noeud,
      senseur_id: dataset.nosenseur
    });
  };

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.subscribe(this.config.subscriptions, this.processMessage);

    let requeteDocumentInitial =  {
      'requetes': [{
        'filtre': {'_mg-libelle': 'noeud.individuel'}
      }]};

    this.chargerDocument(requeteDocumentInitial, 'listeNoeuds');
  }

  componentWillUmount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.unsubscribe(this.config.subscriptions);
  }

  render() {
    var contenu;

    // Routing entre composants utilise this.state:
    //  - Si on a un senseur_id, on l'affiche.
    //  - Sinon si on a un noeud, on l'affiche.
    //  - Sinon on affiche la liste des noeuds.
    if(this.state.senseur_id) {
      // Afficher la page du senseur
      contenu = (
        <SenseurPassifIndividuel
          noeud={this.state.noeud_id}
          nosenseur={this.state.senseur_id}
          chargerDocument={this.chargerDocument}
          documentSenseur={this.state.documentSenseur}
          noeud_id={this.state.noeud_id}
          senseur_id={this.state.senseur_id}
        />
      );
    } else if(this.state.noeud_id) {
      // Afficher la page du noeud
      contenu = (
        <div>
          <p>Afficher noeud {this.state.noeud_id}</p>
          <button onClick={this.versPageListeNoeuds}>Vers liste noeuds</button>
        </div>
      )
    } else {
      // Afficher la page par defaut, liste des noeuds
      contenu = (
        <AfficherNoeuds
          listeNoeuds={this.state.listeNoeuds}
          versPageNoeud={this.versPageNoeud}
          versPageSenseur={this.versPageSenseur}
          />
      );
    }

    return contenu;
  }
}

class Footer extends React.Component {

  render() {
    return (
      <footer>
        <div className="w3-container w3-theme-d3 w3-padding-16">
          <h5>Coup D'Oeil version abcd.1234</h5>
            Coup D'Oeil fait partie du groupe de logiciels
            <a href="https://www.millegrilles.com">MilleGrilles</a>.
        </div>
        <div className="w3-container w3-theme-d5">
            Powered by <a href="https://www.w3schools.com/w3css/default.asp" target="_blank" rel="noopener noreferrer">w3.css</a>,
             Meteor, node.js, MongoDB, RabbitMQ, Python, nginx, docker, letsencrypt,
             d3, RaspberryPi, Intel Xeon, Debian, Font Awesome, git.
        </div>
      </footer>
    );
  }

}

class MenuGauche extends React.Component {
  render() {
    return (
      <div className="w3-col m3">
        <MenuGaucheTop/>
        <MenuGaucheListeDomaines/>
        <MenuGaucheNavigation/>
      </div>
    );
  }
}

class MenuGaucheTop extends React.Component {
  render() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container">
          <h4 className="w3-center">DEV2</h4>
         <hr/>
         <p>
           <i className="fa fa-home fa-fw w3-margin-right w3-text-theme"></i>
           dev2.maple.mdugre.info
         </p>
        </div>
      </div>
    );
  }
}

class MenuGaucheListeDomaines extends React.Component {
  render() {
    return (
      <div className="w3-card w3-round w3-white w3-hide-small">
        <div className="w3-container">
          <p>Domaines</p>
          <p>
            <span className="w3-tag w3-small w3-theme-d5 SenseursPassifs">SenseursPassifs</span>
            <span className="w3-tag w3-small w3-theme-d3 Notifications">Notifications</span>
          </p>
        </div>
      </div>
    );
  }
}

class MenuGaucheNavigation extends React.Component {
  render() {
    return(
      <div className="w3-card w3-round">
        <div className="w3-white menu-domaine-gauche">
          Boutons!
        </div>
      </div>
    );
  }
}

class EcranApp extends React.Component {

  componentDidMount() {
    // console.debug("Mounted!");
  }

  componentWillUnmount() {
    // console.debug("Demonte!");
  }

  render() {
    return (
      <div>
        <NavBar/>
        <Contenu/>
        <Footer/>
      </div>
    );
  }

}

export default EcranApp;
