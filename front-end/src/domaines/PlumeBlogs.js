import React from 'react';
import { Feuille } from '../mgcomponents/Feuilles'
import { Form, Button, ListGroup, Row, Col } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';
import { DateTimeFormatter } from '../mgcomponents/ReactFormatters';
import { InputTextMultilingue } from '../mgcomponents/InputMultilingue';

const PREFIX_DATA_URL = 'data:image/jpeg;base64,';
const UUID_PLACEHOLDER = 'PLACEHOLDER';

export class PlumeBlogs extends React.Component {

  state = {
    uuidBlogpost: null,
  }

  render() {
    if(this.state.uuidBlogpost) {
      return (
        <BlogPost
          uuidBlogpost={this.state.uuidBlogpost}
          setUuidBlogpost={this._setUuidBlogpost}
          retour={this._retour}
          {...this.props} />
      )
    } else {
      return (
        <ListeBlogposts
          nouveau={this._nouveauBlogpost}
          chargerBlogpost={this._chargerBlogpost}
          {...this.props} />
      );
    }
  }

  _nouveauBlogpost = event => {
    this.setState({uuidBlogpost: UUID_PLACEHOLDER});
  }

  _chargerBlogpost = event => {
    const uuidBlogpost = event.currentTarget.value;
    this.setState({uuidBlogpost});
  }

  _setUuidBlogpost = uuidBlogpost => {
    this.setState({uuidBlogpost});
  }

  _retour = event => {
    this.setState({uuidBlogpost: null});
  }

}

class ListeBlogposts extends React.Component {

  state = {
    startingIndex: 0,
    blogposts: [],
  }

  componentDidMount() {
    this.chargerListeBlogposts();
  }

  render() {
    return (
      <div>
        <Feuille>
          <Row>
            <Col>
              <h2 className="w3-opacity"><Trans>plume.blogs.titre</Trans></h2>
            </Col>
          </Row>
          <Row>
            <Col>
              <Button onClick={this.props.nouveau}>
                <Trans>plume.blogs.nouveauBlogpost</Trans>
              </Button>
            </Col>
          </Row>
        </Feuille>

        <ListeBlogpostsDetail
          chargerListeBlogposts={this.chargerListeBlogposts}
          blogposts={this.state.blogposts}
          chargerBlogpost={this.props.chargerBlogpost}
          retirerBlogpost={this.retirerBlogpost}
          supprimerBlogpost={this.supprimerBlogpost}
          publierBlogpost={this.publierBlogpost} />

      </div>
    )
  }

  chargerListeBlogposts = event => {

    let limit = 5;

    const currentIndex = this.state.startingIndex;
    const domaine = 'requete.millegrilles.domaines.Plume';
    const requete = {'requetes': [
      {
        'filtre': {
          '_mg-libelle': 'blogpost',
        },
        'projection': {
          "uuid": 1, "_mg-derniere-modification": 1, "datePublication": 1,
          "titre": 1, "titre_fr": 1, "titre_en": 1
        },
        'hint': [
          {'_mg-libelle': 1},
          {'_mg-derniere-modification': -1}
        ],
        'limit': limit,
        'skip': currentIndex,
      }
    ]};

    return webSocketManager.transmettreRequete(domaine, requete)
    .then( docsRecu => {
      // console.debug("Resultats requete");
      // console.debug(docsRecu);
      let resultBlogposts = docsRecu[0];
      let startingIndex = resultBlogposts.length + currentIndex;

      const blogposts = [...this.state.blogposts, ...resultBlogposts];
      this.setState({startingIndex, blogposts});
    });
  }

  publierBlogpost = event => {
    let uuidBlogpost = event.currentTarget.value;
    // console.debug("Publier blogpost " + uuidBlogpost);
    const transaction = {
      uuid: uuidBlogpost
    }
    const domaine = 'millegrilles.domaines.Plume.publierBlogpostVitrine';
    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      } else {
        const blogposts = this.state.blogposts.map(bp=>{
          // Enlever la date de publication du blogpost
          if(bp.uuid === uuidBlogpost) {
            let bpUpdated = Object.assign({}, bp);
            bpUpdated.datePublication = new Date().getTime();
            return bpUpdated;
          }
          return bp;
        })

        // Reset formulaire
        this.setState({blogposts});
      }
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });
  }

  retirerBlogpost = event => {
    let uuidBlogpost = event.currentTarget.value;
    // console.debug("Retirer blogpost " + uuidBlogpost);
    const transaction = {
      uuid: uuidBlogpost
    }
    const domaine = 'millegrilles.domaines.Plume.retirerBlogpostVitrine';
    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      } else {
        const blogposts = this.state.blogposts.map(bp=>{
          // Enlever la date de publication du blogpost
          if(bp.uuid === uuidBlogpost) {
            let bpUpdated = Object.assign({}, bp);
            bpUpdated.datePublication = null;
            return bpUpdated;
          }
          return bp;
        })

        // Reset formulaire
        this.setState({blogposts});
      }
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });
  }

  supprimerBlogpost = event => {
    let uuidBlogpost = event.currentTarget.value;
    console.debug("Supprimer blogpost " + uuidBlogpost);

    const transaction = {
      uuid: uuidBlogpost
    }
    const domaine = 'millegrilles.domaines.Plume.supprimerBlogpostVitrine';
    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      } else {
        const blogposts = this.state.blogposts.filter(bp=>{
          return bp.uuid !== uuidBlogpost
        })

        // Reset formulaire
        this.setState({blogposts});
      }
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });

  }

}

