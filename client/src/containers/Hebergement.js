import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { proxy } from 'comlink'

import useWorkers, { useEtatPret } from '../WorkerContext'
import { clear, mergeClient, setIdmgClient } from '../redux/hebergementSlice'

import Alert from 'react-bootstrap/Alert'

function Hebergement(props) {

    const workers = useWorkers(),
          etatPret = useEtatPret(),
          dispatch = useDispatch(),
          clients = useSelector(item=>item.hebergement.listeClients)

    const [err, setErr] = useState('')
    const fermerErreur = useCallback(()=>setErr(''), [setErr])

    const evenementHandler = useCallback(e=>{
        console.debug("Hebergement message recu ", e)
        dispatch(mergeClient(e.message))
    }, [dispatch])
    const messageHandlerProxy = useMemo(()=>proxy(evenementHandler), [evenementHandler])

    // Charger liste clients et activer listeners
    useEffect(_=>{
        if(etatPret && !err) {
            chargerListeClientsHebergement(workers.connexion, dispatch)
                .catch(err=>{
                    console.error("Erreur chargement liste clients hebergement : %O", err)
                    setErr(err)
                })
        
            workers.connexion.enregistrerCallbackEvenementsHebergement(messageHandlerProxy)
                .catch(err=>console.warn('Hebergement Erreur enregistrement listener : ', err))
        
            return () => {
                dispatch(clear())
                workers.connexion.retirerCallbackEvenementsHebergement()
                    .catch(err=>console.warn('Hebergement Erreur retrait listener : ', err))
            }
        }
    }, [workers, etatPret, err, messageHandlerProxy])
    
    return (
        <div>
            <h1>Hebergement</h1>
            <Alert show={!!err} variant="danger" onClose={fermerErreur} dismissible>
                <Alert.Heading>Erreur</Alert.Heading>
                <p>{''+err}</p>
            </Alert>
            <ListeClients err={err} />
        </div>
    )
}

export default Hebergement

async function chargerListeClientsHebergement(connexion, dispatch) {
    const liste = await connexion.requeteListeClientsHebergement()
    console.debug("Liste clients hebergement : %O", liste)
    dispatch(clear())
    dispatch(mergeClient(liste.clients))
}

function ListeClients(props) {

    const {err} = props
    
    const clients = useSelector(item=>item.hebergement.listeClients)

    if(!!err) return ''

    if(!clients) return (
        <>
            <h2>Clients</h2>
            <p>Chargement en cours ...</p>
        </>
    )

    if(clients.length === 0) return (
        <>
            <h2>Clients</h2>
            <p>Aucuns clients.</p>
        </>
    )

    return (
        <div>
            <h2>Clients</h2>
        </div>
    )
}