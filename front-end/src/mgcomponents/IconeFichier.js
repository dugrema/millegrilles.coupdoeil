import React from 'react';
import { Row, Col, Alert } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import './IconeFichier.css';

export class IconeFichier extends React.Component {

  render() {

    // Tenter de trouver le niveau de securite pour colorer l'icone.
    let securitecss = 'prive';
    if(this.props.securite) {
      securitecss = this.props.securite.split('.')[1];
    }

    let icone;
    if(this.props.mimetype && this.props.mimetype.includes('image')) {
      icone = (
        <span className={"fa-stack fa-1g " + this.props.className}>
          <i className={"fa fa-file fa-stack-1x " + securitecss}/>
          <i className={"fa fa-file-image-o fa-stack-1x"}/>
        </span>
      );
    } else if(this.props.mimetype && this.props.mimetype.includes('video')) {
      icone = (
        <span className={"fa-stack fa-1g " + this.props.className}>
          <i className={"fa fa-file fa-stack-1x " + securitecss}/>
          <i className={"fa fa-file-video-o fa-stack-1x"}/>
        </span>
      );
    } else if(this.props.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      icone = (
        <span className={"fa-stack fa-1g " + this.props.className}>
          <i className={"fa fa-file fa-stack-1x " + securitecss}/>
          <i className={"fa fa-file-excel-o fa-stack-1x"}/>
        </span>
      );
    } else if(this.props.mimetype === "application/pdf") {
      icone = (
        <span className={"fa-stack fa-1g " + this.props.className}>
          <i className={"fa fa-file fa-stack-1x " + securitecss}/>
          <i className={"fa fa-file-pdf-o fa-stack-1x"}/>
        </span>
      );
    } else if(this.props.type === 'collection') {
      icone = (
        <span className={"fa-stack fa-1g " + this.props.className}>
          <i className={"fa fa-folder fa-stack-1x " + securitecss}/>
          <i className={"fa fa-folder-o fa-stack-1x"}/>
        </span>
      );
    } else {
      // Defaut
      icone = (
        <span className={"fa-stack fa-1g " + this.props.className}>
          <i className={"fa fa-file fa-stack-1x " + securitecss}/>
          <i className={"fa fa-file-o fa-stack-1x"}/>
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

    let tailleMilieu = 11;
    if(this.props.colfin) {
      tailleMilieu -= this.props.colfin;
    }

    return (
      <Alert variant={couleur} className="alert">
        <Row>
          <Col sm={1}>
            <i className={'fa ' + iconeCadenas}/>
          </Col>
          <Col sm={tailleMilieu}>
            <span className="padright">
              <Trans>grosFichiers.niveauSecurite</Trans>
            </span>
            <span>
              <Trans>{transLabel}</Trans>
            </span>
          </Col>
          {this.props.children}
        </Row>
      </Alert>
    );
  }

}
