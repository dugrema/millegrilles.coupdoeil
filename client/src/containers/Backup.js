import React, {useState, useEffect, useCallback, useMemo} from 'react';
import { useTranslation } from 'react-i18next'
import { proxy } from 'comlink'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Alert from 'react-bootstrap/Alert'
import Modal from 'react-bootstrap/Modal'

import { AlertTimeout, ModalAttente, FormatteurTaille, FormatterDate } from '@dugrema/millegrilles.reactjs'
import { pki as forgePki } from '@dugrema/node-forge'

import { DateTimeAfficher } from '../components/ReactFormatters'

import useWorkers, { useEtatPret } from '../WorkerContext'
import { ProgressBar } from 'react-bootstrap';

function Backup(props) {

  const { fermer } = props

  const { t } = useTranslation()
  const workers = useWorkers(),
        etatPret = useEtatPret()

  const [attente, setAttente] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [etatBackup, setEtatBackup] = useState('')
  const [backupActif, setBackupActif] = useState(false)
  
  const confirmationCb = useCallback( confirmation => { setConfirmation(confirmation); setAttente(false) }, [setConfirmation, setAttente]  )
  const erreurCb = useCallback(
    (err, message) => { 
        console.debug("Set erreurs %O, %s", err, message)
        setError(err, message)
        setAttente(false)  // Reset attente
    }, 
    [setError, setAttente]
  )

  const evenementBackupCb = useCallback(e=>{
    // console.debug("Evenement backup recu : ", e)
    const { message, routingKey } = e
    setEtatBackup(message)
    if(routingKey.endsWith('.succes')) {
      confirmationCb('Backup complete avec succes')
      setBackupActif(false)
    } else if(routingKey.endsWith('.echec')) {
      setBackupActif(false)
      erreurCb("Erreur durant l'execution du backup")
      confirmationCb('')
    } else {
      confirmationCb('')
      setBackupActif(true)
    }

  }, [workers, setEtatBackup, setBackupActif, confirmationCb, erreurCb])
  const evenementBackupProxy = useMemo( () => proxy(evenementBackupCb), [evenementBackupCb])

  useEffect(()=>{
    if(!etatPret) return  // Rien a faire
    workers.connexion.ecouterEvenementsBackup({}, evenementBackupProxy)
      .catch(err=>console.error("Erreur activation listener evenements backup : ", err))

    return () => {
      workers.connexion.retirerEvenementsBackup({}, evenementBackupProxy)
        .catch(err=>console.error("Erreur desactivation listener evenements backup : ", err))
    }

  }, [workers, etatPret, evenementBackupCb])

  return (
    <div>
      <Row>
          <Col xs={10} md={11}>
              <h2>{t('Backup.titre')}</h2>
          </Col>
          <Col xs={2} md={1} className="bouton">
              <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
          </Col>
      </Row>

      <AlertTimeout variant="danger" titre="Erreur" delay={false} value={error} setValue={setError} />
      <AlertTimeout value={confirmation} setValue={setConfirmation} />
      <ModalAttente show={attente} setAttente={setAttente} />

      <ActionsBackup confirmationCb={confirmationCb} erreurCb={erreurCb} />

      <BackupActif value={backupActif} />

      <EtatBackup value={etatBackup} />

    </div>
  )
  
}

export default Backup

function ActionsBackup(props) {

  const { confirmationCb, erreurCb } = props

  const workers = useWorkers(),
        etatPret = useEtatPret()

  const demarrerBackupHandler = useCallback(()=>{
    workers.connexion.demarrerBackupTransactions({complet: true})
        .then(reponse=>{
            console.debug("Backup demarre OK ", reponse)
            confirmationCb('Backup complet demarre')
        })
        .catch(err=>{
            console.error("Erreur declencher backup complet ", err)
            erreurCb('Erreur declencher backup complet. \n' + err)
        })
  }, [workers, confirmationCb])
  
  return (
    <div>
      <p></p>
      <h3>Actions de Backup</h3>
      <Row>
          <Col>
              <Button variant="secondary" disabled={!etatPret} onClick={demarrerBackupHandler}>Backup</Button>
          </Col>
      </Row>
      <p></p>
    </div>
  )
}

