import React, {useState} from 'react'
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap'
import { Trans } from 'react-i18next'

import { VerificationInfoServeur } from './Authentification'
import { SectionContenu } from './SectionContenu'
import { MenuItems } from './Menu'

import './App.css'

export function ApplicationCoupdoeil(props) {

  const [serveurInfo, setServeurInfo] = useState('')
  const [idmg, setIdmg] = useState('')
  const [page, setPage] = useState('Accueil')

  // Params de pages
  const [paramsPage, setParamsPage] = useState('')

  const changerPage = eventPage => {
    // Verifier si event ou page
    let pageResultat
    // var paramsPage = null
    if(eventPage.currentTarget) {
      var target = eventPage.currentTarget
      pageResultat = target.value
      var dataset = target.dataset

      let pNoeudid = ''
      if(dataset) {
        // paramsPage = {...dataset}
        setParamsPage({...dataset})
      } else {
        setParamsPage('')
      }

    } else {
      pageResultat = eventPage
    }

    if(pageResultat === page) {
      // Reset de la page
      setPage(pageResultat)
    } else {
      setPage(pageResultat)
    }
  }

  const rootProps = {
    ...props, ...props.rootProps,
    serveurInfo, idmg, page,
    paramsPage,
    changerPage,
  }

  let pageRendered
  if(!serveurInfo) {
    // 1. Recuperer information du serveur
    pageRendered = <VerificationInfoServeur setInfoServeur={setServeurInfo} />
  } else if(!props.workers) {
    // 2. Connecter avec Socket.IO
    pageRendered = <p>Attente de connexion</p>
  } else {
    // 3. Afficher application
    pageRendered = <SectionContenu workers={props.workers} rootProps={rootProps} />
  }

  return <LayoutCoudpoeil changerPage={changerPage}
                          page={page}
                          rootProps={rootProps}
                          workers={props.workers}>
          <Container>
            {pageRendered}
          </Container>
        </LayoutCoudpoeil>

}

function Entete(props) {
  return (
    <Container>
      <Menu changerPage={props.changerPage}
            rootProps={props.rootProps}
            workers={props.workers}/>
      <h1>Coup D'Oeil</h1>
    </Container>
  )
}

function LayoutCoudpoeil(props) {

  return (
    <div className="flex-wrapper">
      <div>
        <Entete {...props} />
        {props.children}
      </div>
      <Footer rootProps={props.rootProps}/>
    </div>
  )

}

function Footer(props) {

  const idmg = props.rootProps.rootProps.idmg

  return (
    <Container fluid className="footer bg-info">
      <Row>
        <Col sm={2} className="footer-left"></Col>
        <Col sm={8} className="footer-center">
          <div className="millegrille-footer">
            <div>{idmg}</div>
            <div>MilleGrilles</div>
          </div>
        </Col>
        <Col sm={2} className="footer-right"></Col>
      </Row>
    </Container>
  )
}

function Menu(props) {

  let boutonProtege
  if(props.rootProps.modeProtege) {
    boutonProtege = <i className="fa fa-lg fa-lock protege"/>
  } else {
    boutonProtege = <i className="fa fa-lg fa-unlock"/>
  }

  var renderCleMillegrille = ''

  const clearCleMillegrille = _=>{props.workers.chiffrage.clearCleMillegrilleSubtle()}
  if(props.rootProps.cleMillegrilleChargee) {
    renderCleMillegrille = (
      <Nav className="justify-content-end">
        <Nav.Link onClick={clearCleMillegrille}><i className="fa fa-key"/></Nav.Link>
      </Nav>
    )
  }

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top" className="header-menu">
      <Navbar.Brand onClick={_=>{props.changerPage('Accueil')}}><i className="fa fa-home"/></Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">

        <MenuItems
          changerPage={props.changerPage}
          rootProps={props.rootProps}
          websocketApp={props.workers.connexion}
          />

        {renderCleMillegrille}

        <Nav>
          <Nav.Link onClick={props.rootProps.toggleProtege}>{boutonProtege}</Nav.Link>
        </Nav>
        <Nav>
          <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>

      </Navbar.Collapse>
    </Navbar>
  )
}
