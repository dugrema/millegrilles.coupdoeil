import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { proxy } from 'comlink'

import useWorkers, { useEtatPret } from '../WorkerContext'
import { clear, mergeClient, setIdmgClient } from '../redux/hebergementSlice'

import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Container from 'react-bootstrap/Container'

function Hebergement(props) {

    const workers = useWorkers(),
          etatPret = useEtatPret(),
          dispatch = useDispatch(),
          idmgClient = useSelector(item=>item.hebergement.idmgClientSelectionne)

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

            <BoutonsActionTop show={!idmgClient} />
            <DetailClientHebergement show={idmgClient} />
            <ListeClients show={!idmgClient && !err} />
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

function BoutonsActionTop(props) {
    const {show} = props

    const dispatch = useDispatch()

    const ajouterClient = useCallback(()=>{
        dispatch(setIdmgClient(true))
    }, [dispatch])

    if(!show) return ''

    return (
        <div className="buttonBar">
            <Button onClick={ajouterClient}>Ajouter</Button>
        </div>
    )
}

function ListeClients(props) {

    const {show} = props
    
    const clients = useSelector(item=>item.hebergement.listeClients)

    if(!show) return ''

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

function DetailClientHebergement(props) {

    const {show} = props

    const idmgClient = useSelector(item=>item.hebergement.idmgClientSelectionne)

    if(!show) return ''

    if(idmgClient === true) {
        return <EditerClientHebergement />
    }

    return 'Client'
}

function EditerClientHebergement(props) {
    
    const workers = useWorkers(),
          dispatch = useDispatch()

    const idmgClient = useSelector(item=>item.hebergement.idmgClientSelectionne),
          listeClients = useSelector(item=>item.hebergement.listeClients)

    const [err, setErr] = useState('')
    const [attente, setAttente] = useState(false)

    const [refresh, setRefresh] = useState(false)
    const [idmgClientValue, setIdmgClientValue] = useState('')
    const idmgClientValueHandler = useCallback(e=>setIdmgClientValue(e.currentTarget.value), [setIdmgClient])
    const [contact, setContact] = useState('')
    const contactHandler = useCallback(e=>setContact(e.currentTarget.value), [setContact])
    const [information, setInformation] = useState('')
    const informationHandler = useCallback(e=>setInformation(e.currentTarget.value), [setInformation])
    const [roles, setRoles] = useState('')

    const submitHandler = useCallback(e=>{
        e.preventDefault()
        e.stopPropagation()
        console.debug("Submit ", e)

        setErr('')
        setAttente(true)

        const client = {idmg: idmgClientValue, contact, information, roles}
        workers.connexion.sauvegarderClientHebergement(client)
            .then(()=>{
                dispatch(setIdmgClient(''))
            })
            .catch(err=>{
                console.error("Erreur sauvegarde")
                setErr(err)
            })
            .finally(()=>setAttente(false))
    },[workers, dispatch, setAttente, setErr, idmgClientValue, contact, information, roles])

    const annulerHandler = useCallback(()=>dispatch(setIdmgClient('')), [dispatch])

    // Reload idmg
    useEffect(()=>{
        if(!idmgClient) return
        if(idmgClient !== true) {
            setIdmgClientValue(idmgClient)
        } else {
            setIdmgClientValue('')
        }
        setRefresh(true)
    }, [idmgClient, setIdmgClientValue, setRefresh])

    // Reload/reset valeurs
    useEffect(()=>{
        if(!refresh) return
        if(idmgClient) {
            const client = listeClients.filter(item=>item.idmg === idmgClient).pop()
            console.debug("Selection client ", client)

            // Set valeurs form
            //contact
            //information

        }
    }, [listeClients, idmgClient, refresh])

    return (
        <>
            <h2>Editer client</h2>

            <Form onSubmit={submitHandler}>
                <Form.Group controlId="form.idmg">
                    <Form.Label>IDMG</Form.Label>
                    <Form.Control type="text" placeholder="E.g. zeYncRqEqZ6eTEmUZ8whJFuHG796eSvCTWE4M432izXrp22bAtwGm7Jf" 
                        value={idmgClientValue} onChange={idmgClientValueHandler} 
                        disabled={idmgClient!==true} />
                </Form.Group>
                <Form.Group controlId="form.contact">
                    <Form.Label>Contact</Form.Label>
                    <Form.Control type="text" placeholder="E.g. bob@hotmail.com" 
                        value={contact} onChange={contactHandler} />
                </Form.Group>
                <Form.Group controlId="form.information">
                    <Form.Label>Information</Form.Label>
                    <Form.Control type="test" as="textarea" placeholder="Information sur le client." 
                        value={information} onChange={informationHandler} 
                        rows={6} />
                </Form.Group>
                <br/>
                <p>Roles</p>
                <EditerRoles value={roles} set={setRoles} />
                <br/>
                <p>Quotas</p>
                <EditerQuotas />
                <br/>
                <Alert variant="danger" show={!!err}>
                    <Alert.Heading>Erreur</Alert.Heading>
                    <p>{''+err}</p>
                </Alert>
                <div>
                    <Button type="submit" disabled={!!attente}>Sauvegarder</Button>
                    <Button variant="secondary" onClick={annulerHandler}>Annuler</Button>
                </div>
                <br/>
                <Button variant="danger" disabled={idmgClient===true}>Supprimer</Button>
            </Form>

            <Modal show={!!attente}>
                <Modal.Header>Traitement en cours</Modal.Header>
                <Container>
                    <p>Sauvegarde en cours ...</p>
                </Container>
            </Modal>
        </>
    )
}

const ROLES = ['fichiers']

function EditerRoles(props) {
    const {value, set} = props
    
    const toggleRole = useCallback(e=>{
        const role = e.currentTarget.value
        if(!value) set([role])  // Liste vide, on ajoute
        else {
            if(value.includes(role)) {
                // Retirer
                set(value.filter(item=>item !== role))
            } else {
                // Ajouter
                set([...value, role])
            }
        }
    }, [value, set])

    return ROLES.map(item=>{
        const idKey = 'role-' + item
        const checked = value.includes(item)
        return <Form.Check key={idKey} id={idKey} type='checkbox' label={item} checked={checked} onChange={toggleRole} value={item} />
    })
}

function EditerQuotas(props) {
    return (
        'quotas'
    )
}