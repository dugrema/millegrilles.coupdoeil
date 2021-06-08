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

  useEffect(_=>{
    chargerUsager(props.workers.connexion, {userId: props.userId}, setUsager)
  }, [])

  return (
    <>
      <h2>Usager</h2>

      <InformationUsager usager={usager}
                         workers={props.workers} />

      <AfficherActivationsUsager usager={usager}
                                 workers={props.workers} />

      <GestionWebauthn usager={usager}
                       workers={props.workers} />

    </>
  )
}

function InformationUsager(props) {
  return (
    <>
      <Row>
        <Col lg={3}>Nom usager</Col>
        <Col>{props.usager.nomUsager}</Col>
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

  const webauthn = props.usager.webauthn || []

  return (
    <>
      <h3>Authentification webauthn</h3>

      <Row>
        <Col lg={3}>Nombre autorisations</Col>
        <Col lg={3}>{webauthn.length}</Col>
        <Col>
          <Button variant="danger" disabled={webauthn.length===0}>Reset webauthn</Button>
        </Col>
      </Row>
    </>
  )
}

// class ActiverCSR extends React.Component {
//
//   state = {
//     appareils: '',  // videoinput doit etre dans la liste pour camera
//     modeScanQR: false,
//     modeCollerCSR: false,
//     data: '',
//     pem: '',
//     pemTextArea: '',
//     certificatOk: false,
//     err: '',
//   }
//
//   componentDidMount() {
//     detecterAppareilsDisponibles().then(apps=>{
//       console.debug("Apps detectees : %O", apps);
//       this.setState({appareils: apps})
//     })
//   }
//
//   activerScanQr = _ => {this.setState({modeScanQR: true})}
//   fermerScanQr = _ => {this.setState({modeScanQR: false})}
//   erreurScanQr = event => {console.error("Erreur scan QR: %O", event); this.fermerScanQr()}
//
//   activerCollerCSR = _=> {this.setState({modeCollerCSR: true})}
//
//   handleScan = async data => {
//     this.setState({data}, _=>{ this.traiterCsr() })
//   }
//
//   traiterCsr() {
//     console.debug("State : %O", this.state)
//
//     // Convertir data en base64, puis ajouter header/footer CSR
//     const dataB64 = btoa(this.state.data)
//     const pem = `-----BEGIN CERTIFICATE REQUEST-----\n${dataB64}\n-----END CERTIFICATE REQUEST-----`
//
//     // Verifier avec nodeForge
//     try {
//       const csrForge = forgePki.certificationRequestFromPem(pem)
//       const nomUsager = csrForge.subject.getField('CN').value
//
//       if(this.props.rootProps.nomUsager !== nomUsager) {
//         throw new Error(`Nom usager ${nomUsager} du code QR ne correspond pas a votre compte actuel`)
//       }
//
//       this.setState({data: '', err: '', pem, nomUsager, modeScanQR: false})
//     } catch(err) {
//       this.setState({err})
//     }
//   }
//
//   setPemTextArea = event => {
//     const pem = event.currentTarget.value
//     this.setState({pemTextArea: pem})
//
//     if(!pem) return
//
//     // Valider le contenu
//     try {
//       const csrForge = forgePki.certificationRequestFromPem(pem)
//       const nomUsager = csrForge.subject.getField('CN').value
//
//       if(this.props.rootProps.nomUsager !== nomUsager) {
//         throw new Error(`Nom usager ${nomUsager} du code QR ne correspond pas a votre compte actuel`)
//       }
//
//       this.setState({data: '', err: '', pem, nomUsager, modeCollerCSR: false})
//     } catch(err) {
//       console.error("Erreur PEM : %O", err)
//     }
//
//   }
//
//   activer = async _ => {
//     const cw = this.props.rootProps.connexionWorker
//     const nomUsager = this.props.rootProps.nomUsager
//
//     const requeteGenerationCertificat = {
//       nomUsager,
//       csr: this.state.pem,
//       activationTierce: true,  // Flag qui indique qu'on active manuellement un certificat
//     }
//     console.debug("Requete generation certificat navigateur: \n%O", requeteGenerationCertificat)
//
//     try {
//       const reponse = await cw.genererCertificatNavigateur(requeteGenerationCertificat)
//       console.debug("Reponse cert recue %O", reponse)
//       // var {cert: certificatNavigateur, fullchain} = reponse
//       if(reponse && !reponse.err) {
//         this.setState({pem: '', err: '', certificatOk: true})
//       } else {
//         this.setState({pem: '', err: "Erreur reception confirmation d'activation"})
//       }
//     } catch(err) {
//       console.error("Erreur activation CSR : %O", err)
//       this.setState({err})
//     }
//
//   }
//
//   render() {
//     var errStack = ''
//     if(this.err) {
//       errStack = <pre>this.err.stack</pre>
//     }
//
//     return (
//       <Container>
//         <h2>Activer code QR</h2>
//
//         <Alert variant="danger" show={this.err?true:false}>
//           <Alert.Heading>Erreur</Alert.Heading>
//           <p>{''+this.err}</p>
//           {errStack}
//         </Alert>
//
//         <p>
//           Cette page permet de copier ou scanner un code QR pour activer
//           votre compte sur un nouvel appareil.
//         </p>
//
//         <Row>
//           <Col>
//             <BoutonScan modeScanQR={this.state.modeScanQR}
//                         activerScanQr={this.activerScanQr}
//                         fermerScanQr={this.fermerScanQr} />
//           </Col>
//         </Row>
//
//         <QRCodeReader actif={this.state.modeScanQR}
//                       handleScan={this.handleScan}
//                       handleError={this.erreurScanQr} />
//
//         <Row>
//           <Col>
//             <CollerCSR afficherCollerCsr={this.state.modeCollerCSR}
//                        activerCollerCSR={this.activerCollerCSR}
//                        changerTexte={this.setPemTextArea}
//                        texte={this.state.pemTextArea} />
//           </Col>
//         </Row>
//
//         <Alert variant="info" show={this.state.pem?true:false}>
//           <Alert.Heading>Code QR pret</Alert.Heading>
//           <p>Le code QR correspond a l'usager {this.state.nomUsager}</p>
//           <p>
//             Si cette information est correcte, cliquez sur le bouton activer pour poursuivre.
//           </p>
//         </Alert>
//
//         <Alert variant="success" show={this.state.certificatOk}>
//           <Alert.Heading>Succes</Alert.Heading>
//           <p>
//             Vous pouvez maintenant cliquer sur Suivant avec votre autre appareil,
//             le compte est active.
//           </p>
//         </Alert>
//
//         <Row>
//           <Col className="button-list">
//             <Button onClick={this.activer} variant="primary">Activer</Button>
//             <Button onClick={this.props.revenir} variant="secondary">Annuler</Button>
//           </Col>
//         </Row>
//
//       </Container>
//     )
//   }
// }

// function BoutonScan(props) {
//   if(props.modeScanQR) {
//     return <Button onClick={props.fermerScanQr}>Arreter</Button>
//   } else {
//     return <Button onClick={props.activerScanQr}>Scan</Button>
//   }
// }

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
  console.debug("Activer CSR %O", csr)
  // Generer certificat - l'usager va pouvoir y acceder a son prochain login
  const cert = await connexionWorker.genererCertificatNavigateur({csr, nomUsager, userId})
  console.debug("Certificat genere : %O", cert)
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
e            <Button onClick={_activerCsr} disabled={csr?false:true}>Activer</Button>
          </Col>
        </Row>

      </Modal.Body>
    </Modal>
  )
}

function traiterCsr(pem, nomUsager) {
  // Convertir data en base64, puis ajouter header/footer CSR
  // let pem
  // if(typeof(csr) === 'string') {
  //   pem = csr
  // } else {
  //   const dataB64 = btoa(csr)
  //   pem = `-----BEGIN CERTIFICATE REQUEST-----\n${dataB64}\n-----END CERTIFICATE REQUEST-----`
  // }

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
