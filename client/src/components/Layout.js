import React from 'react'
import { Nav, Navbar, NavDropdown, Container, Row, Col} from 'react-bootstrap';
import { Trans, Translation, withTranslation } from 'react-i18next';

import './Layout.css'

export function LayoutCoudpoeil(props) {

  return (
    <div>
      <Entete/>
      <Contenu page={props.page}/>
      <Footer/>
    </div>
  )

}

function Entete(props) {
  return (
    <Container>
      <Menu/>
      <h1>Coup D'Oeil</h1>
    </Container>
  )
}

function Menu(props) {
  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/'>Retour</Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        <Nav className="mr-auto" activeKey={props.section}>
          <p>Menu Elements</p>
        </Nav>
        <Nav className="justify-content-end">
          <Nav.Link eventKey={props.languageChangement} onSelect={props.changeLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
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
