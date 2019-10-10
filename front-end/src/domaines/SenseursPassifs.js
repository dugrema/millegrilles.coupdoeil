import React from 'react';
import './SenseursPassifs.css';
import webSocketManager from '../WebSocketManager';
import {dateformatter, numberformatter} from '../formatters';
import { GraphiqueCharte2D } from '../chart.js';

export class SenseursPassifs extends React.Component {

  state = {
    listeNoeuds: [],
    uuid_senseur: null,
  };

  // Configuration statique du composant:
  //   subscriptions: Le nom des routing keys qui vont etre ecoutees
  config = {
    subscriptions: [
      'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.senseur.individuel',
      'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.noeud.individuel',
    ]
  };

  // Fonctions de navigation
  fonctionsNavigation = {
    retourSenseurs: event => {
      this.setState({uuid_senseur: null});
    },
    versPageListeNoeuds: event => {
      this.setState({uuid_senseur: null});
    },
    versPageSenseur: event => {
      this.setState({uuid_senseur: event.currentTarget.value});
    },
  }

  processMessage = (routingKey, doc) => {
    // console.log("Process message " + routingKey);
    // const mg_libelle = doc["_mg-libelle"];
    if(routingKey === 'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.noeud.individuel') {
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
    } else if(routingKey === 'noeuds.source.millegrilles_domaines_SenseursPassifs.documents.senseur.individuel') {
      if(this.state.uuid_senseur && this.state.uuid_senseur === doc.uuid_senseur) {
        // Update du document presentement affiche
        // On met dans un array pour matcher la reponse initiale (find)
        this.setState({documentSenseur: [doc]});
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

  supprimerSenseur = (event) => {
    const dataset = event.currentTarget.dataset;
    var noSenseur = dataset.nosenseur;
    var nomNoeud = dataset.noeud;

    var transaction = {
      noeud: nomNoeud,
      senseurs: [noSenseur],
    }
    webSocketManager.transmettreTransaction('millegrilles.domaines.SenseursPassifs.suppressionSenseur', transaction);

    this.setState({
      documentSenseur: null,
      uuid_senseur: null,
    })
  }

  renommerSenseur = event => {
    const form = event.currentTarget.form;
    var transaction = {
      uuid_senseur: form.uuid_senseur.value,
      location: form.location.value,
    }
    webSocketManager.transmettreTransaction('millegrilles.domaines.SenseursPassifs.changementAttributSenseur', transaction);
  }

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.subscribe(this.config.subscriptions, this.processMessage);

    let requeteDocumentInitial =  {
      'requetes': [{
        'filtre': {'_mg-libelle': 'noeud.individuel'}
      }]};

    this.chargerDocument(requeteDocumentInitial, 'listeNoeuds');
  }

  componentWillUnmount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.unsubscribe(this.config.subscriptions);
  }

  render() {
    var contenu;

    // Routing entre composants utilise this.state:
    //  - Si on a un uuid_senseur, on l'affiche.
    //  - Sinon si on a un noeud, on l'affiche.
    //  - Sinon on affiche la liste des noeuds.
    if(this.state.uuid_senseur) {
      // Afficher la page du senseur
      contenu = (
        <SenseurPassifIndividuel
          noeud={this.state.noeud_id}
          nosenseur={this.state.uuid_senseur}
          chargerDocument={this.chargerDocument}
          documentSenseur={this.state.documentSenseur}
          noeud_id={this.state.noeud_id}
          uuid_senseur={this.state.uuid_senseur}
          supprimerSenseur={this.supprimerSenseur}
          renommerSenseur={this.renommerSenseur}
          {...this.fonctionsNavigation}
        />
      );
    } else {
      // Afficher la page par defaut, liste des noeuds
      contenu = (
        <AfficherNoeuds
          listeNoeuds={this.state.listeNoeuds}
          versPageNoeud={this.versPageNoeud}
          {...this.fonctionsNavigation}
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

        let lecturesFormattees = formatterLecture(senseur);

        senseurs.push(
          <div key={noSenseur} className="senseur">
            <div className="location">
              <button
                className="aslink"
                value={senseur.uuid_senseur}
                onClick={props.versPageSenseur}>{lecturesFormattees.nomSenseur}</button>
            </div>
            <div className="numerique temperature">{lecturesFormattees.temperature}</div>
            <div className="numerique humidite">{lecturesFormattees.humidite}</div>
            <div className="numerique pression">{lecturesFormattees.pression}</div>
            <div className="numerique humidite">{lecturesFormattees.batterieIcon}</div>
            <div className="temps">{lecturesFormattees.timestamp}</div>
          </div>
        );
      }

      var date_derniere_modification = dateformatter.format_monthhour(noeud['_mg-derniere-modification']);
      liste.push(
        <div key={noeud.noeud} className="w3-card w3-round w3-white w3-card_BR">
          <div className="w3-container w3-padding">
            <h6 className="w3-opacity">Noeud {noeud.noeud}</h6>
            <div>
              Dernière modification: {date_derniere_modification}
            </div>

            <div className="senseur">
              <div className="location">Location</div>
              <div className="numerique temperature">Temperature</div>
              <div className="numerique humidite">Humidite</div>
              <div className="numerique pression">Pression</div>
              <div className="numerique humidite">Batterie</div>
              <div className="temps">Date lecture</div>
            </div>

            <div className="listeSenseurs">
              {senseurs}
            </div>
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
          {liste}
        </div>
      </div>
    </div>
  )
}

class SenseurPassifIndividuel extends React.Component {

  state = {
    afficherTableauHoraire: false,
    afficherTableQuotidien: false,
    locationSenseur: '',
    documentSenseur: null,
  };

  componentDidMount() {
    // Transmettre requete pour recevoir le document du senseur
    let requeteDocumentInitial =  {
      'requetes': [{
        'filtre': {
          '_mg-libelle': 'senseur.individuel',
          // 'noeud': this.props.noeud_id,
          'uuid_senseur': this.props.uuid_senseur
        }
      }]};
    // console.debug("Requete senseur:");
    // console.debug(requeteDocumentInitial);

    let domaine = 'requete.millegrilles.domaines.SenseursPassifs.documentSenseur';
    webSocketManager.transmettreRequete(domaine, requeteDocumentInitial)
    .then( docInitial => {
      // console.debug("Recu document senseur");
      // console.debug(docInitial);

      let documentSenseur = docInitial[0][0];

      this.setState({
        documentSenseur,
        locationSenseur: documentSenseur.location,
      })
    })
    .catch( err=>{
      console.error("Erreur chargement document initial");
      console.error(err);
    });
    this.props.chargerDocument(requeteDocumentInitial, 'documentSenseur');
  }

  changerLocationSenseur = event => {
    this.setState({locationSenseur: event.currentTarget.value});
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
        <table className="tableauDonnees tableauDonneesMoyennes">
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
    if(this.state.afficherTableauQuotidien && this.props.donnees) {
      const listeSenseurs = this.props.documentSenseur;
      const documentSenseur = listeSenseurs[0];
      const extremesDernierMois = documentSenseur.extremes_dernier_mois;

      const rows = [];

      for(var idx in extremesDernierMois) {
        var extremes = extremesDernierMois[idx];
        rows.push((
          <tr key={extremes.periode}>
            <td>{dateformatter.format_monthhour(extremes.periode)}</td>
            <td className="numerique temperature">{numberformatter.format_numberdecimals(extremes['temperature-maximum'], 1)}&deg;C</td>
            <td className="numerique temperature">{numberformatter.format_numberdecimals(extremes['temperature-minimum'], 1)}&deg;C</td>
            <td className="numerique humidite">{numberformatter.format_numberdecimals(extremes['humidite-maximum'], 1)}%</td>
            <td className="numerique humidite">{numberformatter.format_numberdecimals(extremes['humidite-minimum'], 1)}%</td>
            <td className="numerique pression">{numberformatter.format_numberdecimals(extremes['pression-maximum'], 1)}kPa</td>
            <td className="numerique pression">{numberformatter.format_numberdecimals(extremes['pression-minimum'], 1)}kPa</td>
          </tr>
        ));
      }

      contenu = (
        <table className="tableauDonnees tableauDonneesExtremes">
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

    var detailSenseur = "Chargement en cours", modifierSenseur = null;
    var historiqueHoraire, historiqueQuotidien;

    if(listeSenseurs && listeSenseurs[0]) {
      const documentSenseur = listeSenseurs[0];
      var lecturesFormattees = formatterLecture(documentSenseur);

      var lignes = [];
      if(lecturesFormattees.bat_mv) {
        lignes.push(
          <div key="bat_mv">
            <div className="w3-col m4 label">Batterie</div>
            <div className="w3-col m8">{lecturesFormattees.bat_mv} ({documentSenseur.bat_reserve} {lecturesFormattees.batterieIcon})</div>
          </div>
        )
      }
      if(lecturesFormattees.temperature) {
        lignes.push(
          <div key="temperature">
            <div className="w3-col m4 label">Temperature</div>
            <div className="w3-col m8">{lecturesFormattees.temperature}</div>
          </div>
        )
      }
      if(lecturesFormattees.humidite) {
        lignes.push(
          <div key="humidite">
            <div className="w3-col m4 label">Humidite</div>
            <div className="w3-col m8">{lecturesFormattees.humidite}</div>
          </div>
        )
      }
      if(lecturesFormattees.pression) {
        lignes.push(
          <div key="pression">
            <div className="w3-col m4 label">Pression atmospherique</div>
            <div className="w3-col m8">
              {lecturesFormattees.pression} {documentSenseur.tendance_formattee}
            </div>
          </div>
        )
      }

      detailSenseur = (
        <div className="w3-container w3-padding formulaire">
          <h6 className="w3-col m12 w3-opacity">
            Senseur { lecturesFormattees.location }
          </h6>
          <div>
            <div className="w3-col m4 label">Numero senseur</div>
            <div className="w3-col m8">{documentSenseur.uuid_senseur}</div>
          </div>
          <div>
            <div className="w3-col m4 label">Noeud</div>
            <div className="w3-col m8">{documentSenseur.noeud}</div>
          </div>
          <div>
            <div className="w3-col m4 label">Derniere lecture</div>
            <div className="w3-col m8">{lecturesFormattees.timestamp}</div>
          </div>

          {lignes}

        </div>
      );

      modifierSenseur = (
        <div className="w3-container w3-padding">
          <h6 className="w3-opacity">Modifier</h6>
          <div className="w3-col m12">
            <form onSubmit={event => event.preventDefault()}>
              <label>
                Renommer:
                <input type="text" name="location" defaultValue={documentSenseur.location} onChange={this.changerLocationSenseur}/>
                <input type="hidden" name="uuid_senseur" value={documentSenseur.uuid_senseur}/>
                <button onClick={this.props.renommerSenseur}>Renommer</button>
              </label>
            </form>
          </div>
          <div className="w3-col m12 w3-center boutons buttonBar">
            <input type="hidden" name="uuid_senseur" value={documentSenseur.uuid_senseur} />
            <button onClick={this.props.retourSenseurs}>Retour</button>
            <button
              onClick={this.props.supprimerSenseur}
              value={documentSenseur.uuid_senseur}>Supprimer</button>
          </div>
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

          <h6>Humidite</h6>
          <GraphiqueCharte2DReact
            name="graphique_quotidien_humidite"
            donnees={documentSenseur.extremes_dernier_mois}
            serie="humidite-maximum" serie2="humidite-minimum"
            min="30" max="70" tick="5"
          />

          <h6>Pression</h6>
          <GraphiqueCharte2DReact
            name="graphique_quotidien_pression"
            donnees={documentSenseur.extremes_dernier_mois}
            serie="pression-maximum" serie2="pression-minimum"
            min="95" max="105" tick="2"
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

            <div className="w3-card w3-round w3-white">
              { modifierSenseur }
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
    if(this.state.graphique && this.props.donnees) {
      this.state.graphique.appliquerDonnees(this.props.donnees);
    }
    return (
      <div id={this.props.name}></div>
    );
  }

}

function getBatterieIcon(documentSenseur) {
  if(!documentSenseur) return null;

  var batterieIcon = null;
  if(documentSenseur.bat_reserve > 100) {
    batterieIcon = (<i className="fa fa-bug"/>);
  } else if(documentSenseur.bat_reserve == 100) {
    batterieIcon = (<i className="fa fa-bolt"/>);
  } else if(documentSenseur.bat_reserve < 100 && documentSenseur.millivolt > 75) {
    batterieIcon = (<i className="fa fa-battery-full"/>);
  } else if(documentSenseur.bat_reserve > 50) {
    batterieIcon = (<i className="fa fa-battery-three-quarters"/>);
  } else if(documentSenseur.bat_reserve > 20) {
    batterieIcon = (<i className="fa fa-battery-quarter"/>);
  } else if(documentSenseur.bat_reserve > 0) {
    batterieIcon = (<i className="fa fa-battery-empty"/>);
  } else {
    batterieIcon = (<i className="fa fa-bug"/>);
  }

  return batterieIcon;
}

function formatterLecture(documentSenseur) {
  let temperature = null, humidite = null, pression = null, timestamp = null;
  if(documentSenseur.temperature) { temperature = (<span>{numberformatter.format_numberdecimals(documentSenseur.temperature, 1)}&deg;C</span>); }
  if(documentSenseur.humidite) { humidite = (<span>{documentSenseur.humidite}%</span>); }
  if(documentSenseur.pression) { pression = (<span>{documentSenseur.pression} kPa</span>); }
  if(documentSenseur.timestamp) {
    timestamp = dateformatter.format_monthhour(documentSenseur.timestamp);
  }

  var bat_mv, bat_reserve;
  var batterieIcon = getBatterieIcon(documentSenseur);
  if(documentSenseur.bat_mv) {
    bat_mv = (<span>{documentSenseur.bat_mv} mV</span>);
  }
  if(documentSenseur.bat_reserve) {
    bat_reserve = (<span>{documentSenseur.bat_reserve}%</span>);
  }

  var nomSenseur = documentSenseur.location;
  if(!nomSenseur || nomSenseur === '') {
    nomSenseur = documentSenseur.uuid_senseur;
  }

  return {nomSenseur, temperature, humidite, pression, timestamp, batterieIcon, bat_mv, bat_reserve};
}
