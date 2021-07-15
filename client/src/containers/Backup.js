import React, {useState, useEffect, useCallback} from 'react';
import { Row, Col, Button, Nav, Alert, Form } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import {proxy as comlinkProxy} from 'comlink'
import {v1 as uuidv1} from 'uuid'

import { DateTimeAfficher } from '../components/ReactFormatters'
import { chargerStatsTransactionsDomaines } from '../components/UtilDomaines'

const subscriptionsBackup = [
  'evenement.backup.backupTransaction',
  'evenement.backup.backupApplication',
]
const subscriptionsRestauration = [
  'evenement.backup.restaurationTransactions',
]
const subscriptionsFichiers = [
  'evenement.backup.restaurationFichiers',
]

export function Backup(props) {

  // refreshInterval = null  // Objet interval pour rafraichissement de l'ecran

  const [operation, setOperation] = useState('')
  const [domaines, setDomaines] = useState('')
  const [noeuds, setNoeuds] = useState('')

  const connexion = props.workers.connexion

  // state = {
  //   // operation: SommaireBackup,
  //   domaines: '',
  // }

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
    }
  }, [connexion, setDomaines, setNoeuds])

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
                 noeuds={noeuds} />
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

      <h2>Domaines</h2>
      <AfficherDomaines domaines={props.domaines} />

      <h2>Applications</h2>
      <AfficherApplications noeuds={props.noeuds} />
    </>
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

  return domaines.map((item, idx)=>{
    return (
      <Row key={idx}>
        <Col>{item.domaine}</Col>
      </Row>
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
          noeudIdA = a.noeud.noeudId,
          noeudIdB = b.noeud.noeudId

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

  // state = {
  //   etatBackupDomaine: {},
  //   etatBackupApplication: {},
  //   afficherDomaines: false,
  // }
  const [etatBackupDomaine, setEtatBackupDomaine] = useState({})
  const [etatBackupApplication, setEtatBackupApplication] = useState({})
  const [afficherDomaines, setAfficherDomaines] = useState(false)

  const connexion = props.workers.connexion

  useEffect(()=>{
    console.debug("Enregistrer routing keys : %O", subscriptionsBackup)
    // this.props.wsa.subscribe(subscriptionsBackup, this.traiterMessageEvenement, {exchange: ['3.protege']})
    return ()=>{
      console.debug("Retirer routing keys : %O", subscriptionsBackup)
      //this.props.wsa.unsubscribe(subscriptionsBackup, this.traiterMessageEvenement, {exchange: ['3.protege']})
    }
  }, [])

  // const traiterMessageEvenement = comlinkProxy(event => {
  //   console.debug("Message evenement backup %O", event)
  //   const message = event.message
  //   const {domaine, nom_application: application} = message
  //
  //   if(domaine) {
  //     var etatDomaine = this.state.etatBackupDomaine[domaine]
  //     if(!etatDomaine) etatDomaine = {}
  //     else etatDomaine = {...etatDomaine}  // Clone
  //     etatDomaine = majEtatBackupDomaine(etatDomaine, message)
  //     this.setState(
  //       {etatBackupDomaine: {...this.state.etatBackupDomaine, [domaine]: etatDomaine}},
  //       _=>{console.debug("State : %O", this.state)}
  //     )
  //   } else if(application) {
  //     var etatApplication = this.state.etatBackupApplication[application]
  //     if(!etatApplication) etatApplication = {}
  //     else etatApplication = {...etatApplication}  // Clone
  //     etatApplication = majEtatBackupDomaine(etatApplication, message)
  //     this.setState(
  //       {etatBackupApplication: {...this.state.etatBackupApplication, [application]: etatApplication}},
  //       _=>{console.debug("State : %O", this.state)}
  //     )
  //   }
  // })

  const lancerBackup = useCallback(async event => {
    console.debug("Lancer backup snapshot")
    setAfficherDomaines(true)
    setEtatBackupDomaine({})
    setEtatBackupApplication({})

    try {
      const uuid_rapport = ''+uuidv1()
      const reponse = await connexion.lancerBackupSnapshot({uuid_rapport})
      console.debug("Reponse backup snaphshot : %O", reponse)
    } catch(err) {
      console.error("Erreut lancement backup : %O", err)
    }
  }, [connexion, setAfficherDomaines, setEtatBackupDomaine, setEtatBackupApplication])

  var backupDomaines = ''
  if(etatBackupDomaine) {
    backupDomaines = (
      <>
        <hr/>
        <Alert show={afficherDomaines}
               variant="info"
               onClose={_=>{setAfficherDomaines(false)}}
               dismissible>

          <h2>Backup</h2>

          <h3>Domaines</h3>
          <AfficherDomainesBackup domaines={etatBackupDomaine}/>

          <h3>Applications</h3>
          <AfficherDomainesBackup domaines={etatBackupApplication}/>

        </Alert>
      </>
    )
  }

  return (
    <>
      <h1>Backup</h1>

      <Row>
        <Col>
          <Button onClick={lancerBackup} disabled={!props.modeProtege}>Backup</Button>
          <Button onClick={props.changerOperation} variant="secondary">Retour</Button>
        </Col>
      </Row>

      {backupDomaines}
    </>
  )

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

function AfficherDomainesBackup(props) {

  const domaines = props.domaines

  const listeDomaines = Object.keys(domaines)
  listeDomaines.sort((a,b)=>{return a.localeCompare(b)})

  const renderDomaines = listeDomaines.map(nomDomaine=>{
    const infoDomaine = domaines[nomDomaine]

    var err = ''
    if(infoDomaine.err) {
      err = (
        <Row key={nomDomaine+'_err'}>
          <Col md={5}></Col>
          <Col md={7}>{infoDomaine.err}</Col>
        </Row>
      )
    }

    return (
      <>
        <Row key={nomDomaine}>
          <Col md={1}></Col>
          <Col md={4}>{nomDomaine}</Col>
          <Col md={7}><AfficherEtatBackupDomaine etat={infoDomaine}/></Col>
        </Row>
        {err}
      </>
    )
  })

  return renderDomaines
}

function AfficherEtatBackupDomaine(props) {
  const etat = props.etat
  var infoEtat = <span>Pret</span>

  if(etat) {
    var icone = '', message = ''
    if(etat.actif) icone = <i className="fa fa-spinner fa-spin fa-fw"/>
    else if(etat.complete) icone = <i className="fa fa-check"/>
    else if(etat.echec) icone = <i className="fa fa-times"/>

    if(etat.echec || etat.err) {
      message = <span>Erreur de traitement</span>
    } else if(etat.complete) {
      message = <span>Traitement complete</span>
    } else if(['backupHoraireDebut', 'backupSnapshotDebut', 'backupApplicationDebut'].includes(etat.action)) {
      message = <span>Debut backup des transactions</span>
    } else if(['backupHoraireCataloguePret', 'backupSnapshotCataloguePret', 'backupApplicationCataloguePret'].includes(etat.action)) {
      message = <span>Catalogue pret</span>
    } else if(['backupHoraireUploadConfirme', 'backupSnapshotUploadConfirme', 'backupApplicationUploadConfirme'].includes(etat.action)) {
      message = <span>Upload backup complete</span>
    } else if(['backupHoraireTermine', 'backupSnapshotTermine', 'backupApplicationTermine'].includes(etat.action)) {
      message = <span>Backup termine</span>
    }

    infoEtat = (
      <>
        {icone}
        {message}
      </>
    )
  }

  return infoEtat
}

class RestaurerOperation extends React.Component {

  state = {
    restaurationMaitredescles: '',
    restaurationDomaines: '',
    afficherDomaines: false,
    restaurationGrosfichiers: '',
    hostnameFichiers: 'fichiers',  // Nom du serveur du noeud protege (interne)
    showParamsAvances: false,
  }

  componentDidMount() {
    console.debug("Enregistrer routing keys : %O", subscriptionsRestauration)
    this.props.wsa.subscribe(subscriptionsRestauration, this.traiterMessageEvenement, {exchange: ['3.protege']})
    this.props.wsa.subscribe(subscriptionsFichiers, this.traiterMessageEvenementFichiers, {exchange: ['3.protege']})
  }

  componentWillUnmount() {
    console.debug("Retirer routing keys : %O", subscriptionsRestauration)
    this.props.wsa.unsubscribe(subscriptionsRestauration, this.traiterMessageEvenement, {exchange: ['3.protege']})
    this.props.wsa.unsubscribe(subscriptionsFichiers, this.traiterMessageEvenementFichiers, {exchange: ['3.protege']})
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  restaurerCles = async event => {
    console.debug("Restaurer cles")
    this.setState({restaurationMaitredescles: {actif: true}})
    try {
      const reponse = await this.props.wsa.restaurationChargerCles({hostname_fichiers: this.state.hostnameFichiers})
      console.debug("Reponse restaurer cles : %O", reponse)
    } catch(err) {
      console.error("Erreur demarrage restaurerCles : %O", err)
      this.setState({restaurationMaitredescles: {actif: false, echec: true, err: ''+err}})
    }
  }

  restaurerDomaines = async event => {
    console.debug("Restaurer les domaines")
    this.setState({restaurationDomaines: {}})
    const reponse = await this.props.wsa.restaurationDomaines({hostname_fichiers: this.state.hostnameFichiers})
    console.debug("Reponse restaurer domaines : %O", reponse)
  }

  restaurerGrosfichiers = async event => {
    console.debug("Restaurer les grosfichiers")
    this.setState({restaurationGrosfichiers: {actif: true}})
    const reponse = await this.props.wsa.restaurationGrosfichiers({})
    console.debug("Reponse restaurer grosfichiers : %O", reponse)
  }

  traiterMessageEvenement = comlinkProxy(evenement => {
    console.debug("Evenement restauration recu : %O", evenement)
    const {message} = evenement

    if(this.state.restaurationMaitredescles && this.state.restaurationMaitredescles.actif && message.domaine === 'MaitreDesCles') {
      const restaurationMaitredescles = {...this.state.restaurationMaitredescles}
      majEtatRestaurationDomaine(restaurationMaitredescles, message)
      this.setState({restaurationMaitredescles})
    } else if(this.state.restaurationDomaines) {
      // Message de restauration globale
      const domaine = message.domaine
      var infoDomaine = this.state.restaurationDomaines[domaine]
      if(!infoDomaine) infoDomaine = {actif: true}
      else infoDomaine = {...infoDomaine}
      majEtatRestaurationDomaine(infoDomaine, message)
      const restaurationDomaines = {...this.state.restaurationDomaines, [domaine]: infoDomaine}
      this.setState({restaurationDomaines, afficherDomaines: true})
    }

  })

  traiterMessageEvenementFichiers = comlinkProxy(evenement => {
    console.debug("Evenement restauration fichier recu : %O", evenement)
  })

  showParamsAvances = event => {
    this.setState({showParamsAvances: true})
  }

  render() {

    var restaurerDomaines = ''
    if(this.state.restaurationDomaines) {
      restaurerDomaines = (
        <Alert show={this.state.afficherDomaines}
               variant="info"
               onClose={_=>{this.setState({afficherDomaines: false})}}
               dismissible>
          <h2>Domaines</h2>
          <AfficherDomainesDeRestauration domaines={this.state.restaurationDomaines}/>
        </Alert>
      )
    }

    return (
      <>
        <h1>Restaurer</h1>

        <ApercuRestauration restaurerCles={this.restaurerCles}
                            restaurerDomaines={this.restaurerDomaines}
                            restaurerGrosfichiers={this.restaurerGrosfichiers}
                            restaurationMaitredescles={this.state.restaurationMaitredescles} />

        <Row>
          <Col>
            <Button onClick={this.showParamsAvances}>Params avances</Button>
            <Button onClick={this.props.changerOperation}>Retour</Button>
          </Col>
        </Row>

        <hr />

        {restaurerDomaines}

        <ParamsAvances hostnameFichiers={this.state.hostnameFichiers}
                       show={this.state.showParamsAvances}
                       close={_=>{this.setState({showParamsAvances: false})}}
                       changerChamp={this.changerChamp} />

      </>
    )
  }

}

function ApercuRestauration(props) {

  return (
    <>
      <h2>Apercu de la restauration</h2>

      <Row>
        <Col md={5}>
          1. Identifier source de la restauration
        </Col>
        <Col md={4}>
          Aucune source identifiee
        </Col>
        <Col md={3}>
          <Button variant="secondary">Changer source</Button>
        </Col>
      </Row>

      <Row>
        <Col md={5}>
          2. Copier fichiers de la source vers le noeud protege
        </Col>
        <Col md={4}>
        </Col>
        <Col md={3}>
          <Button variant="secondary">Copier</Button>
        </Col>
      </Row>

      <Row>
        <Col md={5}>
          3. Recuperer les cles chiffrees
        </Col>
        <Col md={4}>
          <AfficherEtatRestorationDomaine etat={props.restaurationMaitredescles} />
        </Col>
        <Col md={3}>
          <Button variant="secondary" onClick={props.restaurerCles}>Lancer</Button>
        </Col>
      </Row>

      <Row>
        <Col md={5}>
          4. Rechiffrer les cles
        </Col>
        <Col md={4}>
        </Col>
        <Col md={3}>
          <Button variant="secondary">Lancer</Button>
        </Col>
      </Row>

      <Row>
        <Col md={5}>
          5. Restaurer la base de donnees
        </Col>
        <Col md={4}>
        </Col>
        <Col md={3}>
          <Button variant="secondary" onClick={props.restaurerDomaines}>Lancer</Button>
        </Col>
      </Row>

      <Row>
        <Col md={5}>
          6. Restaurer les fichiers
        </Col>
        <Col md={4}>
        </Col>
        <Col md={3}>
          <Button variant="secondary" onClick={props.restaurerGrosfichiers}>Lancer</Button>
        </Col>
      </Row>

      <Row>
        <Col md={5}>
          7. Redemarrer les applications privees
        </Col>
        <Col md={4}>
          Pret
        </Col>
        <Col md={3}>
          <Button variant="secondary">Redemarrer</Button>
        </Col>
      </Row>

      <Row>
        <Col md={5}>
          8. Redemarrer les applications publiques
        </Col>
        <Col md={4}>
          Pret
        </Col>
        <Col md={3}>
          <Button variant="secondary">Redemarrer</Button>
        </Col>
      </Row>

    </>
  )
}

function AfficherEtatRestorationDomaine(props) {
  const etat = props.etat
  var infoEtat = <span>Pret</span>

  if(etat) {
    var icone = '', message = ''
    if(etat.actif) icone = <i className="fa fa-spinner fa-spin fa-fw"/>
    else if(etat.complete) icone = <i className="fa fa-check"/>
    else if(etat.echec) icone = <i className="fa fa-times"/>

    if(etat.echec) {
      message = <span>Erreur de traitement</span>
    } if(etat.complete) {
      message = <span>Traitement complete</span>
    } else if(etat.action === 'debut_restauration') {
      message = <span>Restauration des transactions</span>
    } else if(etat.action === 'fin_restauration') {
      message = <span>Transactions restaurees</span>
    } else if(etat.action === 'debut_regeneration') {
      message = <span>Regeneration du domaine</span>
    } else if(etat.action === 'fin_regeneration') {
      message = <span>Regeneration des documents completee</span>
    }

    infoEtat = (
      <>
        {icone}
        {message}
      </>
    )
  }

  return infoEtat
}

function majEtatRestaurationDomaine(dict, message) {
  dict.action = message.action
  if(message.err) {
    dict.err = message.err
    dict.echec = true
    dict.actif = false
  }
  if(message.documents_regeneres) {
    dict.complete = true
    dict.actif = false
  }
  return dict
}

function AfficherDomainesDeRestauration(props) {

  const domaines = props.domaines

  const listeDomaines = Object.keys(domaines)
  listeDomaines.sort((a,b)=>{return a.localeCompare(b)})

  const renderDomaines = listeDomaines.map(nomDomaine=>{
    const infoDomaine = domaines[nomDomaine]

    return (
      <Row key={nomDomaine}>
        <Col md={1}></Col>
        <Col md={4}>{nomDomaine}</Col>
        <Col md={7}><AfficherEtatRestorationDomaine etat={infoDomaine}/></Col>
      </Row>
    )
  })

  return renderDomaines
}

function ParamsAvances(props) {

  return (
    <Alert variant="info" show={props.show} onClose={props.close} dismissible>
      <Form.Group controlId="hostnameFichiers">
        <Form.Label>Hostname serveur consignation fichiers interne</Form.Label>
        <Form.Control type="text" name="hostnameFichiers" value={props.hostnameFichiers} onChange={props.changerChamp}/>
      </Form.Group>
    </Alert>
  )
}
