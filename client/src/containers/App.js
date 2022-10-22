import React, { Suspense, useState, useCallback } from 'react'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { Trans } from 'react-i18next'

import { LayoutMillegrilles, ModalErreur, Menu as MenuMillegrilles, DropDownLanguage, ModalInfo } from '@dugrema/millegrilles.reactjs'

import { useTranslation } from 'react-i18next'
import '../i18n'


// import { VerificationInfoServeur } from './Authentification'
// import { SectionContenu } from './SectionContenu'
// import MenuItems from './Menu'

// import _stylesCommuns from '@dugrema/millegrilles.reactjs/dist/index.css'
// import './App.css'

import manifest from '../manifest.build'

const SectionContenu = React.lazy(()=>import('./SectionContenu'))

function ApplicationCoupdoeil(props) {

  const { workers, usager, etatAuthentifie, certificatMaitreDesCles, cleMillegrilleChargee } = props
  const idmg = usager?usager.idmg:''

  const { t, i18n } = useTranslation()

  const [sectionAfficher, setSectionAfficher] = useState('')

  // Params de pages
  // const [paramsPage, setParamsPage] = useState('')

  // Alert messages
  // const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  // const confirmationCb = useCallback(confirmation=>setConfirmation(confirmation), [setConfirmation])
  const erreurCb = useCallback((err, message)=>{
    console.error("Erreur ", err)
    setErreur({err, message})
  }, [setErreur])
  
  const handlerCloseErreur = () => setErreur(false)

  // const changerPage = eventPage => {
  //   // Verifier si event ou page
  //   let pageResultat
  //   // var paramsPage = null
  //   if(eventPage.currentTarget) {
  //     var target = eventPage.currentTarget
  //     pageResultat = target.value
  //     var dataset = target.dataset

  //     let pNoeudid = ''
  //     if(dataset) {
  //       // paramsPage = {...dataset}
  //       setParamsPage({...dataset})
  //     } else {
  //       setParamsPage('')
  //     }

  //   } else {
  //     pageResultat = eventPage
  //   }

  //   if(pageResultat === page) {
  //     // Reset de la page
  //     setPage(pageResultat)
  //   } else {
  //     setPage(pageResultat)
  //   }
  // }

  // const appProps = {
  //   ...props,
  //   page,
  //   paramsPage,
  //   changerPage,
  //   confirmationCb,
  //   erreurCb,
  // }

  // return <LayoutCoudpoeil 
  //           {...appProps} 
  //           confirmation={confirmation} 
  //           erreur={erreur}
  //           setConfirmation={setConfirmation}
  //           setErreur={setErreur}>
  //         <Container>
  //           <SectionContenu {...appProps} />
  //         </Container>
  //       </LayoutCoudpoeil>

  const menu = (
    <MenuApp 
        i18n={i18n} 
        etatConnexion={etatAuthentifie} 
        idmg={idmg}
        workers={workers} 
        setSectionAfficher={setSectionAfficher} />
  ) 

  return (
      <LayoutMillegrilles menu={menu}>

          <Container className="contenu">

              <Suspense fallback={<Attente workers={workers} idmg={idmg} etatConnexion={etatAuthentifie} />}>
                <SectionContenu 
                    workers={workers}
                    usager={usager}
                    etatAuthentifie={etatAuthentifie}
                    sectionAfficher={sectionAfficher}
                    setSectionAfficher={setSectionAfficher}
                    certificatMaitreDesCles={certificatMaitreDesCles}
                    cleMillegrilleChargee={cleMillegrilleChargee}
                    erreurCb={erreurCb}
                  />
              </Suspense>

          </Container>

          <ModalErreur show={!!erreur} err={erreur.err} message={erreur.message} titre={t('Erreur.titre')} fermer={handlerCloseErreur} />

      </LayoutMillegrilles>
  )  

}

export default ApplicationCoupdoeil

// function Entete(props) {
//   return (
//     <Container>
//       <Menu {...props} />
//       <br />
//       <br />
//     </Container>
//   )
// }

// function LayoutCoudpoeil(props) {

//   const { erreur, confirmation, setErreur, setConfirmation } = props

//   return (
//     <div className="flex-wrapper">
//       <div>
//         <Entete {...props} />
        
//         <Container>
//           <AlertTimeout variant="danger" titre="Erreur" delay={false} value={erreur} setValue={setErreur}/>
//           <AlertTimeout value={confirmation} setValue={setConfirmation} />
//         </Container>

//         {props.children}

//       </div>
//       <Footer {...props} />
//     </div>
//   )

// }

