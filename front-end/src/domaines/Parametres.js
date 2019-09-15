import React from 'react';
import webSocketManager from '../WebSocketManager';

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
    actif: false,
    host: '',
    port: 443,
    usager: '',
    motDePasse: '',
    destinataires: '',
    origine: '',
  }

  changeActif = event => {
    this.setState({actif: event.currentTarget.value});
  }
  changeHost = event => {
    this.setState({host: event.currentTarget.value});
  }
  changePort = event => {
    this.setState({port: event.currentTarget.value});
  }
  changeOrigine = event => {
    this.setState({origine: event.currentTarget.value});
  }
  changeDestinataires = event => {
    this.setState({destinataires: event.currentTarget.value});
  }
  changeUsager = event => {
    this.setState({usager: event.currentTarget.value});
  }
  changeMotDePasse = event => {
    this.setState({motDePasse: event.currentTarget.value});
  }
  soumettre = event => {
    console.debug("Soumettre formulaire: ");
    console.debug(this.state);

    let transaction = {
      ...this.state,
    }
    transaction['a_crypter'] = {
      motDePasse: this.state.motDePasse
    }
    delete transaction['motDePasse'];

    let idDocumentCrypte = {
      domaine: 'millegrilles.domaines.Parametres',
      'mg-libelle': 'email.stmp',
    };

    let domaine = 'millegrilles.domaines.Parametres.modifierEmailSmtp';
    webSocketManager.transmettreTransaction(domaine, transaction, idDocumentCrypte)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }

      // Complet, on retourne a la page Parametres
      this.props.retourParametres(event);
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });
  }

  renderFormulaire() {
    return (
      <div className="w3-container formulaire">
        <div>
          <div className="w3-col m4 label">Activer</div>
          <div className="w3-col m8 champ">
            <select value={this.state.actif} onChange={this.changeActif} size="2">
              <option value={true}>Actif</option>
              <option value={false}>Inactif</option>
            </select>
          </div>
        </div>
        <div>
          <div className="w3-col m4 label">Serveur</div>
          <div className="w3-col m8 champ"><input type="text" value={this.state.host} onChange={this.changeHost} size="40"/></div>
        </div>
        <div>
          <div className="w3-col m4 label">Port</div>
          <div className="w3-col m8 champ"><input type="text" value={this.state.port} onChange={this.changePort} size="40"/></div>
        </div>
        <div>
          <div className="w3-col m4 label">Origine</div>
          <div className="w3-col m8 champ"><input type="text" value={this.state.origine} onChange={this.changeOrigine} size="40"/></div>
        </div>
        <div>
          <div className="w3-col m4 label">Destinataires</div>
          <div className="w3-col m8 champ"><input type="text" value={this.state.destinataires} onChange={this.changeDestinataires} size="40"/></div>
        </div>
        <div>
          <div className="w3-col m4 label">Usager</div>
          <div className="w3-col m8 champ"><input type="text" value={this.state.usager} onChange={this.changeUsager} size="40"/></div>
        </div>
        <div>
          <div className="w3-col m4 label">Mot de passe</div>
          <div className="w3-col m8 champ"><input type="password" value={this.state.motDePasse} onChange={this.changeMotDePasse} size="40"/></div>
        </div>
        <div className="w3-col m12 w3-center boutons">
          <button onClick={this.soumettre} value="Soumettre">Soumettre</button>
          <button onClick={this.props.retourParametres} value="Soumettre">Annuler</button>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="w3-col m12">
        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <div>
              <h1>Notifications courriel</h1>
              <p>
                Cette page permet de configurer un serveur courriel (SMTP) pour transmettre des notifications.
              </p>
              {this.renderFormulaire()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
