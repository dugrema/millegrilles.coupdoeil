import { useEffect, useState, useCallback } from "react"
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import {proxy as comlinkProxy} from 'comlink'

import AfficherInstanceDetail from './Noeud'

function Instances(props) {

    const {workers, etatConnexion} = props
    const connexion = workers.connexion

    const [instancesParId, setInstancesParId] = useState('')
    const [evenementRecu, setEvenementRecu] = useState('')
    const [instanceSelectionnee, setInstanceSelectionnee] = useState('')
    
    useEffect(()=>{
        if(evenementRecu) {
            traiterMessageRecu(evenementRecu.message, instancesParId, setInstancesParId)
        }
        setEvenementRecu('')
    }, [instancesParId, setInstancesParId, evenementRecu, setEvenementRecu])

    const selectionnerInstanceCb = useCallback(instanceId=>{
        if(instanceId.currentTarget) instanceId = instanceId.currentTarget.value
        setInstanceSelectionnee(instanceId)
    }, [setInstanceSelectionnee])

    useEffect(()=>{
        if(etatConnexion) {
            console.debug("Requete topologie instances")
            
            const cb = comlinkProxy(setEvenementRecu)
            connexion.enregistrerCallbackEvenementsNoeuds(cb)
                .catch(err=>console.error("Erreur enregistrement evenements instances : %O", err))

            // Charger (recharger) instances
            chargerListeInstances(connexion, setInstancesParId)
                .catch(err=>console.error("Erreur chargement liste noeuds : %O", err))
    
            // Cleanup
            return () => {
                connexion.retirerCallbackEvenementsNoeuds(cb)
                    .catch(err=>console.warn("Erreur retrait evenements instances : %O", err))
            }
        }
    }, [connexion, etatConnexion, setEvenementRecu])

    // Afficher l'instance selectionnee (si applicable)
    if(instanceSelectionnee) {
        console.debug("Instance selectionnee : %s", instanceSelectionnee)
        const instance = instancesParId[instanceSelectionnee]
        return (
            <AfficherInstanceDetail 
                workers={workers} 
                etatConnexion={etatConnexion}
                instance={instance} 
                fermer={()=>setInstanceSelectionnee('')} />
        )
    }

    // Afficher la liste des instances
    return (
        <>
            <h1>Instances</h1>

            <h2>Instance Protegee</h2>
            <InstanceProtegee 
                workers={workers} 
                instances={instancesParId} 
                selectionnerInstance={selectionnerInstanceCb} />

            <h2>Instances Privees</h2>
            <ListeInstances 
                workers={workers} 
                instances={instancesParId} 
                securite="2.prive" 
                selectionnerInstance={selectionnerInstanceCb} />

            <h2>Instances Publiques</h2>
            <ListeInstances 
                workers={workers} 
                instances={instancesParId} 
                securite="1.public" 
                selectionnerInstance={selectionnerInstanceCb} />
        </>
    )
}

export default Instances

function InstanceProtegee(props) {

    const { instances, selectionnerInstance } = props
    if(!instances) return <p>Aucune instance protegee</p>
    const instance = Object.values(instances).filter(item=>item.securite === '3.protege').pop()

    const nomInstance = instance.domaine,
          instanceId = instance.noeud_id

    return (
        <>
            <Row>
                <Col md={4}>{nomInstance}</Col>
                <Col md={8}>
                    <Button variant="secondary" onClick={selectionnerInstance} value={instanceId}>Configurer</Button>
                </Col>
            </Row>
        </>
    )
}

function ListeInstances(props) {
    const instances = props.instances,
          securite = props.securite

    const [liste, setListe] = useState('')

    useEffect(()=>{
        const liste = Object.values(instances).filter(item=>item.securite === securite)
        if(liste.length > 0) {
            trierNoeuds(liste)
            setListe(liste)
        } else {
            setListe('')
        }
    }, [instances, setListe])

    if(!liste) return <p>Aucunes instances</p>

    return liste.map(instance=>{
        <InstanceItem key={instance.noeud_id} instance={instance} />
    })
}

function InstanceItem(props) {
    return (
        <Row>
            <Col>
                Instance
            </Col>
        </Row>
    )
}

// Charge la liste courante des noeuds
async function chargerListeInstances(connexion, setInstancesParNoeudId, setProtege, setPrives, setPublics) {
    var reponseInstances = await connexion.requeteListeNoeuds({})
    console.debug("Reponse instances : %O", reponseInstances)
  
    if(!reponseInstances) reponseInstances = []
  
    let instances = reponseInstances.map(instance=>{
        const derniereModification = instance['_mg-derniere-modification']
        const infoNoeud = mapperNoeud(instance, derniereModification)
        return infoNoeud
    })

    const instancesParNoeudId = instances.reduce((acc, item)=>{
        acc[item.noeud_id] = item
        return acc
    }, {})
  
    setInstancesParNoeudId(instancesParNoeudId)
}

function trierNoeuds(noeuds) {
    noeuds.sort((a,b)=>{
        if(a === b) return 0
        if(!a || !a.descriptif) return -1
        if(!b || !b.descriptif) return 1
        if(a.descriptif === 'Principal') return -1
        if(b.descriptif === 'Principal') return 1
        return a.descriptif.localeCompare(b.descriptif)
    })
}

function mapperNoeud(noeudInfo, derniereModification) {
    // console.debug("NOEUD RECU : %O", noeudInfo)
  
    var actif = true
    const epochCourant = new Date().getTime() / 1000
    if(epochCourant > derniereModification + 60) {
      actif = false
    }
  
    var principal = false
    var securite = noeudInfo.securite
    if(!noeudInfo.parent_noeud_id && securite === '3.protege') {
      principal = true
    }
  
    var descriptif = noeudInfo.nom
    if(!descriptif && principal) {
      if(noeudInfo.domaine) descriptif = noeudInfo.domaine + ' (P)'
      else descriptif = 'Principal'
    } else {
      descriptif = noeudInfo.domaine || noeudInfo.fqdn || noeudInfo.noeud_id
    }
  
    const mappingNoeud = {
      descriptif,
      actif,
      securite,
      principal,
      parent_noeud_id: noeudInfo.parent_noeud_id,
      noeud_id: noeudInfo.noeud_id,
      ip_detectee: noeudInfo.ip_detectee,
      fqdn: noeudInfo.fqdn_detecte,
      date: derniereModification,
      domaine: noeudInfo.domaine,
    }
  
    const champsOptionnels = ['services', 'containers', 'consignation_web', 'applications_configurees']
    champsOptionnels.forEach(champ=>{
      if(noeudInfo[champ]) mappingNoeud[champ] = noeudInfo[champ]
    })
  
    return mappingNoeud
}

function traiterMessageRecu(message, instancesParId, setInstancesParId) {
    console.debug("processMessageNoeudsCb recu : %O", message)

    const instanceId = message.noeud_id
    const derniereModification = message['en-tete'].estampille
    const instance = mapperNoeud(message, derniereModification)
    
    const copieInstances = {...instancesParId, [instanceId]: instance}
    setInstancesParId(copieInstances)
}