import React, { Suspense, useState, useCallback } from 'react'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { Trans } from 'react-i18next'

import { LayoutMillegrilles, ModalErreur, Menu as MenuMillegrilles, DropDownLanguage, ModalInfo } from '@dugrema/millegrilles.reactjs'

import { useTranslation } from 'react-i18next'
import '../i18n'

import manifest from '../manifest.build'
import useWorkers, { useUsager, useEtatPret, useCleMillegrilleChargee, useEtatConnexion } from '../WorkerContext'

const SectionContenu = React.lazy(()=>import('./SectionContenu'))

function ApplicationCoupdoeil(props) {

    const { /* workers, usager, etatAuthentifie, certificatMaitreDesCles, cleMillegrilleChargee */ } = props

    const { t, i18n } = useTranslation()
    const workers = useWorkers(),
          usager = useUsager(),
          etatPret = useEtatPret(),
          cleMillegrilleChargee = useCleMillegrilleChargee()

    const idmg = usager?usager.idmg:''

    const [sectionAfficher, setSectionAfficher] = useState('')
    const [certificatMaitreDesCles, setCertificatMaitreDesCles] = useState('')

    // Alert messages
    const [erreur, setErreur] = useState('')
    const erreurCb = useCallback((err, message)=>{
        console.error("Erreur ", err)
        setErreur({err, message})
    }, [setErreur])
  
    const handlerCloseErreur = () => setErreur(false)

    const menu = (
    <MenuApp 
        i18n={i18n} 
        etatConnexion={etatPret} 
        idmg={idmg}
        workers={workers} 
        setSectionAfficher={setSectionAfficher} />
    ) 

    return (
        <LayoutMillegrilles menu={menu}>
            <Container className="contenu">
                <Suspense fallback={<Attente workers={workers} idmg={idmg} etatConnexion={etatPret} />}>
                    <SectionContenu 
                        workers={workers}
                        usager={usager}
                        etatAuthentifie={etatPret}
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

function MenuApp(props) {

  const { i18n, setSectionAfficher} = props

  const usager = useUsager(),
        etatConnexion = useEtatConnexion()

  const idmg = usager.idmg?usager.idmg:''

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
              idmg={idmg} 
              usager={usager} />
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
