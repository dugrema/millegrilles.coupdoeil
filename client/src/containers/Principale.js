import React from 'react';
import QRCode from 'qrcode.react';
import { Alert, Form, Container, Row, Col,
         Button, ButtonGroup, InputGroup} from 'react-bootstrap';
// import manifest from '../manifest.build.js';  // App version, build date
import { solveRegistrationChallenge } from '@webauthn/client';
import webSocketManager from '../WebSocketManager';
import { Trans, Translation } from 'react-i18next';
import { Feuille } from '../mgcomponents/Feuilles';
import { InputTextMultilingue } from '../mgcomponents/InputMultilingue';

import './Principale.css';

export class InterfacePrincipale extends React.Component {

  state = {
    ecranCourant: null,
    milleGrille: {},
  }

  componentDidMount() {
    chargerProfils()
    .then(donnees=>{
      if(donnees && donnees.milleGrille) {
        this.setState({milleGrille: donnees.milleGrille});
      }
    })
    .catch(err=> {
      console.error("Erreur chargement profil");
      console.error(err);
    });
  }

  fonctionsNavigation = {
    retourPrincipale: () => {
      this.setState({
        ecranCourant: null,
      });
    },
    afficherEcran: (event) => {
      this.setState({ecranCourant: event.currentTarget.value});
    },
  }

  version() {

    var qrCode = null;
    if(this.state.milleGrille.idmg) {
      qrCode = <QRCode value={'idmg:' + this.state.milleGrille.idmg} size={75} />;
    }
    const manifest = {
      date: "DUMMY",
      version: "DUMMY",
    }

    return (
      <Feuille>
        <Row>
          <Col lg={10}>
            <h2 className="w3-opacity"><Trans>principale.accueil.generalTitre</Trans></h2>

            <ul>
              <li>
                <Trans>principale.accueil.version</Trans> <span title={manifest.date}>{manifest.version}</span>
              </li>
              <li>
                <Trans>principale.accueil.idmg</Trans> {this.state.milleGrille.idmg}
              </li>
            </ul>
          </Col>
          <Col lg={2} className="code-qr">{qrCode}</Col>
        </Row>
      </Feuille>
    );
  }

  fonctionsGestion() {
    return (
      <Feuille>
        <h2 className="w3-opacity"><Trans>principale.accueil.gestionTitre</Trans></h2>

        <ul>
          <li>
            <Button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="information">
              <Trans>principale.accueil.lienUsager</Trans>
            </Button>
          </li>
          <li>
            <Button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="gestionTokens">
              <Trans>principale.accueil.lienTokens</Trans>
            </Button>
          </li>
        </ul>
      </Feuille>
    );
  }

