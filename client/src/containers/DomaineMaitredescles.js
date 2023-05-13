import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Row, Col, Button, Alert } from 'react-bootstrap'
import { proxy } from 'comlink'
import { useTranslation } from 'react-i18next'

import { pki as forgePki } from '@dugrema/node-forge'
import { extraireExtensionsMillegrille } from '@dugrema/millegrilles.utiljs/src/forgecommon'
import { AlertTimeout, ModalChargerCleMillegrille } from '@dugrema/millegrilles.reactjs'
import useWorkers, { useEtatPret, useCleMillegrilleChargee } from '../WorkerContext'

const BATCH_NOMBRE_FETCH = 100       // Nombre cles downloadees a la fois

function DomaineMaitredescles(props) {

  const { fermer } = props

  const { t } = useTranslation(),
        workers = useWorkers(),
        etatPret = useEtatPret(),
        cleMillegrilleChargee = useCleMillegrilleChargee()

  const [certificatsMaitredescles, setCertificatsMaitredescles] = useState('')
  const [showModalCle, setShowModalCle] = useState(false)
  const [infoCles, setInfoCles] = useState('')
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [clesSymmetriques, setClesSymmetriques] = useState('')
  const [nouvelleCleSymmetrique, ajouterCleSymmetrique] = useState('')

  const showModalCleCb = useCallback(()=>setShowModalCle(true), [setShowModalCle])
  const hideModalCleCb = useCallback(()=>setShowModalCle(false), [setShowModalCle])
  const erreurCb = useCallback((err, message) => {
    console.error("Erreur ", err)
    setErreur({err, message})
  }, [setErreur])
  const resetClesNonDechiffrablesCb = useCallback(()=>resetClesNonDechiffrables(workers, setSucces, erreurCb), [workers])
  const chargerInfoClesCb = useCallback(()=>{fetchInfoCles(workers).then(info=>setInfoCles(info)).catch(erreurCb)}, [workers, setInfoCles, erreurCb])

  const setCleMillegrille = useCallback(cle=>{
    const { chiffrage } = workers
    const { pem } = cle
    chiffrage.chargerCleMillegrille(pem)
      .catch(err=>erreurCb(err))
  }, [workers])

  const transmettreCleSymmetriqueCb = useCallback(async event => {
    const value = event.currentTarget.value
    const cle = clesSymmetriques.filter(item=>item.instance_id === value).pop()
    if(cle) {
      console.debug("Emettre cle syummetrique rechiffree : ", cle)

      // Rechiffrer la cle secrete
      try {
        const cleSecrete = await workers.chiffrage.dechiffrerCleSecrete(cle.CA, {cleMillegrille: true})
        const cleRechiffree = await workers.chiffrage.chiffrerCleSecrete(cleSecrete, cle.clePublique)

        const commande = {
          instance_id: value,
          fingerprint: cle.fingerprint,
          cle: cleRechiffree
        }

        try {
          console.debug("Transmettre cle symmetrique ", commande)
          await workers.connexion.transmettreCleSymmetrique(commande)
          setSucces("Cle symmetrique transmise avec succes.")
        } catch(err) {
          erreurCb(err, 'Erreur transmission cle symmetrique')
        }

      } catch(err) {
        erreurCb(err, "Erreur rechiffrage cle symmetrique")
      }

    }
  }, [workers, clesSymmetriques, erreurCb])

  // Traiter buffer reception nouvelleCle
  useEffect(()=>{
    if(!nouvelleCleSymmetrique) return
    ajouterCleSymmetrique('')  // Vider buffer

    let cles = null
    if(!cles) cles = []
    else cles = [...clesSymmetriques]
    let mappe = false
    cles = cles.map(item=>{
      if(item.instance_id === nouvelleCleSymmetrique.instance_id) {
        mappe = true
        return nouvelleCleSymmetrique
      }
      else return item
    })
    if(!mappe) cles.push(nouvelleCleSymmetrique)
    setClesSymmetriques(cles)
  }, [nouvelleCleSymmetrique, ajouterCleSymmetrique, clesSymmetriques, setClesSymmetriques])

  // Handler evenements messages
  const evenementRechiffrageCb = useMemo(
    () => proxy( evenement => {
        traiterMessageRechiffrage(workers, evenement, ajouterCleSymmetrique)
            .catch(err=>console.error("Erreur traitement evenement message ", err))
    }),
    [workers, ajouterCleSymmetrique]
  )

  useEffect(chargerInfoClesCb, [chargerInfoClesCb])
  useEffect(()=>{
    console.debug("Charger certificat maitre des cles")
    workers.connexion.getCertificatsMaitredescles()
      .then(certificats=>{
        console.debug("Certificats maitredescles ", certificats)
        if(certificats.length > 0) setCertificatsMaitredescles(certificats)
      })
      .catch(err=>console.error("Erreur chargement certificats maitredescles ", err))
  }, [workers, setCertificatsMaitredescles])

  // Enregistrer changement de collection
  useEffect(()=>{
    if(!workers.connexion || !etatPret) return  // Pas de connexion, rien a faire

    // Enregistrer listeners
    workers.connexion.ecouterEvenementsRechiffageCles({}, evenementRechiffrageCb)
        .catch(err=>console.warn("Erreur enregistrement listeners rechiffrage : %O", err))

    // Cleanup listeners
    return () => {
        workers.connexion.retirerEvenementsRechiffageCles({}, evenementRechiffrageCb)
            .catch(err=>console.warn("Erreur retirer listeners rechiffrage : %O", err))
    }
  }, [workers, etatPret, evenementRechiffrageCb])

  return (
    <div>

      <Row>
          <Col xs={10} md={11}>
              <h2>{t('DomaineMaitredescles.titre')}</h2>
          </Col>
          <Col xs={2} md={1} className="bouton">
              <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
          </Col>
      </Row>

      <Alert variant="danger" show={certificatsMaitredescles?false:true}>
        <Alert.Heading>Certificat absent</Alert.Heading>
        <p>Le certificat de rechiffrage est absent. Veuillez recharger la page pour reessayer.</p>
      </Alert>

      <p>Cette page permet de recuperer les cles connues qui ne sont pas dechiffrables.</p>

      <p>Nombre de cles connues qui ne sont pas dechiffrables : {infoCles.nonDechiffrables}</p>

      <Row>
        <Col>
          Dev tools
        </Col>
      </Row>
      <Row>
        <Col>
          <Button variant="danger" onClick={resetClesNonDechiffrablesCb}>Reset cles non dechiffrables</Button>
        </Col>
      </Row>

      <Alert show={infoCles.nonDechiffrables===0}>
        <Alert.Heading>Aucune cle a rechiffrer</Alert.Heading>
        <p>Il n'y a aucune cle a rechiffrer.</p>
      </Alert>

      <Alert show={(infoCles.nonDechiffrables===0 || cleMillegrilleChargee)?false:true}>
        <Alert.Heading>Charger la cle de millegrille</Alert.Heading>
        <p>La cle de MilleGrille est requise pour le rechiffrage.</p>

        <p>
          <strong>Attention!</strong> La cle de MilleGrille donne acces tout sur le systeme. Ne l'utilisez que quand 
          vous etes sur de votre connexion internet. Ne la donnez jamais a quelqu'un d'autre.
        </p>

        <Button onClick={showModalCleCb}>Charger cle de millegrille</Button>
      </Alert>

      <RechiffrerCles 
        workers={workers}
        nombreClesNonDechiffrables={infoCles.nonDechiffrables}
        certificatsMaitredescles={certificatsMaitredescles}
        cleMillegrilleChargee={cleMillegrilleChargee} 
        chargerInfoClesCb={chargerInfoClesCb}
        confirmationCb={setSucces}
        erreurCb={erreurCb} />

      <br />

      <AfficherClesSymmetriques clesSymmetriques={clesSymmetriques} transmettre={transmettreCleSymmetriqueCb} />

      <ModalChargerCleMillegrille 
        show={showModalCle} 
        close={hideModalCleCb} 
        setCle={setCleMillegrille} />

      <AlertTimeout titre="Succes" delay={10000} value={succes} setValue={setSucces} />
      <AlertTimeout titre="Erreur" variant="danger" delay={30000} value={erreur} setValue={setErreur} />

    </div>
  )
}

