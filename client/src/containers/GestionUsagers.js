import React, {useState, useEffect, useCallback} from 'react'
import {Row, Col, Button, Alert, Form, Modal} from 'react-bootstrap'
import {pki as forgePki} from '@dugrema/node-forge'

import { AfficherActivationsUsager, supporteCamera } from '@dugrema/millegrilles.reactjs'

import {QrCodeScanner, parseCsrQr} from './QrCodeScanner'

export default function GestionUsagers(props) {

  const { etatAuthentifie, confirmationCb, erreurCb } = props

  const [listeUsagers, setListeUsagers] = useState([])
  const [userId, setUserId] = useState('')
  const {connexion} = props.workers
  const fermer = props.fermer

  useEffect(_=>{
    if(etatAuthentifie) {
      chargerListeUsagers(connexion, setListeUsagers).catch(err=>console.error("Erreur chargement liste usagers : %O", err))
    }
  }, [etatAuthentifie])

  if(userId) return (
    <AfficherUsager userId={userId}
                    workers={props.workers} 
                    etatAuthentifie={etatAuthentifie}
                    confirmationCb={confirmationCb}
                    erreurCb={erreurCb}
                    fermer={()=>setUserId('')} />
  )

  return (
    <>
      <h2>Gestion usagers</h2>
      <AfficherListeUsagers listeUsagers={listeUsagers}
                            setUserId={setUserId} 
                            etatAuthentifie={etatAuthentifie}
                            fermer={fermer} />
    </>
  )
}

function AfficherListeUsagers(props) {

  const listeUsagers = [...props.listeUsagers]
  listeUsagers.sort(trierUsagers)

  return (
    <>
      <h3>Usagers</h3>

      <Button variant="secondary" onClick={props.fermer}>Fermer</Button>

      <Row className="table-header">
        <Col xs={12} sm={6} lg={3}>
          Usager
        </Col>
        <Col xs={12} sm={6} lg={3}>
          Securite
        </Col>
      </Row>
      {listeUsagers.map(usager=>{
        return <UsagerRow key={usager.userId}
                          usager={usager}
                          selectUser={_=>{props.setUserId(usager.userId)}} />
      })}
    </>
  )
}

function UsagerRow(props) {

  const delegationGlobale = props.usager.delegation_globale,
        comptePrive = props.usager.compte_prive || false

  var securite = '1.public'
  if(delegationGlobale) {
    securite = `3.protege (${delegationGlobale})`
  } else if(comptePrive) {
    securite = '2.prive'
  }

  return (
    <Row>
      <Col xs={12} sm={6} lg={3}>
        <Button variant="link" onClick={props.selectUser}>
          {props.usager.nomUsager}
        </Button>
      </Col>
      <Col xs={12} sm={6} lg={3}>
        {securite}
      </Col>
    </Row>
  )
}

function AfficherUsager(props) {

  const { confirmationCb, erreurCb, etatAuthentifie } = props

  const [usager, setUsager] = useState('')

  useEffect(_=>{
    chargerUsager(props.workers.connexion, {userId: props.userId}, setUsager)
  }, [])

  const reloadUsager = useCallback(_=>{
    chargerUsager(props.workers.connexion, {userId: props.userId}, setUsager)
  }, [])

  return (
    <>
      <h2>Usager</h2>

      <InformationUsager 
        etatAuthentifie={etatAuthentifie}
        usager={usager}
        workers={props.workers}
        setUsager={setUsager}
        setErr={erreurCb} />

      <ActivationUsager 
        etatAuthentifie={etatAuthentifie}
        usager={usager}
        workers={props.workers}
        confirmationCb={confirmationCb}
        erreurCb={erreurCb} />

      <GestionWebauthn 
        etatAuthentifie={etatAuthentifie}
        usager={usager}
        workers={props.workers}
        reloadUsager={reloadUsager} />

      <Button variant="secondary" onClick={props.fermer}>Fermer</Button>

    </>
  )
}

function ActivationUsager(props) {

  const { workers, usager, confirmationCb, erreurCb, etatAuthentifie } = props

  const [csr, setCsr] = useState('')
  const [supportCodeQr, setSupportCodeQr] = useState(false)

  const csrCb = useCallback(csr=>{
    console.debug("Recu csr : %O", csr)
    setCsr(csr)
  }, [setCsr])

  const activerCsr = useCallback(()=>{
    console.debug("Activer CSR\n%O", csr)
    confirmationCb(`Activer CSR :\n${csr}`)
  }, [csr, confirmationCb])

  useEffect(()=>{
    supporteCamera()
      .then(support=>setSupportCodeQr(support))
      .catch(err=>erreurCb(err))
  }, [setSupportCodeQr])

  return (
    <>
      <AfficherActivationsUsager 
        nomUsager={usager.nomUsager}
        workers={props.workers}
        supportCodeQr={supportCodeQr}
        csrCb={csrCb}
        erreurCb={erreurCb} />

      <Button onClick={activerCsr} disabled={!csr || !etatAuthentifie}>Activer</Button>
    </>
  )
}


