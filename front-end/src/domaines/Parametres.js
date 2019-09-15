import React from 'react';

export class Parametres extends React.Component {

  state = {
    parametreCourant: null,
  }

  sousPages = {
    'GestionEmailSmtp': GestionEmailSmtp,
  }

  fonctionsNavigation = {
    retourParametres: () => {
      this.setState({parametreCourant: null});
    },
    afficherEcran: event => {
      let sousPage = this.sousPages[event.currentTarget.value];
      this.setState({parametreCourant: sousPage});
    }
  }

  fonctionsGestion() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-opacity">Parametres d'administration de la MilleGrille</h2>

          <ul>
            <li>
              <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="GestionEmailSmtp">
                Gerer serveurs de notification par courriel (SMTP)
              </button>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  render() {
    let contenu;
    if(this.state.parametreCourant) {
      let ModuleGestion = this.state.parametreCourant;

      contenu = (
        <ModuleGestion
          {...this.fonctionsNavigation} />
      );
    } else {
      contenu = (
        <div className="w3-col m12">
          {this.fonctionsGestion()}
        </div>
      )
    }

    return (

      <div className="w3-col m9">
        <div className="w3-row-padding">
            {contenu}
        </div>
      </div>
    )
  }

}

class GestionEmailSmtp extends React.Component {
  state = {

  }

  render() {
    return (
      <div className="w3-col m12">
        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <div>
              <h1>Gestion serveur courriel pour notifications (SMTP)</h1>
              <ul>
                <li>
                  <button className="aslink" onClick={this.props.retourParametres}>
                    Retour
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