function ListeBlogpostsDetail(props) {

  var liste = null;
  if(props.blogposts) {
    liste = props.blogposts.map(bp=>{

      let boutonPublierRetirer;
      if(bp.datePublication) {
        // Deja publie, on affiche le bouton retirer
        boutonPublierRetirer = (
          <Button onClick={props.retirerBlogpost} value={bp.uuid}>
            <i className="fa fa-remove"/>
          </Button>
        );
      } else {
        // Pas publie, on affiche le bouton publier
        boutonPublierRetirer = (
          <Button onClick={props.publierBlogpost} value={bp.uuid}>
            <i className="fa fa-cloud-upload"/>
          </Button>
        );
      }

      return (
        <ListGroup.Item key={bp.uuid}>
          <Row>
            <Col sm={3} md={2}>
              <DateTimeFormatter date={bp['_mg-derniere-modification']}/>
            </Col>
            <Col sm={7} md={9}>
              <Button variant="link" onClick={props.chargerBlogpost} value={bp.uuid}>
                {bp.titre}
              </Button>
            </Col>
            <Col sm={2} md={1}>
              {boutonPublierRetirer}
              <Button variant="danger" onClick={props.supprimerBlogpost} value={bp.uuid}>
                <i className="fa fa-trash"/>
              </Button>
            </Col>
          </Row>
        </ListGroup.Item>
      )
    })
  }

  // console.debug('Liste');
  // console.debug(liste);

  return (
    <Feuille>
      <Row>
        <Col><h3>Liste blogposts</h3></Col>
      </Row>

      <ListGroup>
        {liste}
      </ListGroup>

      <Button onClick={props.chargerListeBlogposts}>
        <Trans>plume.blogs.chargerBlogposts</Trans>
      </Button>

    </Feuille>
  );
}

class BlogPost extends React.Component {

  state = {
  }

  componentDidMount() {
    this.chargerBlogpost();
  }

  chargerBlogpost() {
    if(this.props.uuidBlogpost !== UUID_PLACEHOLDER) {
      const domaine = 'requete.millegrilles.domaines.Plume';
      const requete = {'requetes': [{
        'filtre': {
          '_mg-libelle': 'blogpost',
          'uuid': this.props.uuidBlogpost,
        },
        'hint': [{'uuid': 1}]
      }]};

      return webSocketManager.transmettreRequete(domaine, requete)
      .then( docsRecu => {
        // console.debug("Resultats requete");
        // console.debug(docsRecu);
        var blogpostIn = docsRecu[0][0];
        const blogpost = {};

        // console.debug("Blogpost filtrer")
        if(blogpostIn) {
          var champs = [
            'uuid', 'texte', 'titre', 'image', 'datePublication'
          ];
          for(let champ in blogpostIn) {
            var champsInclus = champs.filter(c=>{
              return champ.startsWith(c);
            })
            if(champsInclus.length > 0) {
              blogpost[champ] = blogpostIn[champ];
            }
          }
        }

        this.setState({...blogpost});
      });
    }
  }

  render() {

    return (
      <div>
        <Feuille>

          <Row>
            <Col><h2>Blogpost</h2></Col>
          </Row>

          <Row>
            <Col>
              <Button onClick={this.props.retour}>
                <Trans>global.retour</Trans>
              </Button>
            </Col>
          </Row>

          <Row>
            Publication:
            <DateTimeFormatter date={this.state.datePublication}/>
            <Button onClick={this.sauvegarder} variant='danger' value='publier'>
              <Trans>global.publier</Trans>
            </Button>
          </Row>

        </Feuille>

        <EntreeBlog blogpost={this.state}
          documentIdMillegrille={this.props.documentIdMillegrille}
          image={this.state.image}
          onTextChange={this._changerTexte}
          sauvegarder={this.sauvegarder}
          changerImage={this._changerImage} retirerImage={this._retirerImage}/>

      </div>
    )
  }

