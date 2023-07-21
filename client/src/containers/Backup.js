import React, {useState, useEffect, useCallback, useMemo} from 'react';
import { useTranslation } from 'react-i18next'

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

function Backup(props) {

  const { fermer } = props

  const { t } = useTranslation()
  const workers = useWorkers(),
        etatPret = useEtatPret()

  const [attente, setAttente] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  
  const confirmationCb = useCallback( confirmation => { setConfirmation(confirmation); setAttente(false) }, [setConfirmation, setAttente]  )
  const erreurCb = useCallback(
    (err, message) => { 
        console.debug("Set erreurs %O, %s", err, message)
        setError(err, message)
        setAttente(false)  // Reset attente
    }, 
    [setError, setAttente]
  )

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