function InformationUsager(props) {

  const [delegationGlobale, setDelegationGlobale] = useState('')
  const [comptePrive, setComptePrive] = useState('')
  const [succes, setSucces] = useState(false)

  const changementPresent = delegationGlobale!=='' || comptePrive!==''

  const toggleComptePrive = event => {
    var valeur = (comptePrive!=='')?comptePrive:props.usager.compte_prive
    setComptePrive(!valeur)
  }

  const changerChamp = event => {
    const {name, value} = event.currentTarget
    console.debug("Set %s = %s", name, value)
    switch(name) {
      case 'delegationGlobale': setDelegationGlobale(value); break
      default:
    }
  }

  const sauvegarderChangements = async event => {
    setSucces(false)
    if(!changementPresent) return
    const transaction = {
      userId: props.usager.userId
    }
    if(delegationGlobale !== '') {
      transaction.delegation_globale = delegationGlobale==='aucune'?null:delegationGlobale
    }
    if(comptePrive !== '') {
      transaction.compte_prive = comptePrive
    }
    try {
      const docResultat = await props.workers.connexion.majDelegations(transaction)
      if(!docResultat.err) {
        props.setUsager(docResultat)
        setSucces(true)
        setTimeout(_=>{setSucces(false)}, 3000)
      } else {
        props.setErr(docResultat.err)
      }
    } catch(err) {
      props.setErr(''+err)
    }
  }

  return (
    <>
      <Row>
        <Col lg={3}>Nom usager</Col>
        <Col>{props.usager.nomUsager}</Col>
      </Row>
      <Row>
        <Col lg={3}>
          <Form.Label htmlFor="switch_compte_prive">Acces prive complet</Form.Label>
        </Col>
        <Col>
          <Form.Check type="switch"
                      checked={(comptePrive!=='')?comptePrive:props.usager.compte_prive}
                      onChange={toggleComptePrive}
                      id="switch_compte_prive" />
        </Col>
      </Row>
      <Row>
        <Col lg={3}>
          Delegation globale
        </Col>
        <Col>
          {['proprietaire', 'delegue', 'aucune'].map(item=>
            <Form.Check 
              key={item}
              type="radio"
              name="delegationGlobale"
              checked={((delegationGlobale!=='')?delegationGlobale:props.usager.delegation_globale) === item}
              onChange={changerChamp}
              label={item}
              value={item}
              id={"radio_delegation_globale_" + item} />
          )}
        </Col>
      </Row>

      <Alert variant="success" show={succes?true:false}>
        Changement complete.
      </Alert>

      <Row>
        <Col lg={3}></Col>
        <Col>
          <Button disabled={!changementPresent} onClick={sauvegarderChangements}>Sauvegarder</Button>
        </Col>
      </Row>
    </>
  )
}

// function AfficherActivationsUsager(props) {

//   const [cameraDisponible, setCameraDisponible] = useState(false)
//   const [showCsr, setShowCsr] = useState(false)
//   const [showQrScanner, setShowQrScanner] = useState(false)

//   useEffect(_=>{
//     // Detecter si camera est disponible pour scanner code QR
//     detecterAppareilsDisponibles().then(appareils=>{
//       // if(appareils && appareils.videoinput) setCameraDisponible(true)
//       setCameraDisponible(true)
//     }).catch(err=>{console.warn("Erreur detection camera", err)})
//   }, [])

//   const hideCsr = useCallback(_=>{setShowCsr(false)}, [])
//   const hideQrScanner = useCallback(_=>{setShowQrScanner(false)}, [])

//   return (
//     <>
//       <QRCodeReader show={showQrScanner}
//                     retour={hideQrScanner}
//                     usager={props.usager}
//                     workers={props.workers} />

//       <h3>Signer certificat usager</h3>

//       <SectionActiverCompte />

//       <Row>
//         <Col>
//           <Button onClick={useCallback(_=>{setShowQrScanner(true)}, [setShowQrScanner])}
//                   disabled={!cameraDisponible}>
//             Scan QR
//           </Button>
//         </Col>
//       </Row>
//     </>
//   )
// }

function GestionWebauthn(props) {

  const [err, setErr] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const usager = props.usager || {},
        webauthn = usager.webauthn || [],
        userId = usager.userId

  const {connexion} = props.workers

  const resetWebauthn = async event => {
    try {
      await connexion.resetWebauthn(userId)
      setConfirmation('Reset webauthn complete')
      props.reloadUsager()
    } catch(err) {
      setErr(''+err)
    }
  }

  return (
    <>
      <h3>Authentification webauthn</h3>

      <Alert variant="danger" show={err?true:false}>{err}</Alert>
      <Alert variant="success" show={confirmation?true:false}>{confirmation}</Alert>

      <Row>
        <Col lg={3}>Nombre autorisations</Col>
        <Col lg={3}>{webauthn.length}</Col>
        <Col>
          <Button variant="danger"
                  onClick={resetWebauthn}
                  disabled={webauthn.length===0}>
            Reset webauthn
          </Button>
        </Col>
      </Row>
    </>
  )
}