  _changerTexte = event => {
    const {name, value} = event.currentTarget;
    const maj = {};
    maj[name] = value;
    this.setState(maj);
  }

  _retirerImage = event => {
    this.setState({image: null});
  }

  sauvegarder = event => {
    // console.debug("Sauvegarder")
    // console.debug(this.state);

    let operation = event.currentTarget.value;
    let domaine = 'millegrilles.domaines.Plume.majBlogpostVitrine';
    let transaction = {...this.state, operation}; // Cloner l'etat

    // console.debug(transaction);

    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction majBlogpostVitrine");
      } else {
        if(!this.state.uuid) {
          // console.debug("Sauvegarder nouveau uuid");
          // console.debug(reponse);
          this.setUuidBlogpost(reponse['uuid-transaction']);
        }

        if(operation === 'publier') {
          // console.debug("Reponse publication")
          // console.debug(reponse);
          this.setState({datePublication: reponse.datePublication})
        }
      }
    })
    .catch(err=>{
      console.error("Erreur transaction majBlogpostVitrine");
      console.error(err);
    });
  }

  setUuidBlogpost = uuid => {
    this.setState({uuid})
  }

  _changerImage = event => {
    const form = event.currentTarget.form;
    const fuuidImage = form['image'].value;

    if(!fuuidImage || fuuidImage === '') {
      return;  // Rien a faire, aucun fuuid
    }
    // console.debug("fuuid image ");
    // console.debug(fuuidImage);

    const domaine = 'requete.millegrilles.domaines.GrosFichiers';
    const requete = {'requetes': [{
      'filtre': {
        '_mg-libelle': 'fichier',
        ['versions.' + fuuidImage]: {'$exists': true},
        'securite': '1.public',
      }
    }]};

    // console.debug("Requete");
    // console.debug(requete);

    return webSocketManager.transmettreRequete(domaine, requete)
    .then( docsRecu => {
      // console.debug("Resultats requete");
      let documentImage = docsRecu[0][0];
      const versionImage = documentImage.versions[fuuidImage];
      // console.debug(versionImage);
      const {fuuid_preview, mimetype_preview, thumbnail} = versionImage;

      const image = {fuuid_preview, mimetype_preview, thumbnail};

      this.setState({image});
    });

  }

}

class EntreeBlog extends React.Component {

  render() {
    const blogpost = this.props.blogpost;
    const languePrincipale = this.props.documentIdMillegrille.langue;
    const languesAdditionnelles = this.props.documentIdMillegrille.languesAdditionnelles;

    return (
      <Feuille>
        <Row>
          <Col>
            <Form>

              <InputTextMultilingue
                controlId="titre" valuePrefix='titre'
                onChange={this.props.onTextChange}
                languePrincipale={languePrincipale}
                languesAdditionnelles={languesAdditionnelles}
                placeholder='Sans titre'
                contenu={blogpost}
                />

              <InputTextMultilingue
                controlId="texte" valuePrefix='texte'
                languePrincipale={languePrincipale}
                languesAdditionnelles={languesAdditionnelles}
                onChange={this.props.onTextChange}
                placeholder='Texte'
                contenu={blogpost}
                rows={15}
                />

              <AfficherImage controlId="image"
                image={this.props.image}
                changerImage={this.props.changerImage}
                retirerImage={this.props.retirerImage} />

              <Form.Row>
                <Col>
                  <Button onClick={this.props.sauvegarder}>
                    <Trans>global.sauvegarder</Trans>
                  </Button>
                </Col>
              </Form.Row>

            </Form>
          </Col>
        </Row>
      </Feuille>
    )
  }

}

// props :
//  - image
//  - controlId
//  - changerImage
//  - retirerImage
function AfficherImage(props) {

  var image;
  if(props.image) {
    image = (<img src={PREFIX_DATA_URL + props.image.thumbnail} alt="Thumbnail" />);
  }

  return (
    <div>
      <Form.Row>
        <Col sm={8}>
          <Form.Group controlId={props.controlId}>
          <Form.Label><Trans>plume.vitrine.selectionnerImage</Trans></Form.Label>
            <Form.Control name="fuuid_image"
              placeholder="e.g. 90d22a60-3bea-11ea-a889-e7d8115f598f" />
          </Form.Group>
          <Form.Text>
            <Button onClick={props.changerImage}>
              <Trans>plume.vitrine.changerImage</Trans>
            </Button>
            <Button onClick={props.retirerImage} variant="secondary">
              <Trans>plume.vitrine.retirerImage</Trans>
            </Button>
          </Form.Text>
        </Col>
        <Col sm={4}>
          {image}
        </Col>
      </Form.Row>
    </div>
  );
}
