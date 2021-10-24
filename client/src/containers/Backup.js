import React, {useState, useEffect, useCallback} from 'react';
import { Row, Col, Button, Nav, Alert, Form, ProgressBar } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import {proxy as comlinkProxy} from 'comlink'
import {v1 as uuidv1} from 'uuid'

import { DateTimeAfficher } from '../components/ReactFormatters'
import { chargerStatsTransactionsDomaines } from '../components/UtilDomaines'

// Contexte global utilise pour fonctions avec comlinkProxy
const contexteGlobal = {},
      contexteBackup = {}

export function Backup(props) {

  const [operation, setOperation] = useState('')
  const [domaines, setDomaines] = useState('')
  const [noeuds, setNoeuds] = useState('')
  const [rapport, setRapport] = useState('')

  const connexion = props.workers.connexion

  // Entretien contexte pour callbacks comlink proxy
  useEffect(()=>{
    contexteGlobal.domaines = domaines
    contexteGlobal.noeuds = noeuds
    contexteGlobal.rapport = rapport
  }, [domaines, noeuds, rapport])

  const cbMessage = useCallback(comlinkProxy(msg=>{
    traiterMessage(connexion, contexteGlobal, {setDomaines, setNoeuds, setRapport}, msg)
  }), [connexion, setDomaines, setNoeuds, setRapport])

  useEffect(()=>{
    if(connexion && setDomaines && setNoeuds) {
      connexion.requeteListeDomaines()
        .then(domaines=>{
          console.debug("Domaines charges : %O", domaines)
          setDomaines(domaines)
        }).catch(err=>{console.error("Erreur chargement domaines %O", err)})

      connexion.requeteListeNoeuds({all_info: true})
        .then(noeuds=>{
          console.debug("Noeuds charges %O", noeuds)
          setNoeuds(noeuds)
        }).catch(err=>{console.error("Erreur chargement noeuds %O", err)})

      connexion.requeteRapportBackup({})
        .then(infoRapport=>{
          console.debug("Rapport dernier backup %O", infoRapport)
          setRapport(infoRapport.rapport || '')
        }).catch(err=>{console.error("Erreur chargement rapport backup %O", err)})

      connexion.enregistrerCallbackEvenementsBackup(cbMessage)
        .catch(err=>{console.error("Erreur enregistrement evenements backup", err)})

      // Cleanup
      return ()=>{
        connexion.retirerCallbackEvenementsBackup()
      }
    }
  }, [connexion, cbMessage, setDomaines, setNoeuds])

  const changerOperation = useCallback(event => {
    console.debug("Changer operation : %O", event)
    var value = 'SommaireBackup'
    if(event.currentTarget) {
      value = event.currentTarget.value
    } else {
      value = event
    }

    setOperation(value)

  }, [setOperation])

  let Action
  switch(operation) {
    case 'Backup': Action = BackupOperation; break
    case 'Restaurer': Action = RestaurerOperation; break
    default:
      Action = Sommaire
  }

  return <Action changerOperation={changerOperation}
                 workers={props.workers}
                 modeProtege={props.rootProps.modeProtege}
                 domaines={domaines}
                 noeuds={noeuds}
                 setDomaines={setDomaines}
                 setNoeuds={setNoeuds}
                 rapport={rapport} />
}

function Sommaire(props) {

  return (
    <>
      <h1>Backup et restauration</h1>

      <h2>Choisir une operation</h2>
      <Nav onSelect={props.changerOperation}>
        <Nav.Item>
          <Nav.Link eventKey='Backup'>Backup</Nav.Link>
        </Nav.Item>
        <Nav.Item eventKey='Restaurer'>
          <Nav.Link eventKey='Restaurer'>Restaurer</Nav.Link>
        </Nav.Item>
      </Nav>

      <h2>Dernier backup</h2>
      <DernierBackup rapport={props.rapport} />

      <h2>Domaines</h2>
      <AfficherDomaines domaines={props.domaines}
                        rapport={props.rapport} />

      <h2>Applications</h2>
      <AfficherApplications noeuds={props.noeuds} />
    </>
  )
}