function BackupActif(props) {

  const { value } = props

  return (
    <Alert variant="info" show={value?true:false}>
      <Alert.Heading>Backup actif</Alert.Heading>
      <p>Un backup est presentement en cours.</p>
    </Alert>
  )
}

function EtatBackup(props) {
  const { value } = props

  const [domaineCourant, setDomaineCourant] = useState('')
  
  useEffect(()=>{
    if(!value || !value.domaine) return
    if(value.domaine.backup_complete) {
      setDomaineCourant('')
      return
    }

    const domaineCourant = value.domaine.domaine
    if(!domaineCourant) return  // On ne change pas, rendre sticky

    setDomaineCourant(domaineCourant)
  }, [value, setDomaineCourant])

  if(!value) return ''  // Rien a afficher

  return (
    <div>
      <h3>Etat du backup</h3>

      <Row>
        <Col>Debut</Col>
        <Col><FormatterDate value={value.debut} /></Col>
        <Col>Fin</Col>
        <Col><FormatterDate value={value.fin} /></Col>
      </Row>

      <p></p>

      <ListeDomaines value={value.domaines} courant={domaineCourant} />

      <p></p>

      <AfficherNotices value={value.notices} />

    </div>
  )
}

function ListeDomaines(props) {
  const { value, courant } = props

  if(!value) return ''  // Rien a afficher

  return (
    <div>
      <Row>
        <Col lg={4}>Domaine</Col>
        <Col lg={2}>Transactions</Col>
        <Col lg={4}></Col>
      </Row>

      {value.map(item=>{
        const estCourant = item.domaine === courant
        return <AfficherLigneDomaineBackup key={item.domaine} value={item} courant={estCourant} />
      })}
    </div>
  )
}

function AfficherLigneDomaineBackup(props) {
  const { value, courant } = props

  const [pctProgres, label, variantBar, animated] = useMemo(()=>{
    if(!value) return [100, '', 'primary', false]

    const { nombre_transactions, transactions_traitees, transactions_sauvegardees } = value
    if(nombre_transactions === 0) return [100, 'success', false]
    if(!nombre_transactions) {
      if(courant) return [100, 'Preparation en cours', 'primary', true]
      else return [100, 'Nombre de transactions inconnu', 'warning', false]
    }

    const numerateur = (transactions_traitees?transactions_traitees:0) + (transactions_sauvegardees?transactions_sauvegardees:0)

    if(courant && numerateur === 0) {
      return [100, 'Preparation en cours', 'primary', true]  // En preparation
    }

    const pctProgres = Math.floor( (100 * numerateur) / nombre_transactions )
    if(pctProgres === 100) {
      if(value.backup_complete) {
        return [pctProgres, 'Succes', 'success', false]
      }
      return [pctProgres, ''+pctProgres+'%', 'primary', false]
    }

    if(!courant) {
      // Pct n'est pas 100% et on n'est pas courant, erreur
      return [pctProgres, ''+pctProgres+'% - interrompu', 'warning', false]
    }

    return [pctProgres, ''+pctProgres+'%', 'primary', true]
  }, [value, courant])

  return (
    <Row>
      <Col lg={4}>{value.domaine}</Col>
      <Col lg={2}>{value.nombre_transactions}</Col>
      <Col lg={4}>
        <ProgressBar 
          variant={variantBar} 
          animated={animated}
          disabled={courant} 
          now={pctProgres} 
          label={label} />
      </Col>
    </Row>
  )
}

function AfficherNotices(props) {
  const { value } = props

  return (
    <Alert variant="warning" show={value?true:false}>
      <Alert.Heading>Notices emises durant le backup</Alert.Heading>

      {value?value.map((notice, idx)=>{
        return (
          <Row key={idx}>
            <Col lg={2}>{notice.domaine}</Col>
            <Col>{notice.erreur}</Col>
          </Row>
        )
      }):''}
    </Alert>
  )
}
