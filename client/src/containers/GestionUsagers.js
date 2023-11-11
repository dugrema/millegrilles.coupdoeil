import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {Row, Col, Button, Alert, Form} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { proxy } from 'comlink'

import { AfficherActivationsUsager, supporteCamera } from '@dugrema/millegrilles.reactjs'

import useWorkers, { useEtatPret } from '../WorkerContext'

import { clear, mergeUsager, setUserId } from '../redux/usagersSlice'

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

export default function GestionUsagers(props) {

  const { confirmationCb, erreurCb, fermer } = props

  const workers = useWorkers(),
        etatPret = useEtatPret(),
        dispatch = useDispatch()

  // const [listeUsagers, setListeUsagers] = useState([])
  // const [userId, setUserId] = useState('')
  const userId = useSelector(state=>state.usagers.userIdSelectionne)

  const {connexion} = workers

  const fermerUsagerHandler = useCallback(()=>dispatch(setUserId('')), [dispatch])

  const evenementUsagerHandler = useCallback(e=>{
    console.debug("GestionUsagers message recu ", e)
    dispatch(mergeUsager(e.message))
  }, [dispatch])

  const messageInstanceHandlerProxy = useMemo(()=>{
    return proxy(evenementUsagerHandler)
  }, [evenementUsagerHandler])

  useEffect(_=>{
    if(etatPret) {
      chargerListeUsagers(connexion, dispatch)
        .catch(err=>console.error("Erreur chargement liste usagers : %O", err))

      // chargerListeUsagers(connexion, setListeUsagers).catch(err=>console.error("Erreur chargement liste usagers : %O", err))
      workers.connexion.enregistrerCallbackEvenementsUsager(messageInstanceHandlerProxy)
        .catch(err=>console.warn('GestionUsagers Erreur enregistrement callbacks usagers : ', err))

      return () => {
        dispatch(clear())
        workers.connexion.retirerCallbackEvenementsUsager()
          .catch(err=>console.warn('GestionUsagers Erreur retrait callbacks usagers : ', err))
      }

    }
  }, [workers, etatPret, messageInstanceHandlerProxy])

  if(userId) return (
    <AfficherUsager confirmationCb={confirmationCb}
                    erreurCb={erreurCb}
                    fermer={fermerUsagerHandler} />
  )

  return (
    <>
      <h2>Gestion usagers</h2>
      <AfficherListeUsagers setUserId={setUserId} 
                            fermer={fermer} />
    </>
  )
}

function AfficherListeUsagers(props) {

  const { fermer } = props

  const listeUsagers = useSelector(state=>state.usagers.listeUsagers)

  const { t } = useTranslation()

  // listeUsagers.sort(trierUsagers)

  return (
    <>
      <Row>
          <Col xs={10} md={11}>
              <h2>{t('GestionUsagers.titre')}</h2>
          </Col>
          <Col xs={2} md={1} className="bouton">
              <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
          </Col>
      </Row>

      <Row className="table-header">
        <Col xs={12} sm={6} lg={3}>
          Usager
        </Col>
        <Col xs={12} sm={6} lg={3}>
          Securite
        </Col>
      </Row>
      {listeUsagers?listeUsagers.map(usager=>{
        return <UsagerRow key={usager.userId}
                          usager={usager}
                          selectUser={_=>{props.setUserId(usager.userId)}} />
      }):''}
    </>
  )
}

function UsagerRow(props) {

  const { usager } = props

  const dispatch = useDispatch()

  const delegationGlobale = usager.delegation_globale,
        comptePrive = usager.compte_prive || false,
        nomUsager = usager.nomUsager,
        userId = usager.userId

  const selectUsagerHandler = useCallback(e=>{
    const { value: userId } = e.currentTarget
    console.debug("Set userId : %O", userId)
    dispatch(setUserId(userId))
  }, [dispatch])

  const securite = useMemo(()=>{
    if(delegationGlobale) {
      return `3.protege (${delegationGlobale})`
    } else if(comptePrive) {
      return '2.prive'
    }
    return '1.public'
  }, [delegationGlobale, comptePrive])

  return (
    <Row>
      <Col xs={12} sm={6} lg={3}>
        <Button variant="link" onClick={selectUsagerHandler} value={userId}>
          {nomUsager}
        </Button>
      </Col>
      <Col xs={12} sm={6} lg={3}>
        {securite}
      </Col>
    </Row>
  )
}

