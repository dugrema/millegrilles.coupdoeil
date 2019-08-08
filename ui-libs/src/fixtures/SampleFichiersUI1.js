import React from 'react';
import 'font-awesome/css/font-awesome.min.css';

import {PanneauFichiersListe, PanneauFichiersIcones} from '../mgcomponents/FichiersUI.js';

class EcranSample1 extends React.Component {

  render() {
    return (
      <div>
        <h1>Panneau exemples pour FichiersUI.js</h1>

        <h2>Panneau Fichiers Icones</h2>
        <PanneauFichiersIcones />

        <h2>Panneau Fichiers Liste</h2>
        <PanneauFichiersListe />

      </div>
    );
  }

}

export {EcranSample1};
