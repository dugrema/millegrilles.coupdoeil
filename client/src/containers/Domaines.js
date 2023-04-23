import React, {useState, useEffect, useCallback, useTransition} from 'react'
import {proxy as comlinkProxy} from 'comlink'
import { useTranslation } from "react-i18next"

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'

import { ModalAttente, FormatterDate } from '@dugrema/millegrilles.reactjs'

import Catalogues from './DomaineCatalogueApplications'
import Maitredescles from './DomaineMaitredescles'
import Usagers from './GestionUsagers'
import DomaineConsignation from './DomaineConsignation'
import Notifications from './Notifications'

import useWorkers, { useEtatPret, useCleMillegrilleChargee } from '../WorkerContext'

function Domaines(props) {
    // console.debug("Domaines proppys : %O", props)
    const { 
        certificatMaitreDesCles, confirmationCb, 
        setCleMillegrille, 
        erreurCb 
    } = props

    const { t } = useTranslation()
    const workers = useWorkers(),
          etatPret = useEtatPret(),
          cleMillegrilleChargee = useCleMillegrilleChargee()

    const [attente, setAttente] = useState('')
    const [domaines, setDomaines] = useState('')
    const [evenementDomaine, setEvenementDomaine] = useState('')
    const [domaineSelectionne, setDomaineSelectionne] = useState('')

    const erreurCbLocal = useCallback(
        (err, message) => { 
            erreurCb(err, message)
            setAttente('')  // Reset attente
        },
        [erreurCb, setAttente]
    )

    useEffect(()=>{
        if(etatPret) {
            const cb = comlinkProxy(setEvenementDomaine)
            subscribe(workers, cb, erreurCb)
            chargerListeDomaines(workers, setDomaines, erreurCb).catch(err=>erreurCb(err, "Erreur chargement liste domaines."))
            return () => unsubscribe(workers, cb)
        }
    }, [workers, etatPret, erreurCb, setEvenementDomaine])

    useEffect(()=>{
        if(evenementDomaine && domaines) {
            traiterEvenement(domaines, setDomaines, evenementDomaine.message, erreurCb).catch(err=>erreurCb(err))
            setEvenementDomaine('')
        }
    }, [evenementDomaine, setEvenementDomaine, domaines, setDomaines, erreurCb])

    let Page
    switch(domaineSelectionne) {
        case 'MaitreDesCles': Page = Maitredescles; break
        case 'Catalogues': Page = Catalogues; break
        case 'Usagers': Page = Usagers; break
        case 'Consignation': Page = DomaineConsignation; break
        case 'Notifications': Page = Notifications; break
        default:
            Page = null
    }

    if(Page) {
        return (
            <Page 
                workers={workers} 
                etatAuthentifie={etatPret}
                certificatMaitreDesCles={certificatMaitreDesCles}
                cleMillegrilleChargee={cleMillegrilleChargee}
                confirmationCb={confirmationCb}
                erreurCb={erreurCbLocal}
                fermer={()=>setDomaineSelectionne('')} />
        )
    }

    return (
        <>
            <ModalAttente show={attente} setAttente={setAttente} />

            <h1>{t('Domaines.titre')}</h1>

            <h2>Actions</h2>
            <Row>
                <Row>
                    <Col>
                        Recuperer des cles non dechiffrables.
                    </Col>
                    <Col>
                        <Button variant="secondary" onClick={()=>setDomaineSelectionne('MaitreDesCles')}>Dechiffrer</Button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        Gerer les catalogues d'application.
                    </Col>
                    <Col>
                        <Button variant="secondary" onClick={()=>setDomaineSelectionne('Catalogues')}>Catalogues</Button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        Gerer les usagers.
                    </Col>
                    <Col>
                        <Button variant="secondary" onClick={()=>setDomaineSelectionne('Usagers')}>Usagers</Button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        Consignation des fichiers
                    </Col>
                    <Col>
                        <Button variant="secondary" onClick={()=>setDomaineSelectionne('Consignation')}>Fichiers</Button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        Notifications des usagers
                    </Col>
                    <Col>
                        <Button variant="secondary" onClick={()=>setDomaineSelectionne('Notifications')}>Notifications</Button>
                    </Col>
                </Row>
            </Row>

            <h2>Domaines configures</h2>
            <ListeDomaines domaines={domaines} />
        </>
    )
}

