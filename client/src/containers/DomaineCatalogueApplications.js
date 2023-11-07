import React, {useEffect, useState, useCallback} from 'react'
import { Row, Col, Form, InputGroup, Button, FormControl, Alert } from 'react-bootstrap'
import Dropzone from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import useWorkers, { useEtatPret } from '../WorkerContext'

function ParametresCataloguesApplications(props) {

  const { workers, etatAuthentifie, fermer } = props
  const connexion = workers.connexion

  const { t } = useTranslation()

  const [catalogueApplications, setCatalogueApplications] = useState('')
  const [applicationSelectionne, setApplicationSelectionnee] = useState('')

  const handlerErreur = useCallback((err, message)=>{
    console.error('%s Erreur : %O', message, err)
  }, [])

  const refresh = useCallback(()=>{
    chargerCatalogueApplications(connexion)
      .then(setCatalogueApplications)
      .catch(err=>handlerErreur(err, 'ParametresCataloguesApplications chargerCatalogueApplications'))
  }, [connexion, setCatalogueApplications])

  const fermerApplicationHandler = useCallback(()=>setApplicationSelectionnee(''), [setApplicationSelectionnee])

  useEffect(refresh, [refresh])

  return (
    <div>
      <Row>
          <Col xs={10} md={11}>
              <h2>{t('DomaineCatalogueApplications.titre')}</h2>
          </Col>
          <Col xs={2} md={1} className="bouton">
              <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
          </Col>
      </Row>

      <FormulaireAjout 
        workers={workers}
        etatAuthentifie={etatAuthentifie}
        refresh={refresh} />

      <hr />

      {applicationSelectionne?
        <ListeVersionsApplication value={applicationSelectionne} fermer={fermerApplicationHandler} />
      :
        <ListeApplications liste={catalogueApplications} onSelect={setApplicationSelectionnee} />
      }

      
    </div>
  )
}


// class ParametresCataloguesApplications extends React.Component {

//   state = {
//     catalogueApplications: '',
//   }

//   componentDidMount() {
//     this.refresh()
//   }

//   refresh = _ => {
//     const wsa = this.props.workers.connexion
//     chargerCatalogueApplications(wsa, state=>{this.setState(state)})
//   }

//   render() {
//     const etatConnexion = this.props.etatConnexion,
//           connexion = this.props.workers.connexion

//     return (
//       <>
//         <h1>Catalogues d'applications</h1>

//         <Button variant="secondary" onClick={this.props.fermer}>Retour</Button>
//         <FormulaireAjout workers={this.props.workers}
//                          etatAuthentifie={this.props.etatAuthentifie}
//                          refresh={this.refresh} />

//         <hr />

//         <ListeApplications liste={this.state.catalogueApplications} />

//       </>
//     )
//   }
// }

export default ParametresCataloguesApplications

function ListeApplications(props) {
  const { liste, onSelect } = props

  const onSelectHandler = useCallback(e=>{
    const value = e.currentTarget.value
    onSelect(value)
  }, [onSelect])

  if(liste) {
    const listeElems = liste.map(item=>{
      return <InfoApplication key={item.nom} application={item} onSelect={onSelect?onSelectHandler:null} />
    })

    return (
      <>
        <Row>
          <Col xs={4} lg={3}>Nom application</Col>
          <Col xs={1}>Securite</Col>
          <Col xs={2}>Version</Col>
          <Col xs={6} lg={7}>Images</Col>
        </Row>
        {listeElems}
      </>
    )

  }
  return ''
}

function InfoApplication(props) {

  const { application, onSelect } = props

  return (
    <Row>
      <Col xs={4} lg={3}>
        {onSelect?
          <Button variant="link" onClick={onSelect} value={application.nom}>
            {application.nom}
          </Button>
        :
          <span>{application.nom}</span>
        }
      </Col>
      <Col xs={1}>
        {application.securite}
      </Col>
      <Col xs={2}>
        <div>{application.version}</div>
      </Col>
      <Col xs={5} lg={6}>
        <InfoApplicationImages value={application.dependances} />
      </Col>
    </Row>
  )
}

