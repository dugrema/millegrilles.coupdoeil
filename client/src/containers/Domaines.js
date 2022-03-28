import React, {useState, useEffect, useCallback} from 'react'
import {proxy as comlinkProxy} from 'comlink'

import { AlertTimeout, ModalAttente } from './Util'

function Domaines(props) {
    console.debug("Domaines proppys : %O", props)
    const { workers, etatConnexion } = props

    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [attente, setAttente] = useState('')
    const [domaines, setDomaines] = useState('')

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
        const cb = comlinkProxy(traiterEvenement)
        subscribe(workers, cb, erreurCb)
        chargerListeDomaines(workers, setDomaines, erreurCb).catch(err=>erreurCb(err, "Erreur chargement liste domaines."))
        return () => unsubscribe(workers, cb)
    }, [workers, erreurCb])

    return (
        <>
            <AlertTimeout 
                variant="danger" delay={false} 
                message={errorMessage} setMessage={setErrorMessage} err={error} setError={setError} />
            <AlertTimeout message={confirmation} setMessage={setConfirmation} />
            <ModalAttente show={attente} setAttente={setAttente} />

            <h1>Domaines</h1>

        </>
    )
}

export default Domaines

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

function traiterEvenement(evenement) {
    console.debug("traiterEvenement Recu evenement domaine : %O", evenement)
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

        return domaines
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
        if(!a || !a.descriptif) return -1
        if(!b || !b.descriptif) return 1
        return a.descriptif.localeCompare(b.descriptif)
    })
}

function mapperDomaine(domaineInfo, derniereModification) {
    var actif = true
    const epochCourant = new Date().getTime() / 1000
    if(epochCourant > derniereModification + 60) {
        actif = false
    }

    var descriptif = domaineInfo.domaine
    var noeud_id = domaineInfo.noeud_id

    const mappingDomaine = {
        descriptif,
        actif,
        noeud_id,
    }

    return mappingDomaine
}
