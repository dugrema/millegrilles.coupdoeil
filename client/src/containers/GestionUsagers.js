import React, {useState, useEffect, useCallback} from 'react'
import {Row, Col, Button, Alert, Form} from 'react-bootstrap'

import { AfficherActivationsUsager, supporteCamera } from '@dugrema/millegrilles.reactjs'

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

      <Button variant="secondary" onClick={props.fermer}>Retour</Button>

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
    console.debug("Activer CSR pour usager %O\n%O", usager, csr)
    const { connexion } = workers
    const userId = usager.userId
    connexion.signerRecoveryCsr({userId, csr, activation_tierce: true})
      .then(resultat=>{
        console.debug("Reponse activation : %O", resultat)
        confirmationCb('Code usager active')
      })
      .catch(err=>erreurCb(err))
  }, [workers, usager, csr, confirmationCb])

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

function GestionWebauthn(props) {

  const [err, setErr] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const usager = props.usager || {},
        webauthn = usager.webauthn || [],
        userId = usager.userId

  const {connexion} = props.workers

  const [resetWebauthn, setResetWebauthn] = useState(true)
  const [resetActivations, setResetActivations] = useState(false)
  const [evictAllSessions, setEvictAllSessions] = useState(false)

  const resetWebauthnCb = useCallback(event=>setResetWebauthn(event.currentTarget.checked))
  const resetActivationsCb = useCallback(event=>setResetActivations(event.currentTarget.checked))
  const evictAllSessionsCb = useCallback(event=>setEvictAllSessions(event.currentTarget.checked))

  const resetCb = async event => {
    try {
      await connexion.resetWebauthn(userId, resetWebauthn, resetActivations, evictAllSessions)
      setConfirmation('Reset webauthn complete')
      props.reloadUsager()
    } catch(err) {
      setErr(''+err)
    }
  }

  const disabledButton = !(resetWebauthn || resetActivations || evictAllSessions)

  return (
    <>
      <h3>Authentification et sessions</h3>

      <Alert variant="danger" show={err?true:false}>{err}</Alert>
      <Alert variant="success" show={confirmation?true:false}>{confirmation}</Alert>

      <Row>
        <Col lg={3}>Nombre autorisations webauthn (tokens) sur le compte</Col>
        <Col lg={3}>{webauthn.length}</Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Form.Group id="resetWebauthn">
            <Form.Check checked={resetWebauthn} onChange={resetWebauthnCb} label="Reset tokens Webauthn"/>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Form.Group id="resetActivations">
            <Form.Check checked={resetActivations} onChange={resetActivationsCb} label="Reset activations de navigateurs"/>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Form.Group id="evictAllSessions">
            <Form.Check checked={evictAllSessions} onChange={evictAllSessionsCb} label="Expulser toutes les sessions actives"/>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col>
          <Button variant="danger"
                  onClick={resetCb}
                  disabled={disabledButton}>
            Reset
          </Button>
        </Col>
      </Row>

    </>
  )
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
