import React from 'react';

import './Annuaire.css';
import webSocketManager from '../WebSocketManager';

export class Annuaire extends React.Component {

  affichagePrincipal() {
    return(
      <div>Principal</div>
    )
  }

  render() {

    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">
          <div className="w3-card w3-round w3-white">
            <div className="w3-container w3-padding">
              <h2 className="w3-opacity">Annuaire</h2>

            </div>
          </div>
        </div>
      </div>
    );
    
  }

}
