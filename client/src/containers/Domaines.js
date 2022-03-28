import React, {useState, useEffect, useCallback} from 'react'
import {proxy as comlinkProxy} from 'comlink'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { AlertTimeout, ModalAttente } from './Util'
import { FormatterDate } from '@dugrema/millegrilles.reactjs'

function Domaines(props) {
    console.debug("Domaines proppys : %O", props)
    const { workers, etatConnexion } = props

    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [attente, setAttente] = useState('')
    const [domaines, setDomaines] = useState('')
    const [evenementDomaine, setEvenementDomaine] = useState('')

    const confirmationCb = useCallback( 
        confirmation => { setConfirmation(confirmation); setAttente('') },
        [setConfirmation, setAttente] 
    )

    const erreurCb = useCallback(
        (err, message) => { 
            setError(err)
            if(message) setErrorMessage(message)
            else setErrorMessage(''+err)
            setAttente('')  // Reset attente
        },
        [setError, setErrorMessage, setAttente]
    )

    useEffect(()=>{
        const cb = comlinkProxy(setEvenementDomaine)
        subscribe(workers, cb, erreurCb)
        chargerListeDomaines(workers, setDomaines, erreurCb).catch(err=>erreurCb(err, "Erreur chargement liste domaines."))
        return () => unsubscribe(workers, cb)
    }, [workers, erreurCb, setEvenementDomaine])

    useEffect(()=>{
        if(evenementDomaine && domaines) {
            traiterEvenement(domaines, setDomaines, evenementDomaine.message, erreurCb).catch(err=>erreurCb(err))
            setEvenementDomaine('')
        }
    }, [evenementDomaine, setEvenementDomaine, domaines, setDomaines, erreurCb])

    return (
        <>
            <AlertTimeout 
                variant="danger" delay={false} 
                message={errorMessage} setMessage={setErrorMessage} err={error} setError={setError} />
            <AlertTimeout message={confirmation} setMessage={setConfirmation} />
            <ModalAttente show={attente} setAttente={setAttente} />

            <h1>Domaines</h1>
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


// export function ListeDomaines(props) {

//     const connexion = props.workers.connexion,
//           modeProtege = props.rootProps.modeProtege
  
//     const [domaines, setDomaines] = useState([])
  
//     useEffect(()=>{domainesContexte.domaines = domaines}, [domaines])
  
//     useEffect(()=>{
//       if(modeProtege) {
//         connexion.enregistrerCallbackEvenementsPresenceDomaine(processMessageDomaine)
//         chargerListeDomaines(connexion)
//           .then(domaines=>{
//             // console.debug("Domaines charges : %O", domaines)
//             setDomaines(domaines)
//           })
  
//         // Cleanup
//         return ()=>{
//           connexion.retirerCallbackEvenementsPresenceDomaine()
//         }
//       }
//     }, [modeProtege, setDomaines])
  
//     const processMessageDomaine = useCallback(comlinkProxy(message => {
//       // console.debug("Message recu : %O", message)
//       const domaines = domainesContexte.domaines
  
//       const domainesMaj = majDomaines(domaines, message.exchange, message.message)
//       setDomaines(domainesMaj)
//     }), [setDomaines])
  
//     const children = props.children
//     return React.Children.map(children, (child, i) => {
//       const clone = React.cloneElement(child, {domaines})
//       return clone
//     })
  
// }

// Charge la liste courante des noeuds
async function chargerListeDomaines(workers, setDomaines, erreurCb) {
    try {
        const connexion = workers.connexion
        const reponseDomaines = await connexion.requeteListeDomaines()

        console.debug("Liste domaines\n%O", reponseDomaines)

        var domaines = reponseDomaines.map(domaine=>{
            const derniereModification = domaine['_mg-derniere-modification']
            const infoDomaine = mapperDomaine(domaine, derniereModification)
            return infoDomaine
        })

        // Trier la liste par descriptif, avec Principal en premier
        domaines = trierDomaines(domaines)

        console.debug("Liste domaines preparee : %O", domaines)

        setDomaines(domaines)
    } catch(err) {
        erreurCb(err, "Erreur chargement domaines.")
    }
}

// // Detecter nouveau noeud, ajoute a la liste
// function majDomaines(domaines, niveauSecurite, message) {
// // console.debug("Message update domaines recu :\n%O", message)
// const noeud_id = message.noeud_id
// const estampille = message['en-tete'].estampille

// const valeursMaj = mapperDomaine(message, estampille)

// var domainesCourants = [...domaines]
// var trouve = false
// for(let idx in domainesCourants) {
//     var domaineCourant = domainesCourants[idx]
//     if(domaineCourant.descriptif === valeursMaj.descriptif) {
//     // Copier le noeud et remplacer l'instance dans l'array
//     domaineCourant = Object.assign({}, domaineCourant)
//     domainesCourants[idx] = domaineCourant

//     domaineCourant = Object.assign(domaineCourant, valeursMaj)

//     trouve = true
//     break  // Noeud id trouve, plus rien a faire
//     }
// }

// if(!trouve) {
//     // Nouveau noeud, on l'ajoute a la liste
//     domainesCourants.push(valeursMaj)
//     domainesCourants = trierNoeuds(domainesCourants)
// }

// // console.debug("Liste noeuds maj:\n%O", noeudsCourants)

// return domainesCourants
// }

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
    var noeud_id = domaineInfo.noeud_id

    const mappingDomaine = {
        nom,
        actif,
        noeud_id,
        date_presence,
    }

    return mappingDomaine
}
