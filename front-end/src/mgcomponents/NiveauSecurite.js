import React from 'react';
import { Container, Row, Alert } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import './NiveauSecurite.css';

export class IconeSecurite extends React.Component {

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
