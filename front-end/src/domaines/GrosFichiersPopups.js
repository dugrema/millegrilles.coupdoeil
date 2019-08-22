import React from 'react';

export class GrosFichierAfficherPopup extends React.Component {

  render() {
    if(this.props.popupRenommerFichierValeurs) {
      return (
        <PopupChangerNom
          valeur={this.props.popupRenommerFichierValeurs}
          soumettre={this.props.soumettreChangerNomFichier}
          annuler={this.props.annulerChangerNomFichier}
          />
      );
    } else if(this.props.popupCreerRepertoireValeurs) {
      return (
        <PopupCreerRepertoire
          soumettre={this.props.soumettreCreerRepertoire}
          annuler={this.props.annulerCreerRepertoire}
          />
      );
    } else if(this.props.popupRenommerRepertoireValeurs) {
      return (
        <PopupRenommerRepertoire
          valeur={this.props.popupRenommerRepertoireValeurs}
          soumettre={this.props.soumettreChangerNomRepertoire}
          annuler={this.props.annulerChangerNomRepertoire}
          />
      );
    }


    return null;
  }
}

class PopupChangerNom extends React.Component {
  render() {
    return (
      <div className='popup'>
        <div className='popupinner'>
          <h1>Changer le nom</h1>
          <form onSubmit={e=>e.preventDefault()}>
            <p>Nom courant: {this.props.valeur.nom}</p>
            <p>Nouveau nom: <input type="text" name="nouveauNom" defaultValue={this.props.valeur.nom}/></p>
            <div>
              <button type="button" onClick={this.props.soumettre}>Soumettre</button>
              <button type="button" onClick={this.props.annuler}>Annuler</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

class PopupCreerRepertoire extends React.Component {

  render() {
    return (
      <div className='popup'>
        <div className='popupinner'>
          <h1>Creer nouveau repertoire</h1>
          <form onSubmit={e=>e.preventDefault()}>
            <p>Nom repertoire: <input type="text" name="nomrepertoire"/></p>
            <div>
              <button type="button" onClick={this.props.soumettre}>Soumettre</button>
              <button type="button" onClick={this.props.annuler}>Annuler</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

}

class PopupRenommerRepertoire extends React.Component {
  render() {
    return (
      <div className='popup'>
        <div className='popupinner'>
          <h1>Renommer repertoire</h1>
          <form onSubmit={e=>e.preventDefault()}>
            <p>Nom courant: {this.props.valeur.nom}</p>
            <p>Nouveau nom: <input type="text" name="nouveauNom" defaultValue={this.props.valeur.nom}/></p>
            <div>
              <button type="button" onClick={this.props.soumettre}>Soumettre</button>
              <button type="button" onClick={this.props.annuler}>Annuler</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