function DernierBackup(props) {

  return (
    <Row>
      <Col xs={3}>
        Date du plus recent backup
      </Col>
      <Col>
        <DateTimeAfficher date={props.rapport.heure} />
      </Col>
    </Row>
  )
}

function AfficherDomaines(props) {
  if(!props.domaines) return (
    <p>Aucuns domaines</p>
  )

  const domaines = [...props.domaines]
  domaines.sort((a,b)=>{
    const nomA = a.domaine || '',
          nomB = b.domaine || ''

    return nomA.localeCompare(nomB)
  })

  const rapport = props.rapport
  if(rapport) {
    // Associer information du rapport par domaine
    domaines.forEach(item=>{
      const nom = item.domaine
      item.rapport = rapport[nom]
      const infoRapport = rapport[nom] || {}
      const {horaire_resultat, quotidien_resultat, annuel_resultat} = infoRapport
      if(horaire_resultat) {
        item.err = horaire_resultat.erreur || item.err
      }
      if(quotidien_resultat) {
        item.err = quotidien_resultat.erreur || item.err
      }
      if(annuel_resultat) {
        item.err = annuel_resultat.erreur || item.err
      }
    })
  }

  // console.debug("!!! Rapport prep  : %O", domaines)

  return domaines.map((item, idx)=>{

    let status = 'N/D'
    if(item.err) status = (
      <i className="fa fa-times echec"/>
    )
    else if(item.etat) status = <span><i className="fa fa-spinner fa-spin fa-fw"/> {item.etat}</span>
    else if(item.rapport || item.pctProgres === 100) status = <i className="fa fa-check succes"/>

    let pctProgres = ''
    if(item.pctProgres) {
      let variant = 'primary'
      if(item.err) variant = 'danger'
      pctProgres = <ProgressBar variant={variant} now={item.pctProgres} />
    }

    return (
      <>
        <Row key={idx}>
          <Col xs={6} md={2}>{item.domaine}</Col>
          <Col xs={6} md={3}>
            {status}
          </Col>
          <Col xs={12} md={7}>
            {item.err?
              item.err
              :
              pctProgres
            }
          </Col>
        </Row>
      </>
    )
  })
}

function AfficherApplications(props) {
  if(!props.noeuds) return (
    <p>Aucunes applications</p>
  )

  const applications = []
  props.noeuds.forEach(item=>{
    const apps = item.applications || {}
    Object.keys(apps).forEach(nomApp=>{
      const app = item.applications[nomApp]
      applications.push({nom: nomApp, app, noeud: item})
    })
  })

  applications.sort((a,b)=>{
    const nomA = a.nom,
          nomB = b.nom,
          noeudIdA = a.noeud.noeud_id,
          noeudIdB = b.noeud.noeud_id

    let resultat = nomA.localeCompare(nomB)
    if(resultat !== 0) return resultat

    return noeudIdA.localeCompare(noeudIdB)  // S'assurer tri stable
  })

  return applications.map((item, idx)=>{
    const nom = item.nom
    return (
      <Row key={idx}>
        <Col>{nom}</Col>
      </Row>
    )
  })
}