  render() {

    let contenu;
    if(this.state.ecranCourant === 'information') {
      contenu = (
        <InformationMilleGrille
          {...this.fonctionsNavigation} />
      );
    } else if(this.state.ecranCourant === 'gestionTokens') {
      contenu = (
        <GestionTokens
          {...this.fonctionsNavigation} />
      );
    } else {
      contenu = (
        <div className="w3-col m12">
          {this.version()}
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

class InformationMilleGrille extends React.Component {

  state = {
    usager: {
      nom: '',
      prenom: '',
      courriel: '',
      twitter: '',
      facebook: '',
    },
    milleGrille: {
      nomMilleGrille: '',
      langue: '',
      languesAdditionnelles: [],
    },
  }

  componentDidMount() {
    chargerProfils()
    .then(donnees=>{this.setState(donnees);})
    .catch(err=> {
      console.error("Erreur chargement profil");
      console.error(err);
    });
  }

  render() {
    return (
      <div>
        <Container className='w3-card w3-round w3-white w3-card_BR'>
          <div className='w3-container w3-padding'>
            <Row><Col><h2><Trans>principale.information.titre</Trans></h2></Col></Row>
            <Row><Col><p><Trans>principale.information.description_1</Trans></p></Col></Row>
          </div>
        </Container>

        {this._renderFormMilleGrille()}
        {this._renderFormUsager()}

      </div>
    );
  }

  _renderFormUsager() {

    return (
      <Feuille>
        <Row><Col><h2><Trans>principale.information.usagerTitre</Trans></h2></Col></Row>
        <Row>
          <Col>
            <p><Trans>principale.information.descriptionUsager</Trans></p>
          </Col>
        </Row>

        <Form>
          <Form.Group controlId="formGroupPrenom">
            <Form.Label><Trans>formulaire.prenom</Trans></Form.Label>
            <Form.Control type="plaintext" placeholder="Julie"
                          value={this.state.usager.prenom}
                          onChange={this.changerPrenom} />
          </Form.Group>
          <Form.Group controlId="formGroupNomFamille">
            <Form.Label><Trans>formulaire.nomFamille</Trans></Form.Label>
            <Form.Control type="plaintext" placeholder="Tremblay"
                          value={this.state.usager.nom}
                          onChange={this.changerNomFamille} />
          </Form.Group>
          <Form.Group controlId="formGroupEmail">
            <Form.Label><Trans>formulaire.courriel</Trans></Form.Label>
            <Form.Control type="email" placeholder="julie.tremblay@notgmail.org"
                          value={this.state.usager.courriel}
                          onChange={this.changerAdresseCourriel} />
          </Form.Group>
          <Form.Group controlId="formGroupTwitter">
            <Form.Label><Trans>formulaire.twitter</Trans></Form.Label>
            <Form.Control type="plaintext" placeholder="@twitter"
                          value={this.state.usager.twitter}
                          onChange={this.changerCompteTwitter} />
          </Form.Group>
          <Form.Group controlId="formGroupFacebook">
            <Form.Label><Trans>formulaire.facebook</Trans></Form.Label>
            <Form.Control type="facebook" placeholder="facebook"
                          value={this.state.usager.facebook}
                          onChange={this.changerCompteFacebook} />
          </Form.Group>

          <Form.Group controlId="formGroupFacebook">
            <Button onClick={this.soumettreProfilUsager}>
              <Trans>global.appliquer</Trans>
            </Button>
          </Form.Group>
        </Form>

      </Feuille>
    );

  }

  _renderFormMilleGrille() {

    const languePrincipale = this.state.milleGrille?this.state.milleGrille.langue:'';
    const languesSupportees = ['fr', 'en'];
    const optionsLangues = [];
    const optionsLanguesAdditionnelles = [];

    var dictLangueAdditionnelles = {};
    if(this.state.milleGrille.languesAdditionnelles) {
      this.state.milleGrille.languesAdditionnelles.forEach(l=>{
        dictLangueAdditionnelles[l] = true;
      })
    }

    languesSupportees.forEach(lang=>{
      optionsLangues.push(
        <Translation key={lang}>{t=>(<option value={lang}>{t('langues.' + lang)}</option>)}</Translation>
      );
      if(this.state.milleGrille) {
        if(this.state.milleGrille.langue !== lang) {
          optionsLanguesAdditionnelles.push(
            <Translation key={lang}>{
              t=>(
                <Form.Check key={lang} id={lang} defaultChecked={dictLangueAdditionnelles[lang]} type="checkbox"
                            value={lang} label={t('langues.' + lang)}
                            onChange={this.changerLangueAdditionnelle} />
              )}
            </Translation>
          );
        }
      }
    })

    const nomMilleGrilleLangues = [
      <Form.Group key={languePrincipale} controlId="formGroupNomMilleGrille">
        <Form.Label><Trans>principale.information.nomMilleGrille</Trans></Form.Label>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text id="basic-addon3">
              <Trans>{'langues.' + languePrincipale}</Trans>
            </InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control type="plaintext" placeholder="Sans Nom"
                        name="nomMilleGrille"
                        value={this.state.milleGrille.nomMilleGrille}
                        onChange={this.changerNomMilleGrille} />
        </InputGroup>
      </Form.Group>
    ]
    if(this.state.milleGrille.languesAdditionnelles) {
      this.state.milleGrille.languesAdditionnelles.forEach(l=>{
        nomMilleGrilleLangues.push(
          <Form.Group key={l} controlId={"formGroupNomMilleGrille_" + l}>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="basic-addon3">
                  <Trans>{'langues.' + l}</Trans>
                </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control type="plaintext" placeholder={l}
                            name={"nomMilleGrille_" + l}
                            value={this.state.milleGrille['nomMilleGrille_' + l]}
                            onChange={this.changerNomMilleGrille} />
            </InputGroup>
          </Form.Group>
        )
      });
    }

    return (
      <Feuille>

        <Row><Col><h2><Trans>principale.information.milleGrilleTitre</Trans></h2></Col></Row>

        <Form>
          <p><Trans>principale.information.descriptionMilleGrille_2</Trans></p>
          <Form.Group controlId="formGroupLanguagePrincipal">
            <Form.Label><Trans>principale.information.languagePrincipal</Trans></Form.Label>
            <Form.Control as="select" value={languePrincipale} onChange={this.changerLanguePrincipale}>
              {optionsLangues}
            </Form.Control>
          </Form.Group>

          <Form.Group>
            <Form.Label><Trans>principale.information.languesAdditionnelles</Trans></Form.Label>
            {optionsLanguesAdditionnelles}
          </Form.Group>

          <p><Trans>principale.information.descriptionMilleGrille_1</Trans></p>
          <InputTextMultilingue
            controlId="nomMilleGrille" valuePrefix='nomMilleGrille'
            onChange={this.changerNomMilleGrille}
            languePrincipale={languePrincipale}
            languesAdditionnelles={this.state.milleGrille.languesAdditionnelles}
            placeholder='Nom millegrille'
            contenu={this.state.milleGrille}
            />

          <Form.Group>
            <ButtonGroup>
              <Button variant="primary" onClick={this.soumettreProfilMilleGrille}>
                <Trans>global.appliquer</Trans>
              </Button>
            </ButtonGroup>
          </Form.Group>
        </Form>

      </Feuille>
    );

  }

  changerNomMilleGrille = event => {
    const name = event.currentTarget.name;
    const valeur = event.currentTarget.value;

    const milleGrille = {...this.state.milleGrille};
    milleGrille[name] = valeur;
    this.setState({milleGrille})
  }

  changerLanguePrincipale = event => {
    const valeur = event.currentTarget.value;
    const milleGrille = {...this.state.milleGrille, langue: valeur, languesAdditionnelles: []};
    this.setState({milleGrille})
  }

  changerLangueAdditionnelle = event => {
    const valeur = event.currentTarget.value;
    const checked = event.currentTarget.checked;

    // Mettre a jour les langue additionnelles
    var dictLanguesAdditionnelles = {};
    if(checked) {
      // Ajouter la nouvelle langue secondaire
      dictLanguesAdditionnelles[valeur] = true;
    }
    var listeLanguesAdditionnelles = this.state.milleGrille.languesAdditionnelles;
    if(listeLanguesAdditionnelles) {
      listeLanguesAdditionnelles.forEach(l=>{
        if(checked) {
          dictLanguesAdditionnelles[l] = true;
        } else if(l !== valeur) {
          // Retirer la langue secondaire
          dictLanguesAdditionnelles[l] = true;
        }
      })
    }

    // Mettre a jour l'etat
    const milleGrille = {
      ...this.state.milleGrille,
      languesAdditionnelles: Object.keys(dictLanguesAdditionnelles)
    };
    this.setState({milleGrille})
  }

  changerPrenom = event => {
    const valeur = event.currentTarget.value;
    const usager = {...this.state.usager, prenom: valeur};
    this.setState({usager})
  }

  changerNomFamille = event => {
    const valeur = event.currentTarget.value;
    const usager = {...this.state.usager, nom: valeur};
    this.setState({usager})
  }

  changerAdresseCourriel = event => {
    const valeur = event.currentTarget.value;
    const usager = {...this.state.usager, courriel: valeur};
    this.setState({usager})
  }

  changerCompteTwitter = event => {
    const valeur = event.currentTarget.value;
    const usager = {...this.state.usager, twitter: valeur};
    this.setState({usager})
  }

  changerCompteFacebook = event => {
    const valeur = event.currentTarget.value;
    const usager = {...this.state.usager, facebook: valeur};
    this.setState({usager})
  }

  soumettreProfilMilleGrille = event => {
    let transaction = this.state.milleGrille;

    let domaine = 'Principale.majProfilMilleGrille';
    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });
  }

  soumettreProfilUsager = event => {
    let transaction = this.state.usager;

    let domaine = 'Principale.majProfilUsager';
    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });
  }

}

