import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'

import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

import { AlertTimeout, ModalAttente } from '@dugrema/millegrilles.reactjs'

import useWorkers, { useUsager, useEtatPret } from '../WorkerContext'

function InstanceConfigurationConsignation(props) {

    const { instance } = props

    const workers = useWorkers()

    const instances = useSelector(state=>state.instances.listeInstances)

    const [listeConsignations, setListeConsignations] = useState('')
    const [attente, setAttente] = useState(false)
    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const succesCb = useCallback(confirmation=>{
        setConfirmation(confirmation)
    }, [setConfirmation])

    const erreurCb = useCallback((error, errorMessage)=>{
        setError(error)
        setErrorMessage(errorMessage)
    }, [setError, setErrorMessage])

    const consignationsMapped = useMemo(()=>{
        if(!instances || !listeConsignations) return
        console.debug("Mapper instances %O \navec consignations %O", instances, listeConsignations)

        const instancesDict = instances.reduce((acc, item)=>{
            acc[item.instance_id] = item
            return acc
        }, {})

        const consignations = listeConsignations.reduce((acc, item)=>{
            const consignation = {...item}
            const instance = instancesDict[item.instance_id]
            if(instance) consignation.instance = instance
            acc[item.instance_id] = consignation
            return acc
        }, {})

        console.debug("Mapping consignations : ", consignations)
        return consignations

    }, [instances, listeConsignations])

    const [consignationCourante, parDefaut] = useMemo(()=>{
        if(!instance || !consignationsMapped) return [null, null]
        const instanceId = instance.instance_id,
              consignationId = instance.consignation_id
        let consignation = consignationsMapped[consignationId]
        if(!consignation) {
            consignation = consignationsMapped[instanceId]
            if(consignation) {
                return [consignation, true]
            } else {
                // Retourner la consignation primaire
                return [Object.values(consignationsMapped).filter(item=>item.primaire).pop(), true]
            }
        } else {
            return [consignation, false]
        }
    }, [instance, consignationsMapped])

    const nomConsignationCourante = useMemo(()=>{
        if(!consignationCourante) return 'N/D'
        if(consignationCourante.instance) return consignationCourante.instance.domaine
        return consignationCourante.instance_id
    }, [consignationCourante])

    useEffect(()=>{
        workers.connexion.getConfigurationFichiers()
            .then(reponse=>{
                console.debug("Liste consignations recue ", reponse)
                if(reponse.ok === true) {
                    setListeConsignations(reponse.liste)
                }
            })
            .catch(err=>setError(''+err))

    }, [workers, props, setListeConsignations])

    return (
        <div>
            <h2>Configuration consignation de l'instance</h2>

            <AlertTimeout 
                variant="danger" delay={false} 
                message={errorMessage} setMessage={setErrorMessage} err={error} setError={setError} />
            <AlertTimeout message={confirmation} setMessage={setConfirmation} />
            <ModalAttente show={attente} setAttente={setAttente} />

            <Row>
               <Col xs={5} md={3}>Consignation courante</Col> 
               <Col xs={6} md={4}>{nomConsignationCourante}</Col>
               <Col>{parDefaut?'Par defaut':''}</Col>
            </Row>

            <ChangerConsignation 
                consignations={consignationsMapped} 
                instance={instance} 
                courante={consignationCourante} 
                succesCb={succesCb} 
                erreurCb={erreurCb} />
        </div>
    )
}

export default InstanceConfigurationConsignation

function ChangerConsignation(props) {

    const { instance, consignations, succesCb, erreurCb } = props

    const workers = useWorkers()

    const [consignationId, setConsignationId] = useState(instance.consignation_id || '')

    const listeOptions = useMemo(()=>{
        if(!consignations) return []
        return Object.values(consignations).map(item=>{
            let label = item.instance_id
            if(item.instance && item.instance.domaine) label = item.instance.domaine
            return (
                <option key={item.instance_id} value={item.instance_id}>{label}</option>
            )
        })
    }, [consignations, consignationId])

    const consignationSelectHandler = useCallback(e=>{
        const { value } = e.currentTarget
        setConsignationId(value)
    }, [setConsignationId])

    const sauvegarder = useCallback(()=>{
        const instanceId = instance.instance_id
        console.debug("Sauvegarder consignation valeur : %O pour instance %O", consignationId, instanceId)
        const consignation_id = consignationId?consignationId:null
        workers.connexion.setConsignationPourInstance(instanceId, consignation_id)
            .then(()=>{
                console.debug("Sauvegarde consignation OK")
                succesCb('Consignation changee avec succes.')
            })
            .catch(err=>{
                console.error("Erreur sauvegarde consignation : %O", err)
                erreurCb(err, 'Erreur sauvegarde consignation')
            })
    }, [workers, instance, consignationId, succesCb, erreurCb])

    return (
        <div>
            <h3>Changer la consignation</h3>
            <p>
                Note : Le comportement par defaut utilise une consignation locale (meme serveur) si 
                disponible avec un fallback vers le primaire.
            </p>

            <Form.Select
                type="text"
                onChange={consignationSelectHandler}
                value={consignationId}>
                
                <option value="">Consignation par defaut</option>
                {listeOptions}
            </Form.Select>

            <Row>
                <Col>
                    <Button onClick={sauvegarder}>Sauvegarder</Button>
                </Col>
            </Row>
        </div>
    )
}