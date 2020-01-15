import React from 'react';
import { Container, Row, Alert } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import './NiveauSecurite.css';

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

export class SectionSecurite extends React.Component {

  render() {

    let iconeCadenas, couleur, transLabel;
    if(this.props.securite === '4.secure') {
      iconeCadenas = 'fa-lock';
      couleur = 'info';
      transLabel = 'global.securite.secure';
    } else if(this.props.securite === '3.protege') {
      iconeCadenas = 'fa-lock';
      couleur = 'success';
      transLabel = 'global.securite.protege';
    } else if(this.props.securite === '2.prive') {
      iconeCadenas = 'fa-unlock';
      couleur = 'dark';
      transLabel = 'global.securite.prive';
    } else if(this.props.securite === '1.public') {
      iconeCadenas = 'fa-unlock';
      couleur = 'danger';
      transLabel = 'global.securite.public';
    }

    return (
      <Alert variant={couleur}>
        <i className={'fa ' + iconeCadenas}/>
        <span>
          <Trans>grosFichiers.niveauSecurite</Trans>
        </span>
        <span>
          <Trans>{transLabel}</Trans>
        </span>
      </Alert>
    );
  }

}
