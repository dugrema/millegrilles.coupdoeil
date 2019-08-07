import React from 'react';
import 'font-awesome/css/font-awesome.min.css';

import {PanneauFichiersListe} from '../mgcomponents/FichiersUI.js';

class EcranSample1 extends React.Component {

  render() {
    return (
      <div>
        <h1>EcranSample1</h1>

        <i className="fa fa-address-book"></i>
        <br/>
        <i className="fa fa-spinner fa-spin"></i>
        <br/>
        <i className="fa fa-simplybuilt fa-5x fa-spin text-danger" aria-hidden="true"></i>
        <i className="fa fa-superpowers fa-3x fa-spin"></i>

        <PanneauFichiersListe />

      </div>
    );
  }

}

export {EcranSample1};