export default DomaineMaitredescles

function RechiffrerCles(props) {

  const { workers, nombreClesNonDechiffrables, cleMillegrilleChargee, chargerInfoClesCb, erreurCb } = props

  const [nombreClesRechiffrees, setNombreClesRechiffrees] = useState(0)
  const [nombreErreurs, setNombreErreurs] = useState(0)
  const [certificatsMaitredescles, setCertificatsMaitredescles] = useState('')

  useEffect(()=>{
    const { connexion } = workers
    connexion.getCertificatsMaitredescles()
      .then(certificats=>{
        console.debug("Certificats de maitre des cles recus : ", certificats)
        setCertificatsMaitredescles(certificats)
      })
      .catch(err=>erreurCb(err, "Erreur chargement certificats de chiffrement"))
  }, [workers, setCertificatsMaitredescles])
  
  const rechiffrerCb = useCallback(()=>{
    rechiffrer(workers, certificatsMaitredescles, setNombreClesRechiffrees, setNombreErreurs, erreurCb)
      .then(chargerInfoClesCb)
      .catch(erreurCb)
  }, [workers, certificatsMaitredescles, setNombreClesRechiffrees, setNombreErreurs, chargerInfoClesCb, erreurCb])

  if(!(nombreClesNonDechiffrables && certificatsMaitredescles && cleMillegrilleChargee)) return ''

  return (
    <div>
      <h2>Rechiffrer cles</h2>

      <Row>
        <Col md={3}>Non dechiffrees</Col>
        <Col>{nombreClesNonDechiffrables}</Col>
      </Row>
      <Row>
        <Col md={3}>Rechiffrees</Col>
        <Col>{nombreClesRechiffrees}</Col>
      </Row>
      <Row>
        <Col md={3}>Erreurs</Col>
        <Col>{nombreErreurs}</Col>
      </Row>

      <Button onClick={rechiffrerCb}>Rechiffrer</Button>
    </div>
  )

}