// async function activerCsr(connexionWorker, csr, nomUsager, userId) {
//   console.debug("Activer CSR usager %s (%s) %O", nomUsager, userId, csr)

//   // Generer une "permission" avec le certificat local (delegation proprietaire)
//   // let permission = {
//   //   date: Math.floor(new Date().getTime()/1000), // Date epoch en secondes
//   //   userId,
//   //   activationTierce: true,  // Permet a l'usager d'acceder au compte sans token
//   // }
//   // permission = await chiffrageWorker.formatterMessage(permission, 'CoreMaitreDesComptes', {action: 'signatureCsr', attacherCertificat: true})

//   // Generer certificat - l'usager va pouvoir y acceder a son prochain login
//   const cert = await connexionWorker.genererCertificatNavigateur({csr, nomUsager, userId, activationTierce: true})

//   console.debug("Certificat genere : %O", cert)
// }

function QRCodeReader(props) {

  const [scanActif, setScanActif] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [csr, setCsr] = useState('')
  // const [csrOk, setCsrOk] = useState(false)

  const usager = props.usager,
        nomUsager = usager.nomUsager,
        userId = usager.userId

  useEffect(_=>{
    if(props.show) setScanActif(props.show)
  }, [props.show])

  const annuler = useCallback(_=>{
    setErr('')
    setScanActif(false)
    props.retour()
  }, [])

  const _activerCsr = useCallback(async event => {
    try {
      // await activerCsr(props.workers.connexion, csr, nomUsager, userId)

      // Activation completee
      console.debug("Activation completee , TODO mettre fenetre succes")
    } catch(err) {
      console.debug("Erreur activation CSR %O", err)
      setErr(''+err)
    }
  }, [csr, nomUsager, userId])

  const handleScan = useCallback(scan=>{
    if(scan) {
      try {
        const pem = parseCsrQr(scan)
        traiterCsr(pem, nomUsager)

        setScanActif(false)
        setInfo(''+pem)
        setErr('')
        setCsr(pem)
        return
      } catch(err) {
        setErr(''+err)
      }
    }

    setCsr('')

  }, [usager])

  const handleError = useCallback(err=>{
    setErr(''+err)
  }, [])

  return (
    <Modal show={props.show} onHide={props.retour}>
      <Modal.Header closeButton>
        Scan CSR
      </Modal.Header>
      <Modal.Body>

        <Alert variant="danger" show={err?true:false}>
          <Alert.Heading>Erreur</Alert.Heading>
          <pre>{err}</pre>
        </Alert>

        <Alert variant="info" show={info?true:false}>
          <Alert.Heading>Information</Alert.Heading>
          <pre>{''+info}</pre>
        </Alert>

        {scanActif?
          <>
            <QrCodeScanner handleError={handleError} handleScan={handleScan} show={scanActif}/>
            <Row>
              <Col>
                <Button onClick={annuler}>Annuler</Button>
              </Col>
            </Row>
          </>
          :''
        }

        <Row>
          {csr?
            <Col>CSR ok et correspond a l'usager. Cliquer sur le bouton pour Activer.</Col>
            :
            <Col>Coller un CSR dans la zone de texte.</Col>
          }
        </Row>
        <Row>
          <Col>
            <Button onClick={_activerCsr} disabled={csr?false:true}>Activer</Button>
          </Col>
        </Row>

      </Modal.Body>
    </Modal>
  )
}

function traiterCsr(pem, nomUsager) {
  // Verifier avec nodeForge
  const csrForge = forgePki.certificationRequestFromPem(pem)
  const nomUsagerCsr = csrForge.subject.getField('CN').value

  if(nomUsager !== nomUsagerCsr) {
    throw new Error(`Nom usager "${nomUsagerCsr}" du code QR ne correspond pas au compte "${nomUsager}"`)
  }

  return pem
}

async function chargerListeUsagers(connexion, setListeUsagers) {
  const liste = await connexion.requeteListeUsagers()
  console.debug("Liste usagers : %O", liste)
  setListeUsagers(liste.usagers)
}

async function chargerUsager(connexion, userId, setUsager) {
  const usager = await connexion.requeteUsager(userId)
  console.debug("Usager charge : %O", usager)
  setUsager(usager)
}

function trierUsagers(a, b) {
  const nomA = a.nomUsager,
        nomB = b.nomUsager
  return nomA.localeCompare(nomB)
}
