import React, { Suspense, useState, useEffect, useCallback, useMemo } from 'react'
import { Provider as ReduxProvider, useDispatch } from 'react-redux'
import { proxy } from 'comlink'

import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { Trans } from 'react-i18next'

import { LayoutMillegrilles, ModalErreur, Menu as MenuMillegrilles, DropDownLanguage, ModalInfo } from '@dugrema/millegrilles.reactjs'

import { useTranslation } from 'react-i18next'
import '../i18n'

import manifest from '../manifest.build'

import storeSetup from '../redux/store'
import useWorkers, { useUsager, useEtatPret, useCleMillegrilleChargee, useEtatConnexion, useEtatAuthentifie } from '../WorkerContext'

import { push as pushInstances, mergeInstance } from '../redux/instancesSlice'

const SectionContenu = React.lazy(()=>import('./SectionContenu'))

function ProviderReduxLayer(props) {
    const workers = useWorkers()
    const store = useMemo(()=>{
        if(!workers) return
        return storeSetup(workers)
    }, [workers])
  
    return (
        <ReduxProvider store={store}>
            <ApplicationCoupdoeil {...props} />
        </ReduxProvider>
    )
}

export default ProviderReduxLayer

function ApplicationCoupdoeil(props) {

    const { t, i18n } = useTranslation()
    const workers = useWorkers(),
          usager = useUsager(),
          etatPret = useEtatPret()

    const idmg = usager?usager.idmg:''
    const hideMenu = false

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
            {hideMenu?'':
                <div className='top-spacer-menu'></div>
            }

            <Container className="contenu">
                <Suspense fallback={<Attente workers={workers} idmg={idmg} etatConnexion={etatPret} />}>
                    <SectionContenu 
                        usager={usager}
                        sectionAfficher={sectionAfficher}
                        setSectionAfficher={setSectionAfficher}
                        certificatMaitreDesCles={certificatMaitreDesCles}
                        erreurCb={erreurCb}
                    />
                </Suspense>
            </Container>

            <ModalErreur show={!!erreur} err={erreur.err} message={erreur.message} titre={t('Erreur.titre')} fermer={handlerCloseErreur} />

            <InitInstances />

        </LayoutMillegrilles>
    )  

}

function InitInstances(props) {
    const dispatch = useDispatch(),
          workers = useWorkers(),
          etatPret = useEtatPret(),
          etatAuthentifie = useEtatAuthentifie()

    // Messages, maj liste appareils
    const messageInstanceHandler = useCallback(evenement=>{
        const { routingKey, message } = evenement
        console.debug("messageInstanceHandler : ", message)

        // Injecter date de derniere modification (estampille)
        message.date_presence = message['__original'].estampille

        dispatch(mergeInstance(message))
        // const action = routingKey.split('.').pop()
        // if(['lectureConfirmee', 'majAppareil'].includes(action)) {
        //     dispatch(mergeInstance(message))
        // }
    }, [dispatch])

    const messageInstanceHandlerProxy = useMemo(()=>{
        return proxy(messageInstanceHandler)
    }, [messageInstanceHandler])

    useEffect(()=>{
        console.debug("InitInstances etatPret %O, etatAuthentifie %O", etatPret, etatAuthentifie)
        if(!etatPret || !etatAuthentifie) return
        const { connexion } = workers
        connexion.enregistrerCallbackEvenementsNoeuds(messageInstanceHandlerProxy)
            .catch(err=>console.error("Erreur enregistrement evenements instances : %O", err))

        // Charger (recharger) instances
        console.debug("InitInstances Requete liste noeuds")
        connexion.requeteListeNoeuds({})
            .then(reponseInstances=>{
                console.debug("Reponse instances : %O", reponseInstances)
                dispatch(pushInstances({liste: reponseInstances.resultats, clear: true}))
            })
            .catch(err=>console.error("Erreur chargement liste noeuds : %O", err))

        // Cleanup
        return () => {
            connexion.retirerCallbackEvenementsNoeuds(messageInstanceHandlerProxy)
                .catch(err=>console.warn("Erreur enregistrement evenements instances : %O", err))
            }
    }, [dispatch, workers, etatPret, etatAuthentifie, messageInstanceHandlerProxy])
}

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
          case 'deconnecter': window.location = '/auth/deconnecter_usager'; break
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