function AfficherClesSymmetriques(props) {
  const { clesSymmetriques, transmettre } = props
  if(!clesSymmetriques) return ''

  return (
    <div>
      <h2>
        Cles symmetriques a rechiffrer
      </h2>

      <p>Nombre cles: {clesSymmetriques.length}</p>

      {clesSymmetriques.map(item=>(
        <AfficherCleSymmetrique 
          key={item.instance_id} 
          value={item} 
          transmettre={transmettre} />
      ))}
    </div>
  )
}

function AfficherCleSymmetrique(props) {
  const { value, transmettre } = props

  const cleMillegrilleChargee = useCleMillegrilleChargee()

  return (
    <Row>
      <Col>{value.instance_id}</Col>
      <Col>Cle prete? {value.cle?'Oui':'Non'}</Col>
      <Col>
        <Button 
          variant="secondary" 
          onClick={transmettre} 
          value={value.instance_id} 
          disabled={!cleMillegrilleChargee}>Transmettre</Button>
      </Col>
    </Row>
  )
}

async function fetchInfoCles(workers, erreurCb) {
  const { connexion } = workers
  const reponseNonDechiffrables = await connexion.requeteCompterClesNonDechiffrables()

  if(reponseNonDechiffrables.err) return erreurCb(reponseNonDechiffrables.err)
  const { compte } = reponseNonDechiffrables

  return {nonDechiffrables: compte}
}

async function rechiffrer(workers, certificatsRechiffrage, setNombreClesRechiffrees, setNombreErreurs, erreurCb) {
  const { connexion, chiffrage } = workers

  const setNombreClesRechiffreesProxy = proxy(setNombreClesRechiffrees)
  const setNombreErreursProxy = proxy(setNombreErreurs)

  try {
    const params = {
      DEBUG: true,
      batchSize: BATCH_NOMBRE_FETCH,
    }
    await chiffrage.rechiffrerAvecCleMillegrille(
      connexion, certificatsRechiffrage, setNombreClesRechiffreesProxy, setNombreErreursProxy, params)
  } catch(err) {
    erreurCb(err, 'Erreur rechiffrage')
  }

}

async function resetClesNonDechiffrables(workers, confirmationCb, erreurCb) {
  const {connexion} = workers
  try {
    const reponse = await connexion.resetClesNonDechiffrables()
    console.debug("Reponse")
    if(reponse.ok === false) {
      erreurCb(reponse.err, 'Erreur reset cles')
    } else {
      confirmationCb('Reset cles ok')
    }
  } catch(err) {
    erreurCb(err)
  }
}

async function traiterMessageRechiffrage(workers, evenement, ajouterCleSymmetrique) {
  console.debug("traiterMessageRechiffrage ", evenement)
  const { routingKey, message, exchange, properties } = evenement

  const action = routingKey.split('.').pop()

  if( exchange === '3.protege' ) {
    if(action === 'demandeCleSymmetrique') {
      recevoirDemandeCleSymmetrique(workers, message, properties, ajouterCleSymmetrique)
    } else {
      console.warn("traiterMessageRechiffrage Action inconnue : ", action)
    }
  } else {
    console.warn("traiterMessageRechiffrage Exchange non supporte : ", exchange)
  }
}

async function recevoirDemandeCleSymmetrique(workers, demande, properties, ajouterCleSymmetrique) {

  const certificat = demande['__original'].certificat,
        replyTo = properties.replyTo
  console.debug("Verifier certificat maitre des cles : ", certificat)

  const enveloppe = await workers.x509.verifierCertificat(certificat)
  console.debug("Enveloppe : ", enveloppe)

  const certForge = forgePki.certificateFromPem(certificat[0])
  const clePublique = certForge.publicKey.publicKeyBytes
  const instance_id = certForge.subject.getField('CN').value
  const extensions = extraireExtensionsMillegrille(certForge)
  console.debug("Extensions certificat maitre des cles %s : %O (extension %O)", instance_id, certForge, extensions)

  const { roles, niveauxSecurite } = extensions
  if(niveauxSecurite.includes('4.secure') && roles.includes('maitredescles')) {
    // Ok, rechiffrer
    const infoCle = {
      instance_id, 
      replyTo,
      instance_id, 
      fingerprint: demande['__original'].pubkey, 
      CA: demande.cle_symmetrique_ca, 
      clePublique,
      // cle: cleRechiffree
    }
    console.debug("Info cle ", infoCle)
    ajouterCleSymmetrique(infoCle)

  } else {
    console.warn("recevoirDemandeCleSymmetrique Certificat recu n'a pas les proprietes pour MaitreDesCles - REFUSE", certificat)
  }

}