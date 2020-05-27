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
    } else if(this.props.popupCreerCollectionValeurs) {
      return (
        <PopupCreerCollection
          soumettre={this.props.soumettreCreerCollection}
          annuler={this.props.annulerCreerCollection}
          />
      );
    } else if(this.props.popupRenommerCollectionValeurs) {
      return (
        <PopupRenommerCollection
          valeur={this.props.popupRenommerCollectionValeurs}
          soumettre={this.props.soumettreChangerNomCollection}
          annuler={this.props.annulerChangerNomCollection}
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

class PopupCreerCollection extends React.Component {

  render() {
    return (
      <div className='popup'>
        <div className='popupinner'>
          <h1>Creer nouvelle collection</h1>
          <form onSubmit={e=>e.preventDefault()}>
            <p>Nom collection: <input type="text" name="nomcollection"/></p>
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

class PopupRenommerCollection extends React.Component {
  render() {
    return (
      <div className='popup'>
        <div className='popupinner'>
          <h1>Renommer collection</h1>
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