function AfficherUsager(props) {

  const { confirmationCb, erreurCb, fermer } = props

  const { t } = useTranslation()
  const workers = useWorkers()

  // const [usager, setUsager] = useState('')

  const userId = useSelector(state=>state.usagers.userIdSelectionne)
  const listeUsagers = useSelector(state=>state.usagers.listeUsagers)
  const usager = useMemo(()=>{
    return listeUsagers.filter(item=>item.userId === userId).pop()
  }, [listeUsagers, userId])

  // useEffect(_=>{
  //   console.debug("Afficher usager %s", userId)
  //   chargerUsager(workers.connexion, userId, setUsager)
  // }, [workers, userId, setUsager])

  // const reloadUsager = useCallback(_=>{
  //   chargerUsager(workers.connexion, userId, setUsager)
  // }, [workers, userId, setUsager])

  return (
    <>
      <Row>
          <Col xs={10} md={11}>
              <h2>{t('GestionUsagers.usager-titre')}</h2>
          </Col>
          <Col xs={2} md={1} className="bouton">
              <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
          </Col>
      </Row>

      <br />

      <Row>
        <Col xs={12} md={2}>Nom usager</Col>
        <Col>{usager.nomUsager}</Col>
      </Row>

      <Row>
        <Col xs={12} md={2}>User ID</Col>
        <Col>{usager.userId}</Col>
      </Row>

      <br />

      <Tabs>
        <Tab eventKey='activation' title='Activation'>
          <ActivationUsager 
            usager={usager}
            confirmationCb={confirmationCb}
            erreurCb={erreurCb} />
        </Tab>
        <Tab eventKey='autorisation' title='Autorisation'>
          <InformationUsager 
            usager={usager}
            setErr={erreurCb} />
        </Tab>
        <Tab eventKey='passkeys' title='Passkeys'>
          <GestionWebauthn 
            usager={usager} />
        </Tab>
      </Tabs>

    </>
  )
}

function ActivationUsager(props) {

  const { usager, confirmationCb, erreurCb } = props

  const workers = useWorkers(),
        etatPret = useEtatPret()

  // const [csr, setCsr] = useState('')
  const [supportCodeQr, setSupportCodeQr] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  const confirmationHandler = useCallback(val=>{
    setConfirmation(val)
    setTimeout(()=>setConfirmation(''), 5_000)
  }, [setConfirmation])

  const nomUsager = useMemo(()=>{
    if(usager) return usager.nomUsager
  }, [usager])

  const csrCb = useCallback(csr=>{
    console.debug("Recu csr : %O", csr)
    // setCsr(csr)

    console.debug("Activer CSR pour usager %O\n%O", usager, csr)
    const { connexion } = workers
    const userId = usager.userId,
          nomUsager = usager.nomUsager

    const now = Math.floor(new Date().getTime() / 1000)  // Date epoch secs
    const demandeCertificat = {nomUsager, csr, date: now, activationTierce: true}

    const commande = {
      userId,
      demandeCertificat,
    }

    connexion.signerRecoveryCsrParProprietaire(commande)
      .then(resultat=>{
        console.debug("Reponse activation : %O", resultat)
        confirmationHandler('Code usager active')
      })
      .catch(err=>erreurCb(err))
  }, [workers, usager, confirmationHandler])

  // const activerCsr = useCallback(()=>{
  //   console.debug("Activer CSR pour usager %O\n%O", usager, csr)
  //   const { connexion } = workers
  //   const compte = usager.compte
  //   const userId = compte.userId,
  //         nomUsager = compte.nomUsager

  //   const now = Math.floor(new Date().getTime() / 1000)  // Date epoch secs
  //   const demandeCertificat = {nomUsager, csr, date: now, activationTierce: true}

  //   const commande = {
  //     userId,
  //     demandeCertificat,
  //   }

  //   connexion.signerRecoveryCsrParProprietaire(commande)
  //     .then(resultat=>{
  //       console.debug("Reponse activation : %O", resultat)
  //       // confirmationCb('Code usager active')
  //     })
  //     .catch(err=>erreurCb(err))
  // }, [workers, usager, csr, confirmationCb])

  useEffect(()=>{
    supporteCamera()
      .then(support=>setSupportCodeQr(support))
      .catch(err=>erreurCb(err))
  }, [setSupportCodeQr])

  return (
    <>
      <AfficherActivationsUsager 
        nomUsager={nomUsager}
        workers={workers}
        supportCodeQr={supportCodeQr}
        csrCb={csrCb}
        erreurCb={erreurCb} />

      <Alert variant="success" show={!!confirmation}>
        <Alert.Heading>Succes</Alert.Heading>
        {confirmation}
      </Alert>

      {/* <Alert show={!!(csr && etatPret)}>
        <p>Le code est valide. Cliquer sur activer pour</p>
        <p>
          <Button onClick={activerCsr}>Activer</Button>
        </p>
      </Alert> */}
    </>
  )
}


