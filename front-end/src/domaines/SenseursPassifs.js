import React from 'react';
import './SenseursPassifs.css';
import webSocketManager from '../WebSocketManager';
import {dateformatter, numberformatter} from '../formatters';
import { GraphiqueCharte2D } from '../chart.js';

export class SenseursPassifs extends React.Component {

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
        if(this.state.senseur_id && Number(this.state.senseur_id) === doc.senseur) {
          // Update du document presentement affiche
          // On met dans un array pour matcher la reponse initiale (find)
          this.setState({documentSenseur: [doc]});
        }
      }

    }
  };

  chargerDocument = (requete, nomDocument, domaine) => {
    if(!domaine) {
      // Domaine par defaut est une requete vers SenseursPassifs
      domaine = 'requete.millegrilles.domaines.SenseursPassifs';
    }
    // Enregistrer les routingKeys, demander le document initial.
    webSocketManager.transmettreRequete(
      'requete.millegrilles.domaines.SenseursPassifs', requete)
    .then( docInitial => {
      // console.debug("Recu doc");
      // console.debug(docInitial);

      let resultats = docInitial[0];
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
      senseur_id: null,
      documentNoeud: null,
      documentSenseur: null
    });
  }

  versPageNoeud = (event) => {
    const dataset = event.currentTarget.dataset;
    this.setState({
      noeud_id: dataset.noeud,
      senseur_id: null,
      documentSenseur: null
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
          versPageListeNoeuds={this.versPageListeNoeuds}
        />
      );
    } else if(this.state.noeud_id) {
      // Afficher la page du noeud
      contenu = (
        <div>
          <p>Afficher noeud {this.state.noeud_id}</p>
          <button className="aslink" onClick={this.versPageListeNoeuds}>Vers liste noeuds</button>
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
              <button
                className="aslink"
                data-noeud={noeud.noeud}
                data-nosenseur={noSenseur}
                onClick={props.versPageSenseur}>{senseur.location}</button>
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
        <div key={noeud.noeud} className="w3-card w3-round w3-white w3-card_BR">
          <div className="w3-container w3-padding">
            <h6 className="w3-opacity">
              <button className="aslink" data-noeud={noeud.noeud} onClick={props.versPageNoeud}>Noeud {noeud.noeud}</button>
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
    afficherTableauHoraire: false,
    afficherTableQuotidien: false
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
    // console.debug("Requete senseur:");
    // console.debug(requeteDocumentInitial);

    this.props.chargerDocument(requeteDocumentInitial, 'documentSenseur');
  }

  afficherTableauHoraire = () => {
    // Toggle etat
    const toggle = !this.state.afficherTableauHoraire;
    this.setState({afficherTableauHoraire: toggle});
  };

  afficherTableauQuotidien = () => {
    // Toggle etat
    const toggle = !this.state.afficherTableauQuotidien;
    this.setState({afficherTableauQuotidien: toggle});
  };

  renderTableauHoraire() {

    var contenu;
    if(this.state.afficherTableauHoraire) {
      const listeSenseurs = this.props.documentSenseur;
      const documentSenseur = listeSenseurs[0];
      const moyennesDernierJour = documentSenseur.moyennes_dernier_jour;

      const rows = [];

      for(var idx in moyennesDernierJour) {
        var moyenne = moyennesDernierJour[idx];
        rows.push((
          <tr key={moyenne.periode}>
            <td>{dateformatter.format_monthhour(moyenne.periode)}</td>
            <td className="numerique temperature">{numberformatter.format_numberdecimals(moyenne['temperature-moyenne'], 1)}&deg;C</td>
            <td className="numerique humidite">{numberformatter.format_numberdecimals(moyenne['humidite-moyenne'], 1)}%</td>
            <td className="numerique pression">{numberformatter.format_numberdecimals(moyenne['pression-moyenne'], 1)}kPa</td>
          </tr>
        ));
      }

      contenu = (
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Temperature</th><th>Humidite</th><th>Pression</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      )
    }

    return contenu;
  }

  renderTableauQuotidien() {

    var contenu;
    if(this.state.afficherTableauQuotidien) {
      const listeSenseurs = this.props.documentSenseur;
      const documentSenseur = listeSenseurs[0];
      const extremesDernierMois = documentSenseur.extremes_dernier_mois;

      const rows = [];

      for(var idx in extremesDernierMois) {
        var extremes = extremesDernierMois[idx];
        rows.push((
          <tr key={extremes.periode}>
            <td>{dateformatter.format_monthhour(extremes.periode)}</td>
            <td className="numerique temperature">{dateformatter.format_numberdecimals(extremes['temperature-maximum'], 1)}&deg;C</td>
            <td className="numerique temperature">{dateformatter.format_numberdecimals(extremes['temperature-minimum'], 1)}&deg;C</td>
            <td className="numerique humidite">{dateformatter.format_numberdecimals(extremes['humidite-maximum'], 1)}%</td>
            <td className="numerique humidite">{dateformatter.format_numberdecimals(extremes['humidite-minimum'], 1)}%</td>
            <td className="numerique pression">{dateformatter.format_numberdecimals(extremes['pression-maximum'], 1)}kPa</td>
            <td className="numerique pression">{dateformatter.format_numberdecimals(extremes['pression-minimum'], 1)}kPa</td>
          </tr>
        ));
      }

      contenu = (
        <table>
          <thead>
            <tr>
              <th rowSpan="2">Date</th>
              <th colSpan="2">Temperature</th>
              <th colSpan="2">Humidite</th>
              <th colSpan="2">Pression</th>
            </tr>
            <tr>
              <th>Max</th><th>Min</th>
              <th>Max</th><th>Min</th>
              <th>Max</th><th>Min</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      )
    }

    return contenu;
  }

  render() {

    const listeSenseurs = this.props.documentSenseur;

    var detailSenseur = "Chargement en cours";
    var historiqueHoraire, historiqueQuotidien;

    if(listeSenseurs) {
      const documentSenseur = listeSenseurs[0];
      detailSenseur = (
        <div className="w3-container w3-padding">
          <h6 className="w3-opacity">
            Senseur { documentSenseur.location }
          </h6>

          <div>
            Noeud: {documentSenseur.noeud}
            <button className="aslink" onClick={this.props.versPageListeNoeuds}>Vers liste noeuds</button>
          </div>
          <div>Numero senseur: {documentSenseur.senseur}</div>
          <div className="temps">Derniere lecture: {dateformatter.format_monthhour(documentSenseur.temps_lecture)}</div>
          <div>Batterie: {documentSenseur.millivolt} mV</div>
          <div className="numerique temperature">Temperature: {documentSenseur.temperature}&deg;C</div>
          <div className="numerique humidite">Humidite: {documentSenseur.humidite}%</div>
          <div className="numerique pression">Pression atmospherique: {documentSenseur.pression} kPa</div>
          <div className="tendance">Tendance pression atmospherique: {documentSenseur.tendance_formattee}</div>
        </div>
      );

      historiqueHoraire = (
        <div className="w3-container w3-card w3-white w3-round w3-margin"><br/>
          <h5 className="w3-opacity">
            Historique 24 heures {documentSenseur.location}
          </h5>
          <h6>Temperature</h6>
          <GraphiqueCharte2DReact
            name="graphique_horaire_temperature"
            donnees={documentSenseur.moyennes_dernier_jour}
            serie="temperature-moyenne" min="-10" max="20" tick="5"
          />

          <h6>Humidite</h6>
          <GraphiqueCharte2DReact
            name="graphique_horaire_humidite"
            donnees={documentSenseur.moyennes_dernier_jour}
            serie="humidite-moyenne" min="30" max="70" tick="5"
          />

          <h6>Pression</h6>
          <GraphiqueCharte2DReact
            name="graphique_horaire_pression"
            donnees={documentSenseur.moyennes_dernier_jour}
            serie="pression-moyenne" min="95" max="105" tick="2"
          />

          {this.renderTableauHoraire()}
          <button onClick={this.afficherTableauHoraire}>Toggle tableau</button>
          <br/>
        </div>
      );

      historiqueQuotidien = (
        <div className="w3-container w3-card w3-white w3-round w3-margin"><br/>
          <h5 className="w3-opacity">
            Historique 31 jours {documentSenseur.location}
          </h5>
          <h6>Temperature</h6>
          <GraphiqueCharte2DReact
            name="graphique_quotidien_temperature"
            donnees={documentSenseur.extremes_dernier_mois}
            serie="temperature-maximum" serie2="temperature-minimum"
            min="-10" max="20" tick="5"
          />

          {this.renderTableauQuotidien()}
          <button onClick={this.afficherTableauQuotidien}>Toggle tableau</button>
          <br/>
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

class GraphiqueCharte2DReact extends React.Component {

  state = {
    graphique: null
  }

  preparerGraphique() {
    const graphiqueHoraireObj = new GraphiqueCharte2D();

    graphiqueHoraireObj.idDiv = "#" + this.props.name;
    graphiqueHoraireObj.nomVariableOrdonnee1 = this.props.serie;
    graphiqueHoraireObj.nomVariableOrdonnee2 = this.props.serie2;
    graphiqueHoraireObj.ordonnee_base_max = this.props.max || 100;
    graphiqueHoraireObj.ordonnee_base_min = this.props.min || 0;
    graphiqueHoraireObj.ordonnee_tick = this.props.tick || 1;
    graphiqueHoraireObj.preparer_graphique();

    return graphiqueHoraireObj
  }

  componentDidMount() {
    const graphique = this.preparerGraphique();
    graphique.attacher_svg();
    this.setState({'graphique': graphique});
  }

  render() {
    if(this.state.graphique) {
      this.state.graphique.appliquerDonnees(this.props.donnees);
    }
    return (
      <div id={this.props.name}></div>
    );
  }

}

// Exports
// module.exports = {SenseursPassifs}