// function Footer(props) {
//   const idmg = props.usager?props.usager.idmg:''

//   return (
//     <Container fluid className="footer bg-info">
//       <Row>
//         <Col sm={2} className="footer-left"></Col>
//         <Col sm={8} className="footer-center">
//           <div className="millegrille-footer">
//             <div>{idmg}</div>
//             <div>MilleGrilles</div>
//           </div>
//         </Col>
//         <Col sm={2} className="footer-right"></Col>
//       </Row>
//     </Container>
//   )
// }

// function Menu(props) {

//   const workers = props.workers

//   // let boutonProtege
//   // if(props.rootProps.modeProtege) {
//   //   boutonProtege = <i className="fa fa-lg fa-lock protege"/>
//   // } else {
//   //   boutonProtege = <i className="fa fa-lg fa-unlock"/>
//   // }

//   var renderCleMillegrille = ''

//   const clearCleMillegrille = _=>{workers.chiffrage.clearCleMillegrille()}
//   if(props.cleMillegrilleChargee) {
//     renderCleMillegrille = (
//       <Nav className="justify-content-end">
//         <Nav.Link onClick={clearCleMillegrille}><i className="fa fa-key"/></Nav.Link>
//       </Nav>
//     )
//   }

//   return (
//     <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top" className="header-menu">
//       {/* <Navbar.Brand onClick={_=>{props.changerPage('Instances')}}><i className="fa fa-home"/></Navbar.Brand> */}
//       <Navbar.Toggle aria-controls="responsive-navbar-menu" />
//       <Navbar.Collapse id="responsive-navbar-menu">

//         <MenuItems {...props} />

//         {renderCleMillegrille}

//       </Navbar.Collapse>
//     </Navbar>
//   )
// }

// function ChargementEnCours(props) {
//   return <p>Chargement en cours</p>
// }

function MenuApp(props) {

  const { i18n, etatConnexion, idmg, setSectionAfficher} = props

  const { t } = useTranslation()
  const [showModalInfo, setShowModalInfo] = useState(false)
  const handlerCloseModalInfo = useCallback(()=>setShowModalInfo(false), [setShowModalInfo])

  const handlerSelect = eventKey => {
      switch(eventKey) {
          case 'instances': setSectionAfficher('instances'); break
          case 'domaines': setSectionAfficher('domaines'); break
          case 'information': setShowModalInfo(true); break
          case 'portail': window.location = '/millegrilles'; break
          case 'deconnecter': window.location = '/millegrilles/authentification/fermer'; break
          default:
      }
  }

  const handlerChangerLangue = eventKey => {i18n.changeLanguage(eventKey)}
  const brand = (
      <Navbar.Brand>
          <Nav.Link title={t('titre')}>
              <Trans>titre</Trans>
          </Nav.Link>
      </Navbar.Brand>
  )

  return (
      <>
          <MenuMillegrilles brand={brand} labelMenu="Menu" etatConnexion={etatConnexion} onSelect={handlerSelect}>
              <Nav.Link eventKey="instances" title="Instances associees a la MilleGrille">
                  <Trans>menu.instances</Trans>
              </Nav.Link>
              <Nav.Link eventKey="domaines" title="Gestion des domaines">
                  <Trans>menu.domaines</Trans>
              </Nav.Link>
              <Nav.Link eventKey="information" title="Afficher l'information systeme">
                  <Trans>menu.information</Trans>
              </Nav.Link>
              <DropDownLanguage title={t('menu.language')} onSelect={handlerChangerLangue}>
                  <NavDropdown.Item eventKey="en-US">English</NavDropdown.Item>
                  <NavDropdown.Item eventKey="fr-CA">Francais</NavDropdown.Item>
              </DropDownLanguage>
              <Nav.Link eventKey="portail" title={t('menu.portail')}>
                  <Trans>menu.portail</Trans>
              </Nav.Link>
              <Nav.Link eventKey="deconnecter" title={t('menu.deconnecter')}>
                  <Trans>menu.deconnecter</Trans>
              </Nav.Link>
          </MenuMillegrilles>
          <ModalInfo 
              show={showModalInfo} 
              fermer={handlerCloseModalInfo} 
              manifest={manifest} 
              idmg={idmg} />
      </>
  )
}

function Attente(_props) {
  return (
      <div>
          <p className="titleinit">Preparation de Coup D'Oeil</p>
          <p>Veuillez patienter durant le chargement de la page.</p>
          <ol>
              <li>Initialisation</li>
              <li>Chargement des composants dynamiques</li>
              <li>Connexion a la page</li>
          </ol>
      </div>
  )
}
