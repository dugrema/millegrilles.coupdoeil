import React, {useState, useEffect, useCallback} from 'react'
import {Row, Col, Button, Alert, Form, Container, Modal} from 'react-bootstrap'
import {pki as forgePki} from 'node-forge'
import { detecterAppareilsDisponibles } from '@dugrema/millegrilles.common/lib/detecterAppareils'

import QrReader from 'react-qr-reader'

export default function GestionUsagers(props) {

  const [listeUsagers, setListeUsagers] = useState([])
  const [userId, setUserId] = useState('')
  const {connexion} = props.workers

  useEffect(_=>{
    chargerListeUsagers(connexion, setListeUsagers)
  }, [])

  if(userId) return (
    <AfficherUsager userId={userId}
                    workers={props.workers} />
  )

  return (
    <>
      <h2>Gestion usagers</h2>
      <AfficherListeUsagers listeUsagers={listeUsagers}
                            setUserId={setUserId} />
    </>
  )
}

function AfficherListeUsagers(props) {

  const listeUsagers = [...props.listeUsagers]
  listeUsagers.sort(trierUsagers)

  return (
    <>
      <h3>Usagers</h3>
      {listeUsagers.map(usager=>{
        return <UsagerRow key={usager.userId}
                          usager={usager}
                          selectUser={_=>{props.setUserId(usager.userId)}} />
      })}
    </>
  )
}

function UsagerRow(props) {
  return (
    <Row>
      <Col>
        <Button variant="link" onClick={props.selectUser}>
          {props.usager.nomUsager}
        </Button>
      </Col>
    </Row>
  )
}

function AfficherUsager(props) {
  const [usager, setUsager] = useState('')
  const [err, setErr] = useState('')

  useEffect(_=>{
    chargerUsager(props.workers.connexion, {userId: props.userId}, setUsager)
  }, [])

  const reloadUsager = useCallback(_=>{
    chargerUsager(props.workers.connexion, {userId: props.userId}, setUsager)
  }, [])

  return (
    <>
      <h2>Usager</h2>

      <Alert variant="danger" show={err?true:false}>
        <Alert.Heading>Erreur</Alert.Heading>
        {err}
      </Alert>

      <InformationUsager usager={usager}
                         workers={props.workers}
                         setUsager={setUsager}
                         setErr={setErr} />

      <AfficherActivationsUsager usager={usager}
                                 workers={props.workers} />

      <GestionWebauthn usager={usager}
                       workers={props.workers}
                       reloadUsager={reloadUsager} />

    </>
  )
}

function InformationUsager(props) {

  const [delegationGlobale, setDelegationGlobale] = useState('')
  const [comptePrive, setComptePrive] = useState('')

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
          <Form.Label for="switch_compte_prive">Acces prive complet</Form.Label>
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
            <Form.Check type="radio"
                        name="delegationGlobale"
                        checked={((delegationGlobale!=='')?delegationGlobale:props.usager.delegation_globale) === item}
                        onChange={changerChamp}
                        label={item}
                        value={item}
                        id={"radio_delegation_globale_" + item} />
          )}
        </Col>
      </Row>

      <Row>
        <Col lg={3}></Col>
        <Col>
          <Button disabled={!changementPresent} onClick={sauvegarderChangements}>Sauvegarder</Button>
        </Col>
      </Row>
    </>
  )
}

function AfficherActivationsUsager(props) {

  const [cameraDisponible, setCameraDisponible] = useState(false)
  const [showCsr, setShowCsr] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)

  useEffect(_=>{
    // Detecter si camera est disponible pour scanner code QR
    detecterAppareilsDisponibles().then(appareils=>{
      if(appareils && appareils.videoinput) setCameraDisponible(true)
    }).catch(err=>{console.warn("Erreur detection camera", err)})
  }, [])

  const hideCsr = useCallback(_=>{setShowCsr(false)}, [])
  const hideQrScanner = useCallback(_=>{setShowQrScanner(false)}, [])

  return (
    <>
      <CollerCSR show={showCsr}
                 retour={hideCsr}
                 usager={props.usager}
                 workers={props.workers} />

      <QRCodeReader show={showQrScanner}
                    retour={hideQrScanner}
                    usager={props.usager}
                    workers={props.workers} />

      <h3>Signer certificat usager</h3>

      <Row>
        <Col lg={3}>CSR en attente</Col>
        <Col>0</Col>
      </Row>

      <Row>
        <Col>
          <Button onClick={useCallback(_=>{setShowCsr(true)}, [])}>Coller CSR</Button>
          <Button onClick={useCallback(_=>{setShowQrScanner(true)}, [])}
                  disabled={!cameraDisponible}>
            Scan QR
          </Button>
        </Col>
      </Row>

      <h3>Activations</h3>
    </>
  )
}

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

function CollerCSR(props) {

  const [csr, setCsr] = useState('')
  const [err, setErr] = useState('')
  const [csrOk, setCsrOk] = useState(false)

  const usager = props.usager || {},
        nomUsager = usager.nomUsager,
        userId = usager.userId

  const onChange = event => {
    const value = event.currentTarget.value
    setCsr(value)

    try {
      traiterCsr(value, nomUsager)
      // CSR ok
      setErr('')
      setCsrOk(true)
      return
    } catch(err) {
      setErr(''+err)
    }
    setCsrOk(false)
  }

  const _activerCsr = async event => {
    try {
      await activerCsr(props.workers.connexion, csr, nomUsager, userId)

      // Activation completee
      props.retour()
    } catch(err) {
      console.debug("Erreur activation CSR %O", err)
      setErr(''+err)
    }
  }

  return (
    <Modal size="lg" show={props.show} onHide={props.retour}>

      <Modal.Header closeButton>
        <Modal.Title>Activer usager {nomUsager}</Modal.Title>
      </Modal.Header>

      <Modal.Body>

        <Alert variant="danger" show={err?true:false}>
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{err}</p>
        </Alert>

        <Form.Group>
          <Form.Label>Coller le CERTIFICATE REQUEST (CSR) ici</Form.Label>
          <Form.Control as="textarea" rows={16} onChange={onChange} value={csr}/>
        </Form.Group>

        <Row>
          {csrOk?
            <Col>CSR ok et correspond a l'usager. Cliquer sur le bouton pour Activer.</Col>
            :
            <Col>Coller un CSR dans la zone de texte.</Col>
          }
        </Row>
        <Row>
          <Col>
            <Button onClick={_activerCsr} disabled={!csrOk}>Activer</Button>
          </Col>
        </Row>

      </Modal.Body>

    </Modal>
  )
}

async function activerCsr(connexionWorker, csr, nomUsager, userId) {
  // console.debug("Activer CSR %O", csr)

  // Generer certificat - l'usager va pouvoir y acceder a son prochain login
  const cert = await connexionWorker.genererCertificatNavigateur({csr, nomUsager, userId})

  // console.debug("Certificat genere : %O", cert)
}

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
      await activerCsr(props.workers.connexion, csr, nomUsager, userId)

      // Activation completee
      props.retour()
    } catch(err) {
      console.debug("Erreur activation CSR %O", err)
      setErr(''+err)
    }
  }, [csr, nomUsager, userId])

  const handleScan = useCallback(scan=>{
    if(scan) {
      try {
        const dataB64 = btoa(scan)
        const pem = `-----BEGIN CERTIFICATE REQUEST-----\n${dataB64}\n-----END CERTIFICATE REQUEST-----`

        traiterCsr(pem, nomUsager)

        setScanActif(false)
        setInfo(''+pem)
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
            <QrReader
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '75%', 'text-align': 'center' }}
              />
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
