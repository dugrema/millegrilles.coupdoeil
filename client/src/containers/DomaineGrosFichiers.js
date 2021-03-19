import React from 'react'
import { Row, Col, Alert, Button, ProgressBar } from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

const RK_EVENEMENTS = [
  'evenement.fichiers.publicAwsS3'
]


export class ParametresGrosFichiers extends React.Component {

  state = {
    confirmation: '',
    erreur: '',
    uploadsEnCours: '',
    nomNoeudParId: '',
  }

  componentDidMount() {
    console.debug("PROPPYS : %O", this.props)
    const wsa = this.props.rootProps.websocketApp

    wsa.subscribe(RK_EVENEMENTS, this.processMessageEvenement, {exchange: ['3.protege']})

    wsa.getUploadsEnCours().then(uploadsEnCours=>{
      console.debug("Document uploads en cours : %O", uploadsEnCours)
      this.setState({uploadsEnCours: uploadsEnCours.upload_list})
    }).catch(err=>{console.error("Erreur chargement uploads en cours : %O", err)})

    wsa.requeteListeNoeuds({}).then(noeuds=>{
      console.debug("Noeuds recus : %O", noeuds)
      const nomNoeudParId = {}
      noeuds.forEach(item=>{
        nomNoeudParId[item.noeud_id] = item.domaine || item.fqdn_detecte || item.noeud_id
      })
      this.setState({nomNoeudParId}, _=>{console.debug("State : %O", this.state)})
    }).catch(err=>{console.error("Erreur chargement liste noeuds : %O", err)})
  }

  componentWillUnmount() {
    const wsa = this.props.rootProps.websocketApp
    wsa.unsubscribe(RK_EVENEMENTS, this.processMessageEvenement, {exchange: ['3.protege']})
  }

  processMessageEvenement = comlinkProxy(evenement => {
    const message = evenement.message
    // console.debug("Message evenement : %O", message)
    const etat = message.etat,
          progres = message.progres,
          noeud_id = message.noeud_id,
          fuuid = message.fuuid,
          derniere_activite = message['en-tete'].estampille

    if(etat === 'debut') {

      // Verifier si le fichier existe dans la liste
      var fichierTrouve = false
      var uploadsEnCours = this.state.uploadsEnCours.map(item=>{
        if(item.fuuid === fuuid && item.noeud_id === noeud_id) {
          fichierTrouve = true
          return {...item, etat, progres}
        } else return item
      })
      if(!fichierTrouve) {
        // // Ajouter nouveau fichier a la liste
        // const fichier = { derniere_activite, etat, fuuid, noeud_id, progres }
        // uploadsEnCours = [...uploadsEnCours, fichier]

        // Il manque un fichier - recharger la liste complete
        const wsa = this.props.rootProps.websocketApp
        wsa.getUploadsEnCours().then(uploadsEnCours=>{
          console.debug("Document uploads en cours : %O", uploadsEnCours)
          this.setState({uploadsEnCours: uploadsEnCours.upload_list})
        }).catch(err=>{console.error("Erreur chargement uploads en cours : %O", err)})

      }
      this.setState({uploadsEnCours})

    } else if(etat === 'echec') {
      const uploadsEnCours = this.state.uploadsEnCours.map(item=>{
        if(item.fuuid === fuuid && item.noeud_id === noeud_id) {
          return {...item, etat, progres}
        } else return item
      })
      this.setState({uploadsEnCours})
    } else if(progres > 0) {
      const uploadsEnCours = this.state.uploadsEnCours.map(item=>{
        if(item.fuuid === fuuid && item.noeud_id === noeud_id) {
          return {...item, etat, progres}
        } else return item
      })
      this.setState({uploadsEnCours})
    }
  })

  regenererPreviews = async event => {
    console.debug("Regenerer previews")
    const wsa = this.props.rootProps.websocketApp
    const reponse = await wsa.regenererPreviews()
    console.debug("Regenerer previews reponse : %O", reponse)
    this.setState({confirmation: 'Commande de regeneration des previews transmise.'})
  }

  fermerSuccess = _ => {
    this.setState({confirmation: ''})
  }

  fermerErreur = _ => {
    this.setState({erreur: ''})
  }

  clearFichier = async infoFichier => {
    const {noeud_id, fuuid} = infoFichier
    console.debug("Supprimer noeudId: %s, fuuid: %s", noeud_id, fuuid)

    var commande = {noeud_id, fuuid}
    // const signateurTransaction = this.props.rootProps.signateurTransaction
    // signateurTransaction.preparerTransaction(commande, 'GrosFichiers.clearFichierPublie')
    const domaineAction = 'GrosFichiers.clearFichierPublie'
    const webWorker = this.props.rootProps.webWorker
    commande = await webWorker.formatterMessage(commande, domaineAction)

    const wsa = this.props.rootProps.websocketApp
    try {
      const reponse = await wsa.clearFichierPublie(commande)
      console.debug("Reponse commande clear fichier publie : %O", reponse)
      if(reponse.resultats.ok === true) {
        this._retirerUpload(noeud_id, fuuid)
      }
    } catch(err) {
      console.error("Erreur clear fichier : %O", err)
    }
  }

