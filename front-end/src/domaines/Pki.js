import React from 'react';
import webSocketManager from '../WebSocketManager';
// import {dateformatter} from '../formatters'
import './Pki.css';

// const domaine = 'millegrilles.domaines.Pki';
// const libelle_signerNoeud = 'signer.noeud';

export class SignerNoeud extends React.Component {

  state = {
    requeteCsr: '',
    domaine: '',
    erreur: null,
    certificat: null,
  }

  changementDomaine = event => {this.setState({domaine: event.currentTarget.value})}
  changementRequeteCsr = event => {this.setState({requeteCsr: event.currentTarget.value})}
  signer = event => {
    let transaction = {
      domaines: [this.state.domaine],
      csr: this.state.requeteCsr,
    }
    console.debug("Transaction de signature");
    console.debug(transaction);

    let domaine = 'millegrilles.domaines.MaitreDesCles.signerCertificatNoeud';
    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }
      console.debug("Reponse");
      console.debug(reponse);

      if(reponse.autorise) {

        this.setState({certificat: reponse.fullchain});

      } else {
        this.setState({
          erreur: {
            message: reponse.description,
            erreurRolesDemandeur: reponse.roles_demandeur,
          }
        });
      }
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });

  }

  renderErreur() {
    if(this.state.erreur) {
      return (
        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h2 className="w3-opacity w3-red">Erreur</h2>

            <p>
              Erreur de signature du certificat. Le serveur a refuse l&apos;operation.
            </p>

            <p>
              {this.state.erreur.message}
            </p>

          </div>
        </div>
      )
    }

    return null;
  }

  renderFormulaire() {
    return (
      <form onSubmit={event => event.preventDefault()}>
        <div className="w3-container formulaire">
          <div>
            <div className="w3-col m4">Domaine du certificat</div>
            <div className="w3-col m8 champ">
              <select value={this.state.domaine} onChange={this.changementDomaine}>
                <option value="">Choisir un domaine</option>
                <option value="SenseursPassifs">SenseursPassifs</option>
              </select>
            </div>
          </div>

          <div>
            <div className="w3-col m12">
              Coller le texte de la requete PEM
            </div>
          </div>

          <div>
            <div className="w3-col m12">
              <textarea
                value={this.state.requeteCsr} onChange={this.changementRequeteCsr}
                cols="60" rows="20" />
            </div>
          </div>

          <div className="w3-col m12 w3-center boutons buttonBar">
            <button onClick={this.signer} value="Signer">Signer</button>
            <button onClick={this.props.retourPki} value="Annuler">Annuler</button>
          </div>

        </div>
      </form>
    )
  }

  render() {

    let contenu;
    if(this.state.certificat) {
      contenu = (
        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <p>
              Copier le contenu de ce certificat dans un fichier .pem sur
              le noeud.
            </p>
            <pre>
              {this.state.certificat}
            </pre>
          </div>
        </div>
      )
    } else {
      contenu = (
        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            {this.renderFormulaire()}
          </div>
        </div>
      )
    }

    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">

          <div className="w3-card w3-round w3-white">
            <div className="w3-container w3-padding">
              <h2 className="w3-opacity">Signer un certificat de noeud</h2>

              <p>
                Cette page permet de signer une requete de certificat generee
                sur un noeud qui doit se connecter a la MilleGrille
              </p>

            </div>
          </div>

          {this.renderErreur()}

          {contenu}

        </div>
      </div>
    );
  }

}

export class Pki extends React.Component {

  state = {
    ecranCourant: null,
  }

  sousPages = {
    'SignerNoeud': SignerNoeud,
  }

  fonctionsNavigation = {
    retourPki: () => {
      this.setState({ecranCourant: null});
    },
    afficherEcran: event => {
      let sousPage = this.sousPages[event.currentTarget.value];
      this.setState({ecranCourant: sousPage});
    }
  }

  fonctionsGestion() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-opacity">Gestion des certificats (Public Key Infrastructure)</h2>

          <ul>
            <li>
              <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="SignerNoeud">
                Signer un certificat de noeud
              </button>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  render() {
    let contenu;
    if(this.state.ecranCourant) {
      let ModuleGestion = this.state.ecranCourant;

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
