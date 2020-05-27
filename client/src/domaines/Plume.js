import React from 'react';
import { Button, ListGroup,
         Container, Row, Col } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import { PlumeAnnonces } from './PlumeAnnonces'
import { PlumeVitrine } from './PlumeVitrine'
import { PlumeBlogs } from './PlumeBlogs'

import 'react-quill/dist/quill.snow.css';
import './Plume.css';

const SECTIONS = {
  PlumeAnnonces, PlumeVitrine, PlumeBlogs,
}

export class Plume extends React.Component {

  state = {
    sectionCourante: '',
  }

  render() {

    var page;
    if(this.state.sectionCourante && this.state.sectionCourante !== '') {
      let SectionCourante = SECTIONS[this.state.sectionCourante];
      page = (<SectionCourante {...this.props} />)
    } else {
      page = (
        <Row className="w3-row-padding">
          <Container className="w3-card w3-round w3-white w3-card_BR">
            <Row>
              <Col>
                <h2 className="w3-opacity"><Trans>plume.pageTitre.titre</Trans></h2>
                <p><Trans>plume.pageTitre.description</Trans></p>
              </Col>
            </Row>
          </Container>
          <Container className="w3-card w3-round w3-white w3-card_BR">
            <Row>
              <Col>
                <ListGroup>
                  <ListGroup.Item>
                    <Button className="aslink" onClick={this._versSectionAnnonces}>
                      <Trans>plume.pageTitre.liensAnnonces</Trans>
                    </Button>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Button className="aslink" onClick={this._versSectionVitrine}>
                      <Trans>plume.pageTitre.liensVitrine</Trans>
                    </Button>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Button className="aslink" onClick={this._versSectionBlogs}>
                      <Trans>plume.pageTitre.liensBlogs</Trans>
                    </Button>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Button className="aslink" onClick={this._versSectionDocuments}>
                      <Trans>plume.pageTitre.liensDocuments</Trans>
                    </Button>
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          </Container>
        </Row>
      )
    }

    return (
      <div>
        {page}
      </div>
    )
  }

  _versSectionAnnonces = () => {
    this.setState({sectionCourante: 'PlumeAnnonces'});
  }

  _versSectionDocuments = () => {
    this.setState({sectionCourante: 'PlumeDocuments'});
  }

  _versSectionVitrine = () => {
    this.setState({sectionCourante: 'PlumeVitrine'});
  }

  _versSectionBlogs = () => {
    this.setState({sectionCourante: 'PlumeBlogs'});
  }

}
