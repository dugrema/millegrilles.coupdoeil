import React from 'react';
import webSocketManager from '../WebSocketManager';

export class ActionsRecherche {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

  chercher = (parametres) => {
    let texteString = parametres.texte;

    // Split texte en mots
    texteString = texteString.split(' ');

    const domaine = 'requete.millegrilles.domaines.GrosFichiers';
    const requete = {'requetes': [
      {
        'filtre': {
          '_mg-libelle': {'$in': ['fichier', 'collection', 'collection.figee',]},
          'etiquettes': {'$all': texteString},
        }
      }
    ]};

    return this.webSocketManager.transmettreRequete(domaine, requete)
    .then( docsRecu => {
      console.log("Resultats requete");
      console.log(docsRecu);
      return docsRecu[0];
    });
  }

}

export class AfficherRecherche extends React.Component {

  state = {
    rechercheString: '',
    resultats: null,
  }

  changerRecherche = event => {
    this.setState({rechercheString: event.currentTarget.value});
  }

  chercher = event => {
    this.props.actionsRecherche.chercher({texte: this.state.rechercheString})
    .then(docs=>{
      this.setState({resultats: docs});
    });
  }

  ouvrirDocument = event => {
    let uuid = event.currentTarget.value;
    this.props.actionsNavigation.chargeruuid(uuid);
  }

  afficherResultats() {
    const listeResultats = this.state.resultats;

    var affichageResultats = null;
    if(listeResultats) {
      const resultats = [];
      listeResultats.forEach(resultat => {
        resultats.push(
          <div key={resultat.uuid} className={"w3-row-padding " + resultat.securite}>
            <div className="w3-col m4">
              <button className="aslink" onClick={this.ouvrirDocument} value={resultat.uuid}>
                {resultat.nom}
              </button>
            </div>
            <div className="w3-col m2">
              {resultat.taille}
            </div>
            <div className="w3-col m2">
              {resultat.commentaires}
            </div>
          </div>
        );
      });

      if(resultats.length == 0) {
        resultats = 'Aucuns résultats';
      }

      affichageResultats = (
        <div className="w3-card w3-round w3-white w3-card">
          <div className="w3-container w3-padding formulaire">

            <div className="w3-col m12">
              <h2>Résultats</h2>
            </div>

            {resultats}

          </div>
        </div>
      );
    }

    return affichageResultats;
  }

  sectionRecherche() {

    let etiquettes = ['etiquette1', 'etiquette2', 'etiquette3', 'etiquette4'];

    let etiquettesRendered = [];
    for(let idx in etiquettes) {
      let etiquette = etiquettes[idx];
      etiquettesRendered.push(
        <button key={etiquette}><i className="fa fa-tag"/>{etiquette}</button>
      );
    }

    return (
      <div>
        <div className="w3-row-padding">
          <h2 className="w3-col m12">Recherche de fichiers</h2>
        </div>

        <div className="w3-row-padding">
          <div className="w3-col m12 liste-etiquettes">
            {etiquettesRendered}
          </div>
        </div>

        <div className="w3-row-padding recherche">
          <div className="w3-col m12">
            <input type="text" value={this.state.rechercheString} onChange={this.changerRecherche} />
          </div>
        </div>

        <div className="w3-row-padding recherche">
          <div className="w3-col m12 buttonBar">
            <button type="button" onClick={this.chercher}>Chercher</button>
          </div>
        </div>
      </div>
    )
  }


  render() {

    return (
      <div>

        <div className="w3-card w3-round w3-white w3-card">
          <div className="w3-container w3-padding formulaire">
            {this.sectionRecherche()}
          </div>
        </div>

        {this.afficherResultats()}

      </div>
    );
  }
}