function InfoApplicationImages(props) {
  const { value } = props

  if(!value || value.length === 0) return <span>N/A</span>

  if(value.length === 1) {
    const catalogue = value[0]
    if(!catalogue.image) return <span>N/A</span>
    return <span className="liste-dependances">{catalogue.image}</span>
  }

  return (
    <ul>
      {value.map(catalogue=>{
        return (
          <li>
            <Row key={catalogue.name}>
              <Col xs={12}>{catalogue.name}</Col>
              <Col xs={12} className='liste-dependances'>{catalogue.image}</Col>
            </Row>
            </li>
        )
      })}
    </ul>
  )

  return value.map(catalogue=>{
  })
}

async function chargerCatalogueApplications(wsa) {
  console.debug("Charger catalogue applications")
  var reponse = await wsa.getCatalogueApplications()

  console.debug("chargerCatalogueApplications Reponse ", reponse)
  const catalogueApplications = reponse.resultats

  // Trier liste
  catalogueApplications.sort( (a,b) => { return a.nom.localeCompare(b.nom) } )

  console.debug("Catalogue applications charge : %O", catalogueApplications)

  return catalogueApplications
}

class FormulaireAjout extends React.Component {

  state = {
    json: '',
    erreur: '',
    confirmation: '',
  }

  // changerChamp = event => {
  //   const {name, value} = event.currentTarget
  //   this.setState({[name]: value})
  // }

  // upload = acceptedFiles => {
  //   acceptedFiles.forEach(item=>{
  //     console.debug("Process catalogue : %O", item)
  //   })
  // }

  // soumettre = async event => {
  //   try {
  //     this.setState({erreur: '', confirmation: ''})
  //     const transaction = JSON.parse(this.state.json)
  //     console.debug("Soumettre configuration : %O", transaction)

  //     const connexionWorker = this.props.workers.connexion
  //     const reponse = await connexionWorker.commandeSoumettreCatalogueApplication({catalogue: transaction})
  //     console.debug("Reponse : %O", reponse)

  //     this.setState({erreur: '', confirmation: true}, _=>{
  //       this.props.refresh()
  //     })

  //   } catch(err) {
  //     this.setState({erreur: ''+err, confirmation: ''})
  //   }
  // }

  rechargerCatalogues = async event => {
    try {
      this.setState({erreur: '', confirmation: ''})
      const connexionWorker = this.props.workers.connexion
      const reponse = await connexionWorker.commandeTransmettreCatalogues()
      console.debug("Reponse : %O", reponse)

      this.setState({erreur: '', confirmation: true}, _=>{
        this.props.refresh()
      })

    } catch(err) {
      this.setState({erreur: ''+err, confirmation: ''})
    }
  }

  clearErr = _ => {this.setState({err: ''})}
  clearConfirmation = _ => {this.setState({confirmation: ''})}

  render() {

    return (
      <>
        <Alert variant="danger" show={this.state.erreur!==''} onClose={this.clearErr} dismissible>
          {this.state.erreur}
        </Alert>
        <Alert variant="success" show={this.state.confirmation!==''} onClose={this.clearConfirmation} dismissible>
          OK
        </Alert>

        <Form>
          <Row>
            <Col>
              <Button variant="primary" onClick={this.rechargerCatalogues} disabled={!this.props.etatAuthentifie}>
                Recharger
              </Button>
            </Col>
          </Row>
        </Form>
      </>
    )
  }
}

function ListeVersionsApplication(props) {

  const { value: nomApplication, fermer } = props

  const workers = useWorkers()

  const [liste, setListe] = useState('')

  useEffect(()=>{
    console.debug("Charger liste des versions de l'application %s", nomApplication)
    workers.connexion.requeteVersionsApplications({nom: nomApplication})
      .then(reponse=>{
        console.debug("Reponse versions application ", reponse)
        setListe(reponse.resultats)
      })
      .catch(err=>console.error("Erreur chargement versions catalogue : ", err))
  }, [nomApplication, setListe])


  return (
    <div>
      <p>Application {nomApplication}</p>

      <Button onClick={fermer}>Fermer</Button>

      <p>Versions</p>

      <ListeApplications liste={liste} />
    </div>
  )
}