function InformationUsager(props) {

  const { usager, setUsager, setErr } = props

  const workers = useWorkers(),
        dispatch = useDispatch()

  const [delegationGlobale, setDelegationGlobale] = useState('')
  const [comptePrive, setComptePrive] = useState('')
  const [succes, setSucces] = useState(false)
  const [changementPresent, setChangementPresent] = useState(false)

  const toggleComptePrive = useCallback(e => {
    setChangementPresent(true)
    setComptePrive(!comptePrive)
  }, [comptePrive, setComptePrive, setChangementPresent])

  const changerChamp = useCallback(e => {
    setChangementPresent(true)
    const {name, value} = e.currentTarget
    console.debug("Set %s = %s", name, value)
    switch(name) {
      case 'delegationGlobale': setDelegationGlobale(value); break
      default:
    }
  }, [setChangementPresent, setDelegationGlobale])

  const sauvegarderChangements = useCallback(async event => {
    setSucces(false)
    console.debug("Click sauvegarderChangements")
    if(!changementPresent) return
    
    setChangementPresent(false)  // Reset

    const transaction = {
      userId: usager.userId
    }
    if(delegationGlobale !== '') {
      transaction.delegation_globale = delegationGlobale==='aucune'?null:delegationGlobale
    }
    if(comptePrive !== '') {
      transaction.compte_prive = comptePrive
    }
    
    try {
      console.debug("majDelegations ", transaction)
      const docResultat = await workers.connexion.majDelegations(transaction)
      if(!docResultat.err) {
        setSucces(true)
        setTimeout(_=>{setSucces(false)}, 3000)
      } else {
        setErr(docResultat.err)
      }
    } catch(err) {
      setErr(''+err)
    }
  }, [dispatch, workers, changementPresent, usager, comptePrive, delegationGlobale, setChangementPresent, setErr])

  useEffect(()=>{
    if(changementPresent) return  // Empecher changement a l'ecran durant edit
    setDelegationGlobale(usager.delegation_globale || 'aucune')
    setComptePrive(usager.compte_prive || false)
  }, [changementPresent, usager, setDelegationGlobale, setComptePrive])

  return (
    <>
      <Row>
        <Col lg={3}>
          <Form.Label htmlFor="switch_compte_prive">Acces prive complet</Form.Label>
        </Col>
        <Col>
          <Form.Check type="switch"
                      checked={(comptePrive!=='')?comptePrive:usager.compte_prive}
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
              checked={((delegationGlobale!=='')?delegationGlobale:usager.delegation_globale) === item}
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

  const workers = useWorkers()
  
  const {connexion} = workers

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

async function chargerListeUsagers(connexion, dispatch) {
  const liste = await connexion.requeteListeUsagers()
  console.debug("Liste usagers : %O", liste)
  // setListeUsagers(liste.usagers)
  dispatch(clear())
  dispatch(mergeUsager(liste.usagers))
}

async function chargerUsager(connexion, userId, setUsager) {
  const params = { userId }
  const usager = await connexion.requeteUsager(params)
  console.debug("Usager charge : %O", usager)
  setUsager(usager)
}

function trierUsagers(a, b) {
  const nomA = a.nomUsager,
        nomB = b.nomUsager
  return nomA.localeCompare(nomB)
}
