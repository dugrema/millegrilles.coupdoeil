import React from 'react';
import webSocketManager from '../WebSocketManager';

export class ActionsRecherche {

}

export class AfficherRecherche extends React.Component {

  render() {
    let etiquettes = ['etiquette1', 'etiquette2', 'etiquette3', 'etiquette4'];

    let etiquettesRendered = [];
    for(let idx in etiquettes) {
      let etiquette = etiquettes[idx];
      etiquettesRendered.push(
        <button key={etiquette}><i className="fa fa-tag"/>{etiquette}</button>
      );
    }

    return (
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding formulaire">
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
              <input type="text" name="recherche_avancee" />
            </div>
          </div>
          <div className="w3-row-padding recherche">
            <div className="w3-col m12 buttonBar">
              <button type="button" name="chercher">Chercher</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
