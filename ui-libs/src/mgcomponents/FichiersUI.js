import React from 'react';
import 'font-awesome/css/font-awesome.min.css';

import './FichiersUI.css';

class PanneauFichiersIcones extends React.Component {

  render() {
    return (
      <div className="PanneauFichiersIcones">
        <div>
          <i className="fa fa-folder-open-o fa-5x"></i>
          <p>nom_repertoire_et_fichier trop_longs fdas.txt</p>
        </div>
        <div>
          <i className="fa fa-folder-open-o fa-5x"></i>
          <p>nom_repertoire_et_fichier trop_longs fdas.txt</p>
        </div>
        <div>
          <i className="fa fa-folder-open-o fa-5x"></i>
          <p>nom_repertoire_et_fichier trop_longs fdas.txt</p>
        </div>
        <div>
          <i className="fa fa-folder-open-o fa-5x"></i>
          <p>nom_repertoire_et_fichier trop_longs fdas.txt</p>
        </div>
        <div>
          <i className="fa fa-folder-open-o fa-5x"></i>
          <p>nom_repertoire_et_fichier trop_longs fdas.txt</p>
        </div>
        <div>
          <i className="fa fa-folder-open-o fa-5x"></i>
          <p>nom_repertoire_et_fichier trop_longs fdas.txt</p>
        </div>
        <div>
          <i className="fa fa-folder-open-o fa-5x"></i>
          <p>nom_repertoire_et_fichier trop_longs fdas.txt</p>
        </div>
      </div>
    );
  }
}

class PanneauFichiersListe extends React.Component {

  render() {
    return (
      <p>Liste</p>
    );
  }
}

export {PanneauFichiersIcones, PanneauFichiersListe};
