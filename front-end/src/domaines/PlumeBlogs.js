import React from 'react';
import { Feuille } from '../mgcomponents/Feuilles'
import { Form, Button, ButtonGroup, ListGroup, InputGroup,
         Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';
import { DateTimeFormatter } from '../mgcomponents/ReactFormatters';

const PREFIX_DATA_URL = 'data:image/jpeg;base64,';

export class PlumeBlogs extends React.Component {

  render() {
    return (
      <div>
        <ListeBlogposts />
      </div>
    )
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
        </Feuille>

        <ListeBlogpostsDetail
          chargerListeBlogposts={this.chargerListeBlogposts}
          blogposts={this.state.blogposts} />

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
      console.debug("Resultats requete");
      console.debug(docsRecu);
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
              <Button variant="link">
                {bp.titre}
              </Button>
            </Col>
          </Row>
        </ListGroup.Item>
      )
    })
  }

  console.debug('Liste');
  console.debug(liste);

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

}
