import React from 'react'
import { Nav, Navbar, NavDropdown, Container, Row, Col} from 'react-bootstrap';
import { Trans, Translation, withTranslation } from 'react-i18next';

import { Menu } from './Menu'

import './Layout.css'

export function LayoutCoudpoeil(props) {

  return (
    <div>
      <Entete changerPage={props.changerPage}/>
      <Contenu page={props.page}/>
      <Footer/>
    </div>
  )

}

function Entete(props) {
  return (
    <Container>
      <Menu changerPage={props.changerPage}/>
      <h1>Coup D'Oeil</h1>
    </Container>
  )
}

function Contenu(props) {
  return (
    <Container>
      {props.page}
    </Container>
  )
}

function Footer(props) {
  return (
    <Container fluid className="footer bg-info">
      <Row>
        <Col>
          <Row><h2>Information</h2></Row>
        </Col>
      </Row>
      <Row className="millegrille-footer">
        <Col>
          <Trans>application.coupdoeilAdvert</Trans>
        </Col>
      </Row>
    </Container>
  )
}
