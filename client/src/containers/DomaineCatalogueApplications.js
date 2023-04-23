import React, {useEffect, useState, useCallback} from 'react'
import { Row, Col, Form, InputGroup, Button, FormControl, Alert } from 'react-bootstrap'
import Dropzone from 'react-dropzone'
import { useTranslation } from 'react-i18next'

function ParametresCataloguesApplications(props) {

  const { workers, etatAuthentifie, fermer } = props
  const connexion = workers.connexion

  const { t } = useTranslation()

  const [catalogueApplications, setCatalogueApplications] = useState('')

  const handlerErreur = useCallback((err, message)=>{
    console.error('%s Erreur : %O', message, err)
  }, [])

  const refresh = useCallback(()=>{
    chargerCatalogueApplications(connexion)
      .then(setCatalogueApplications)
      .catch(err=>handlerErreur(err, 'ParametresCataloguesApplications chargerCatalogueApplications'))
  }, [connexion, setCatalogueApplications])

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

      <ListeApplications liste={catalogueApplications} />
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
  if(props.liste) {
    const liste = props.liste.map(item=>{
      return <InfoApplication key={item.nom} application={item} />
    })

    return (
      <>
        <Row>
          <Col md={4}>Nom application</Col>
          <Col md={1}>Version</Col>
          <Col md={7}>Images</Col>
        </Row>
        {liste}
      </>
    )

  }
  return ''
}

function InfoApplication(props) {

  const application = props.application

  const images = []
  for(let nomImage in application.images) {
    const infoImage = application.images[nomImage]
    images.push(
      <div key={nomImage + '.' + infoImage.version}>
        {nomImage}:{infoImage.version}
      </div>
    )
  }

  return (
    <Row>
      <Col md={4}>
        {application.nom}
      </Col>
      <Col md={1}>
        {application.version}
      </Col>
      <Col md={7}>
        {images}
      </Col>
    </Row>
  )
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

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  upload = acceptedFiles => {
    acceptedFiles.forEach(item=>{
      console.debug("Process catalogue : %O", item)
    })
  }

  soumettre = async event => {
    try {
      this.setState({erreur: '', confirmation: ''})
      const transaction = JSON.parse(this.state.json)
      console.debug("Soumettre configuration : %O", transaction)

      const connexionWorker = this.props.workers.connexion
      const reponse = await connexionWorker.commandeSoumettreCatalogueApplication({catalogue: transaction})
      console.debug("Reponse : %O", reponse)

      this.setState({erreur: '', confirmation: true}, _=>{
        this.props.refresh()
      })

    } catch(err) {
      this.setState({erreur: ''+err, confirmation: ''})
    }
  }

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
        <h3>Ajouter nouvelle version application</h3>

        <Alert variant="danger" show={this.state.erreur!==''} onClose={this.clearErr} dismissible>
          {this.state.erreur}
        </Alert>
        <Alert variant="success" show={this.state.confirmation!==''} onClose={this.clearConfirmation} dismissible>
          OK
        </Alert>

        <Form>

          <InputGroup>
            <FormControl as="textarea" name="json" value={this.state.json} onChange={this.changerChamp}/>
          </InputGroup>

          <Row>
            <Col>
              <Dropzone onDrop={this.upload}>
                {({getRootProps, getInputProps}) => (
                  <section className="uploadIcon">
                    <span {...getRootProps()}>
                      <input {...getInputProps()} />
                      <span className="fa fa-upload fa-2x"/>
                    </span>
                  </section>
                )}
              </Dropzone>

              <Button onClick={this.soumettre} disabled={!this.props.etatAuthentifie}>
                Soumettre
              </Button>
              <Button variant="secondary" onClick={this.refresh} disabled={!this.props.etatAuthentifie}>
                Refresh
              </Button>
              <Button variant="secondary" onClick={this.rechargerCatalogues} disabled={!this.props.etatAuthentifie}>
                Recharger
              </Button>
            </Col>
          </Row>
        </Form>
      </>
    )
  }
}