function BackupOperation(props) {

  const connexion = props.workers.connexion,
        domaines = props.domaines,
        setDomaines = props.setDomaines

  const [urlServeur, setUrlServeur] = useState('')
  const [domaineSelectionne, setDomaineSelectionne] = useState('')

  const lancerBackup = useCallback(async event => {
    console.debug("Lancer backup snapshot, domaines : %O", domaines)

    try {
      // Reset rapport en memoire
      const domainesMaj = domaines.map(item=>{
        return {...item, err: '', pctProgres: 0, status: '', rapport: ''}
      })
      setDomaines(domainesMaj)

      const uuid_rapport = ''+uuidv1()
      const reponse = await connexion.lancerBackupSnapshot({uuid_rapport, urlServeur, domaine: domaineSelectionne})
      console.debug("Reponse backup snaphshot : %O", reponse)
    } catch(err) {
      console.error("Erreut lancement backup : %O", err)
    }
  }, [connexion, urlServeur, domaines, domaineSelectionne, setDomaines])

  const resetBackup = useCallback(()=>{
    console.debug("Reset backup %O", domaineSelectionne)
    connexion.resetBackup({domaine: domaineSelectionne})
  }, [connexion, domaineSelectionne])

  return (
    <>
      <h1>Backup</h1>

      <Form.Group as={Row}>
        <Form.Label column xs={12} md={3}>URL serveur backup</Form.Label>
        <Col xs={12} md={9}>
          <Form.Control type="url"
                        value={urlServeur}
                        onChange={event=>{setUrlServeur(event.currentTarget.value)}}
                        placeholder="Ex: https://fichiers:443" />
        </Col>
      </Form.Group>
      <Form.Group as={Row}>
        <Form.Label column xs={12} md={3}>Domaine</Form.Label>
        <Col xs={12} md={9}>
          <Form.Control as="select"
                        value={domaineSelectionne}
                        onChange={event=>{setDomaineSelectionne(event.currentTarget.value)}}>
            <option value=''>Tous les domaines</option>
            <OptionsDomaines domaines={domaines} />
          </Form.Control>
        </Col>
      </Form.Group>

      <Row>
        <Col>
          <Button onClick={lancerBackup} disabled={!props.modeProtege}>Backup</Button>
          <Button onClick={props.changerOperation} variant="secondary">Retour</Button>
        </Col>
      </Row>

      <h2>Domaines</h2>
      <AfficherDomaines domaines={props.domaines}
                        rapport={props.rapport} />

      <h2>Applications</h2>
      <AfficherApplications noeuds={props.noeuds} />

      <h2>Reset</h2>

      <Row>
        <Col>
          Reset backup du domaine : {domaineSelectionne?domaineSelectionne:'Tous les domaines'}
        </Col>
      </Row>

      <Row>
        <Col>
          <Button variant="danger" onClick={resetBackup}>!!! RESET !!!</Button>
        </Col>
      </Row>

    </>
  )

}

function RestaurerOperation(props) {

  const connexion = props.workers.connexion,
        domaines = props.domaines,
        setDomaines = props.setDomaines

  const [urlServeur, setUrlServeur] = useState('')
  const [domaineSelectionne, setDomaineSelectionne] = useState('')
  const [verifier, setVerifier] = useState(false)

  const togglerVerifier = useCallback(_=>{setVerifier(!verifier)}, [verifier])

  const lancerRestoration = useCallback(async event => {
    console.debug("Lancer restoration domaines : %O", domaines)

    try {
      // Reset rapport en memoire
      const domainesMaj = domaines.map(item=>{
        return {...item, err: '', pctProgres: 0, status: '', rapport: ''}
      })
      setDomaines(domainesMaj)

      const uuid_rapport = ''+uuidv1()
      // const reponse = await connexion.lancerBackupSnapshot({uuid_rapport, urlServeur, domaine: domaineSelectionne})
      // console.debug("Reponse backup snaphshot : %O", reponse)
      const reponse = await connexion.restaurationDomaines({
        domaine: domaineSelectionne,
        url_serveur: urlServeur,
        verifier,
      })
      console.debug("Reponse restaurer domaines : %O", reponse)
    } catch(err) {
      console.error("Erreut lancement backup : %O", err)
    }
  }, [connexion, urlServeur, domaines, verifier, domaineSelectionne, setDomaines])

  const regenerationDomaine = useCallback(()=>{
    const domaine = domaineSelectionne || 'global'
    const domaineAction = domaine + '.' + 'regenerer'
    console.debug("Regenerer domaine %s", domaineAction)
    connexion.regenererDomaine(domaineAction)
      .then(reponse=>{
        console.debug("Reponse regenerer : %O", reponse)
      })
      .catch(err=>{console.error("Erreur demande regeneration %O", err)})
  }, [connexion, domaineSelectionne, urlServeur])

  return (
    <>
      <h1>Restoration</h1>

      <Form.Group as={Row}>
        <Form.Label column xs={12} md={3}>URL serveur backup</Form.Label>
        <Col xs={12} md={9}>
          <Form.Control type="url"
                        value={urlServeur}
                        onChange={event=>{setUrlServeur(event.currentTarget.value)}}
                        placeholder="Ex: https://fichiers:443" />
        </Col>
      </Form.Group>
      <Form.Group as={Row}>
        <Form.Label column xs={12} md={3}>Domaine</Form.Label>
        <Col xs={12} md={9}>
          <Form.Control as="select"
                        value={domaineSelectionne}
                        onChange={event=>{setDomaineSelectionne(event.currentTarget.value)}}>
            <option value=''>Tous les domaines</option>
            <OptionsDomaines domaines={domaines} />
          </Form.Control>
        </Col>
      </Form.Group>

      <Form.Group as={Row}>
        <Form.Label for="flag_verifier" column xs={12} md={3}>Verification seulement</Form.Label>
        <Col xs={12} md={9}>
          <Form.Check checked={verifier?true:false}
                      onChange={togglerVerifier}
                      id="flag_verifier" />
          </Col>
      </Form.Group>

      <Row>
        <Col>
          <Button onClick={lancerRestoration} disabled={!props.modeProtege}>Restorer</Button>
          <Button onClick={regenerationDomaine} variant="secondary" disabled={!props.modeProtege}>Regenerer</Button>
          <Button onClick={props.changerOperation} variant="secondary">Retour</Button>
        </Col>
      </Row>

      <h2>Domaines</h2>
      <AfficherDomaines domaines={props.domaines}
                        rapport={props.rapport} />

      <h2>Applications</h2>
      <AfficherApplications noeuds={props.noeuds} />

    </>
  )

}

