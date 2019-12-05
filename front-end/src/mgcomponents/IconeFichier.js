import React from 'react';

export class IconeFichier extends React.Component {

  render() {

    // Tenter de trouver le niveau de securite pour colorer l'icone.
    let securitecss = 'prive';
    if(this.props.securite) {
      securitecss = this.props.securite.split('.')[1];
    }

    let icone;
    if(this.props.type === 'collection') {
      icone = (
        <span className="fa-stack fa-1g">
          <i className={"fa fa-file fa-stack-1x icone-gauche " + securitecss}/>
          <i className={"fa fa-file-o fa-stack-1x icone-gauche"}/>
        </span>
      );
    } else if(this.props.type === 'collection') {
      icone = (
        <span className="fa-stack fa-1g">
          <i className={"fa fa-folder fa-stack-1x icone-gauche " + securitecss}/>
          <i className={"fa fa-folder-o fa-stack-1x icone-gauche"}/>
        </span>
      );
    } else {
      // Defaut
      icone = (
        <span className="fa-stack fa-1g">
          <i className={"fa fa-file fa-stack-1x icone-gauche " + securitecss}/>
          <i className={"fa fa-file-o fa-stack-1x icone-gauche"}/>
        </span>
      );
    }

    return icone;
  }

}
