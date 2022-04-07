import React, {Suspense, useState} from 'react'
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap'
import { Trans } from 'react-i18next'

// import { VerificationInfoServeur } from './Authentification'
// import { SectionContenu } from './SectionContenu'
import MenuItems from './Menu'

import _stylesCommuns from '@dugrema/millegrilles.reactjs/dist/index.css'
import './App.css'

const SectionContenu = React.lazy(()=>import('./SectionContenu'))

function ApplicationCoupdoeil(props) {

  const [serveurInfo, setServeurInfo] = useState('')
  const [page, setPage] = useState('Instances')

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

  const appProps = {
    ...props,
    page,
    paramsPage,
    changerPage,
  }

  return <LayoutCoudpoeil {...appProps}>
          <Container>
            <SectionContenu {...appProps} />
          </Container>
        </LayoutCoudpoeil>

}

export default ApplicationCoupdoeil

function Entete(props) {
  return (
    <Container>
      <Menu {...props} />
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
      <Footer {...props} />
    </div>
  )

}

function Footer(props) {
  console.debug("FOoter rpropsies : %O", props)
  const idmg = props.usager?props.usager.idmg:''

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

  const workers = props.workers

  // let boutonProtege
  // if(props.rootProps.modeProtege) {
  //   boutonProtege = <i className="fa fa-lg fa-lock protege"/>
  // } else {
  //   boutonProtege = <i className="fa fa-lg fa-unlock"/>
  // }

  var renderCleMillegrille = ''

  const clearCleMillegrille = _=>{workers.chiffrage.clearCleMillegrilleSubtle()}
  if(props.cleMillegrilleChargee) {
    renderCleMillegrille = (
      <Nav className="justify-content-end">
        <Nav.Link onClick={clearCleMillegrille}><i className="fa fa-key"/></Nav.Link>
      </Nav>
    )
  }

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top" className="header-menu">
      {/* <Navbar.Brand onClick={_=>{props.changerPage('Instances')}}><i className="fa fa-home"/></Navbar.Brand> */}
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">

        <MenuItems {...props} />

        {renderCleMillegrille}

      </Navbar.Collapse>
    </Navbar>
  )
}

function ChargementEnCours(props) {
  return <p>Chargement en cours</p>
}
