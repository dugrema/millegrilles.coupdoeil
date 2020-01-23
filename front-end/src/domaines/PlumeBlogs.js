import React from 'react';
import { Feuille } from '../mgcomponents/Feuilles'
import { Form, Button, ButtonGroup, ListGroup, InputGroup,
         Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';
import { DateTimeFormatter } from '../mgcomponents/ReactFormatters';
import { InputTextMultilingue } from '../mgcomponents/InputMultilingue';

const PREFIX_DATA_URL = 'data:image/jpeg;base64,';

export class PlumeBlogs extends React.Component {

  state = {
    uuidBlogpost: null,
  }

  render() {
    if(this.state.uuidBlogpost) {
      return (
        <BlogPost uuidBlogpost={this.state.uuidBlogpost}
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
    this.setState({uuidBlogpost: 'PLACEHOLDER'});
  }

  _chargerBlogpost = event => {
    const uuidBlogpost = event.currentTarget.value;
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
          chargerBlogpost={this.props.chargerBlogpost} />

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
          "uuid": 1, "_mg-derniere-modification": 1,
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
}

function ListeBlogpostsDetail(props) {

  var liste = null;
  if(props.blogposts) {
    liste = props.blogposts.map(bp=>{
      return (
        <ListGroup.Item key={bp.uuid}>
          <Row>
            <Col sm={3}>
              <DateTimeFormatter date={bp['_mg-derniere-modification']}/>
            </Col>
            <Col sm={9}>
              <Button variant="link" onClick={props.chargerBlogpost} value={bp.uuid}>
                {bp.titre}
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
    blogpost: null,
  }

  componentDidMount() {
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
      console.debug("Resultats requete");
      console.debug(docsRecu);
      const blogpost = docsRecu[0][0];
      this.setState({...blogpost});
    });
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

        </Feuille>

        <EntreeBlog blogpost={this.state}
          documentIdMillegrille={this.props.documentIdMillegrille}
          onTextChange={this._changerTexte} />

      </div>
    )
  }

  _changerTexte = event => {
    const {name, value} = event.currentTarget;
    const maj = {};
    maj[name] = value;
    this.setState(maj);
  }

}

class EntreeBlog extends React.Component {

  render() {
    const blogpost = this.props.blogpost;
    const languePrincipale = this.props.documentIdMillegrille.langue;
    const languesAdditionnelles = this.props.documentIdMillegrille.languesAdditionnelles;

    console.debug("Blogpost")
    console.debug(blogpost);

    return (
      <Feuille>
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
              />

        </Form>
      </Feuille>
    )
  }

}