class GestionTokens extends React.Component {

  state = {
    pin: null,
  }

  ajouterToken = () => {

    // Le processus comporte plusieurs etapes. On commence par ajouter
    // un handler pour repondre au challenge du serveur.
    var callbackChallenge = null;
    webSocketManager.emitWEventCallback(
      'enregistrerDevice', {}, 'challengeEnregistrerDevice')
    .then(event=>{
      let challenge = event[0];
      let cb = event[1];
      console.log("Challenge recu");
      console.log(challenge);
      console.log(cb);
      callbackChallenge = cb;

      return solveRegistrationChallenge(challenge);
    }).then(credentials=>{
      console.log("Transmission de la reponse au challenge");
      console.log(credentials);

      // Transmettre reponse
      callbackChallenge(credentials);
    }).catch(err=>{
      console.error("Erreur traitement ajouter token");
      console.error(err);
    });

  }

  genererPinTemporaireAjoutDevice = () => {
    let self = this;
    webSocketManager.emit('creerPINTemporaireDevice', {})
    .then(reponse => {
      let pin = reponse.pin;
      self.setState({pin: pin});
    })
  }

  render() {

    var pinSection = null;
    if(this.state.pin) {
      pinSection = (
        <Alert variant="success">
          PIN genere : {this.state.pin}
        </Alert>
      )
    }

    return(
      <div className="w3-col m9">
        <div className="w3-row-padding">
          <Feuille>
            <h1>Gestion tokens</h1>

            {pinSection}

            <Row>
              <Col>
                <Button className="aslink" onClick={this.ajouterToken}>
                  Ajouter token
                </Button>
              </Col>
            </Row>
            <Row>
              <Col>
                <Button className="aslink" onClick={this.genererPinTemporaireAjoutDevice}>
                  Generer un PIN
                </Button> temporaire pour connecter un nouveau token.
              </Col>
            </Row>
          </Feuille>
        </div>
      </div>
    );
  }

}

function chargerProfils() {
  let routingKey = 'Principale.getProfilUsager';
  return webSocketManager.transmettreRequete(routingKey, {})
  .then(documents => {
    return{
      usager: documents['profil.usager'],
      milleGrille: documents['profil.millegrille'],
    };
  })
  .catch(err=>{
    console.error("Erreur requete documents profils");
    console.error(err);
  });
  }