export default Domaines

function ListeDomaines(props) {

    const domaines = props.domaines
    if(!domaines) return <p>Aucuns domaines disponibles.</p>

    return (
        <>
            {domaines.map(domaine=>(
                <Row key={domaine.nom}>
                    <Col>{domaine.nom}</Col>
                    <Col><FormatterDate value={domaine.date_presence}/></Col>
                    <Col>{domaine.actif?'Actif':'Inactif'}</Col>
                </Row>
            ))}
        </>
    )
}

function subscribe(workers, cb, erreurCb) {
    const connexion = workers.connexion
    console.debug("Subscribe cb : %O", cb)
    connexion.enregistrerCallbackEvenementsPresenceDomaine(cb)
        .catch(err=>erreurCb(err, "enregistrerCallbackEvenementsPresenceDomaine"))
}

function unsubscribe(workers, cb) {
    const connexion = workers.connexion
    console.debug("Unsubscribe cb : %O", cb)
    connexion.retirerCallbackEvenementsPresenceDomaine(cb)
        .catch(err=>console.error("retirerCallbackEvenementsPresenceDomaine : %O", err))
}

async function traiterEvenement(domaines, setDomaines, evenementDomaine, erreurCb) {
    console.debug("traiterEvenement Recu evenement domaine : %O", evenementDomaine)
    const evenementMappe = mapperDomaine(evenementDomaine)
    let traite = false
    const domainesMaj = domaines.map(item=>{
        if(item.nom === evenementMappe.nom) {
            traite = true
            return evenementMappe
        } else {
            return item
        }
    })
    if(!traite) domainesMaj.push(evenementMappe)
    trierDomaines(domainesMaj)
    setDomaines(domainesMaj)
}


// Charge la liste courante des noeuds
async function chargerListeDomaines(workers, setDomaines, erreurCb) {
    try {
        const connexion = workers.connexion
        const reponseDomaines = await connexion.requeteListeDomaines()
        const liste = reponseDomaines.resultats

        // console.debug("Liste domaines\n%O", reponseDomaines)

        var domaines = liste.map(domaine=>{
            const derniereModification = domaine['_mg-derniere-modification']
            const infoDomaine = mapperDomaine(domaine, derniereModification)
            return infoDomaine
        })

        // Trier la liste par descriptif, avec Principal en premier
        domaines = trierDomaines(domaines)

        //console.debug("Liste domaines preparee : %O", domaines)

        setDomaines(domaines)
    } catch(err) {
        erreurCb(err, "Erreur chargement domaines.")
    }
}

function trierDomaines(domaines) {
    return domaines.sort((a,b)=>{
        if(a === b) return 0
        if(!a || !a.nom) return -1
        if(!b || !b.nom) return 1
        return a.nom.localeCompare(b.nom)
    })
}

function mapperDomaine(domaineInfo) {
    var actif = false
    let date_presence = domaineInfo.date_presence
    if(!date_presence && domaineInfo['en-tete']) {
        // Message confirmation domaine
        date_presence = domaineInfo['en-tete'].estampille
    }
    try {
        const epochCourant = new Date().getTime() / 1000
        if(Number(date_presence) > epochCourant - 120) {
            actif = true
        }
    } catch(err) {
        console.warn("Date presence domaine (%O) invalide : %O", domaineInfo, err)
    }

    var nom = domaineInfo.domaine
    var instance_id = domaineInfo.instance_id

    const mappingDomaine = {
        nom,
        actif,
        instance_id,
        date_presence,
    }

    return mappingDomaine
}