  _retirerUpload(noeud_id, fuuid) {
    // Supprimer le fichier de la liste
    const uploadsEnCours = this.state.uploadsEnCours.filter(item=>{
      return item.fuuid !== fuuid || item.noeud_id !== noeud_id
    })
    this.setState({uploadsEnCours})
  }

  uploadCollectionsPubliques = async _ => {
    console.debug("Upload collections publiques")
    // const commande = {}
    // const signateurTransaction = this.props.rootProps.signateurTransaction
    // signateurTransaction.preparerTransaction(commande, 'GrosFichiers.uploadCollectionsPubliques')
    const domaineAction = 'GrosFichiers.uploadCollectionsPubliques'
    const webWorker = this.props.rootProps.webWorker
    const commande = await webWorker.formatterMessage({}, domaineAction)

    const wsa = this.props.rootProps.websocketApp
    try {
      const reponse = await wsa.uploadCollectionsPubliques(commande)
      console.debug("Reponse commande upload collections publiques : %O", reponse)
      if(reponse.resultats.ok === true) {
        console.error("Erreur upload collections publiques : %O", reponse)
      }
    } catch(err) {
      console.error("Erreur upload collections publiques : %O", err)
    }
  }

  render() {
    return (
      <>
        <h1>Gros Fichiers</h1>

        <Alert variant="success" show={this.state.confirmation?true:false} onClose={this.fermerSuccess} dismissible>
          <Alert.Heading>Succes</Alert.Heading>
          {this.state.confirmation}
        </Alert>

        <Row>
          <Col>
            <Button onClick={this.regenererPreviews}
                    variant="secondary"
                    disabled={!this.props.rootProps.modeProtege}>
              Regenerer previews
            </Button>
            <Button onClick={this.uploadCollectionsPubliques}
                    variant="secondary"
                    disabled={!this.props.rootProps.modeProtege}>
              Upload collections publiques
            </Button>
          </Col>
        </Row>

        <UploadsEnCours rootProps={this.props.rootProps}
                        uploadsEnCours={this.state.uploadsEnCours}
                        nomNoeudParId={this.state.nomNoeudParId}
                        clearFichier={this.clearFichier} />
      </>
    )
  }
}

function UploadsEnCours(props) {

  if( ! props.uploadsEnCours ) return ''

  const uploads = props.uploadsEnCours.map(item=>{
    const key = item.noeud_id + '/' + item.fuuid
    return <UploadEnCours key={key}
                          rootProps={props.rootProps}
                          nomNoeudParId={props.nomNoeudParId}
                          infoFichier={item}
                          clearFichier={props.clearFichier} />
  })

  return (
    <>
      <h2>Uploads publics en cours</h2>
      {uploads}
    </>
  )

}

class UploadEnCours extends React.Component {

  state = {
    nomFichier: '',
    clearEnCours: false,
  }

  componentDidMount() {
    const wsa = this.props.rootProps.websocketApp
    const fuuid = this.props.infoFichier.fuuid
    wsa.getDocumentParFuuid({fuuid}).then(fichier=>{
      // console.debug("Info fichier : %O", fichier)
      const nomFichier = fichier.titre?fichier.titre.fr:fichier.nom_fichier
      this.setState({nomFichier})
    }).catch(err=>{console.warn("Erreur chargement info fichier %s : %O", fuuid, err)})
  }

  clearFichier = event => {
    this.setState({clearEnCours: true})
    this.props.clearFichier(this.props.infoFichier)
  }

  render() {
    const item = this.props.infoFichier

    const noeudId = item.noeud_id, fuuid = item.fuuid
    var nomNoeud = noeudId
    if(this.props.nomNoeudParId) {
      nomNoeud = this.props.nomNoeudParId[noeudId] || noeudId
    }
    var nomFichier = this.state.nomFichier || item.fuuid

    var progres = null
    if(item.etat === 'succes') {
      progres = <ProgressBar now={100} label='Termine' variant="success" />
    } else if(item.etat === 'echec') {
      progres = <ProgressBar now={100} label='Echec' variant="danger" />
    } else if(item.progres > 0) {
      progres = <ProgressBar now={item.progres} label={item.progres+'%'} animated />
    } else if(item.progres === 0) {
      progres = <ProgressBar now={0} label="En attente" />
    }

    const key = noeudId+'/'+fuuid

    return (
      <Row>
        <Col xs={3} md={1}>
          <Button variant="secondary"
                  onClick={this.clearFichier}
                  value={key}
                  disabled={!this.props.rootProps.modeProtege || this.state.clearEnCours}>
            <i className="fa fa-close" />
          </Button>
        </Col>
        <Col xs={6} md={3}>{nomNoeud}</Col>
        <Col>{nomFichier}</Col>
        <Col xs={4} md={2}>
          {progres}
        </Col>
      </Row>
    )
  }

}