function OptionsDomaines(props) {
  if(!props.domaines) return ''

  return props.domaines.map((item, idx)=>{
    return (
      <option key={item.domaine} value={item.domaine}>
        {item.domaine}
      </option>
    )
  })

}

function majEtatBackupDomaine(dict, message) {
  dict.action = message.evenement
  if(message.info && message.info.err) {
    dict.err = message.info.err
    dict.echec = true
    dict.actif = false
    console.error("Erreur traitement : %O", message)
  } else if(['backupHoraireTermine', 'backupSnapshotTermine', 'backupApplicationTermine'].includes(message.evenement)) {
    dict.complete = true
    dict.actif = false
  } else {
    dict.actif = true
  }
  return dict
}

function traiterMessage(connexion, contexte, setters, msg) {
  const message = msg.message || {},
        domaine = message.domaine,
        evenement = message.evenement,
        nomApplication = message.nom_application

  if(nomApplication) {
    traiterMessageApplication(nomApplication, contexte.noeuds, evenement, message, setters.setNoeuds)
  } else if(domaine) {
    traiterMessageDomaine(domaine, contexte.domaines, evenement, message, setters.setDomaines)
  }

}

function traiterMessageDomaine(domaine, domaines, evenement, message, setDomaines) {
  console.debug("Recu message %s %s %O", domaine, evenement, message)

  let pctProgres = 0,
      etat = evenement
  switch(evenement) {
    case 'backupHoraireDebut': pctProgres = 1; etat = 'Debut'; break
    case 'backupHoraireTermine': pctProgres = 100; etat = ''; break
    case 'backupHoraireErreur': pctProgres = 0; etat = 'Erreur'; break

    case 'debutRegeneration': pctProgres = 1; etat = 'Debut'; break
    case 'regenerationTerminee': pctProgres = 100; etat = ''; break
    case 'erreurRegeneration': pctProgres = 0; etat = 'Erreur'; break

    case 'debut_restauration': pctProgres = 1; etat = 'Debut'; break
    case 'restaurationTerminee': pctProgres = 100; etat = ''; break
    case 'erreurRestauration': pctProgres = 0; etat = 'Erreur'; break

    default:
      pctProgres = ''
  }

  const domainesMaj = domaines.map(item=>{
    if(item.domaine === domaine) {
      console.debug("Maj domaine %O", item)
      // const rapport = {...item.rapport, etat: evenement}
      const info = message.info || {}
      const err = info.err || message.err
      return {...item, etat, pctProgres, err}
    }
    return item
  })
  setDomaines(domainesMaj)
}

function traiterMessageApplication(nomApplication, noeuds, evenement, message, setNoeuds) {
  console.debug("Recu message %s %s %O", nomApplication, evenement, message)
}
