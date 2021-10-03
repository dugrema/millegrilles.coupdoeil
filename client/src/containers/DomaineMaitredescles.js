import React from 'react'
import { Row, Col, Form, InputGroup, Button, FormControl, Alert, ProgressBar } from 'react-bootstrap'
import Dropzone from 'react-dropzone'
import { pki as forgePki } from 'node-forge'
import multibase from 'multibase'

import { ChargementClePrivee } from './ChargementCle'
import { hacherCertificat } from '@dugrema/millegrilles.common/lib/hachage'
// import {verifierChaineCertificats} from '../components/traitementPki'

import { sauvegarderPrivateKeyToPEM, extraireExtensionsMillegrille } from '@dugrema/millegrilles.common/lib/forgecommon'
// import { CryptageAsymetrique, base64ToHexstring, bufferToBase64 } from '@dugrema/millegrilles.common/lib/cryptoSubtle'

// const cryptageAsymetrique = new CryptageAsymetrique()

const BATCH_NOMBRE_FETCH = 100       // Nombre cles downloadees a la fois

export class DomaineMaitredescles extends React.Component {

  state = {
    nombreClesRechiffrees: '',
    nombreClesNonDechiffrables: '',
  }

  updateEtatRechiffrage = (nombreClesRechiffrees, nombreClesNonDechiffrables) => {
    this.setState({nombreClesRechiffrees, nombreClesNonDechiffrables})
  }

  setClePrivee = async clePrivee => {
    // Cle privee est en format nodeforge. Recharger en mode subtle.
    // const clePriveeSubtle = await transformerClePriveeForgeVersSubtle(this.props.rootProps.webWorker, clePriveeForge)
    // this.setState({clePriveeSubtle}, _=>{console.debug("State apres cle privee : %O", this.state)})
    // this.props.rootProps.setCleMillegrille(clePriveeForge)
    const clePriveePem = sauvegarderPrivateKeyToPEM(clePrivee)
    await this.props.rootProps.chiffrageWorker.chargerCleMillegrilleSubtle(clePriveePem)
  }

  render() {
    if(!this.props.rootProps.modeProtege) {
      return (<p>Activer mode protege pour poursuivre.</p>)
    }

    var sectionRechiffrer = ''
    if(!this.state.nombreClesNonDechiffrables) {
      // Rien a faire
    } else if(!this.props.rootProps.cleMillegrilleChargee) {
      console.debug("Root props : %O", this.props.rootProps)
      sectionRechiffrer = <ChargementClePrivee setClePrivee={this.setClePrivee} />
    } else {
      sectionRechiffrer = (
        <>
          <p>Cle privee chargee OK</p>
        </>
      )
    }

    return (
      <>
        <h1>Maitre des cles</h1>

        {sectionRechiffrer}

        <RechiffrerCles wsa={this.props.workers.connexion}
                        modeProtege={this.props.rootProps.modeProtege}
                        idmg={this.props.rootProps.idmg}
                        cleMillegrilleChargee={this.props.rootProps.cleMillegrilleChargee}
                        nombreClesNonDechiffrables={this.state.nombreClesNonDechiffrables}
                        updateEtatRechiffrage={this.updateEtatRechiffrage}
                        webWorker={this.props.rootProps.chiffrageWorker}
                        workers={this.props.workers} />
      </>
    )
  }

}

function InformationClesNonChiffrees(props) {

  if(props.nombreClesNonDechiffrables === '') {
    return (
      <p>Verification nombre cles non dechiffrables ...</p>
    )
  } else if(props.nombreClesNonDechiffrables === 0) {
    return (
      <p>Toutes les cles sont accessibles.</p>
    )
  } else {

    var pctProgres = 100, label=''
    if(props.nombreClesRechiffrees >= 0) {
      pctProgres = Math.round(props.nombreClesRechiffrees / props.nombreClesNonDechiffrables * 100)
      label = pctProgres + '%'
    }

    var erreurs = ''
    if(props.nombreErreurs) {
      erreurs = (
        <Row>
          <Col md={2}>Nombre d'erreurs</Col>
          <Col>{props.nombreErreurs}</Col>
        </Row>
      )
    }

    return (
      <>
        <h2>Rechiffrer cles</h2>
        <Row>
          <Col md={3}>Rechiffrage cles</Col>
          <Col><ProgressBar now={pctProgres} label={label}/></Col>
          <Col md={3} className="alignement-droite">{props.nombreClesRechiffrees} / {props.nombreClesNonDechiffrables}</Col>
        </Row>
        {erreurs}
      </>
    )
  }

}

class RechiffrerCles extends React.Component {

  state = {
    nombreClesNonDechiffrables: '',
    pageRechiffrage: 0, // Numero de page/batch de rechiffrage
    clesCompletees: 0,

    clesNonDechiffrables: '',
    certificatRechiffrageForge: '',

    //  Cle: sha512_b64:... = {promise, retransmissions, confirmations, err}
    dictParHachage: {},

    confirmation: '',
    err: '',
  }

  componentDidMount() {
    this.verifierNombreClesNonDechiffrables()
    .then(this.chargerBatchCles)
  }

  verifierNombreClesNonDechiffrables = async _ => {
    console.debug("Verifier nombre de cles non dechiffrables")
    const wsa = this.props.wsa
    try {
      const reponseClesNonDechiffrables = await wsa.requeteCompterClesNonDechiffrables()
      console.debug("Reponse cles non dechiffrables : %O", reponseClesNonDechiffrables)
      this.setState({nombreClesNonDechiffrables: reponseClesNonDechiffrables.compte})
      this.props.updateEtatRechiffrage(0, reponseClesNonDechiffrables.compte)
    } catch(err) {
      console.error("Erreur verification cles non dechiffrables : %O", err)
    }

    let certMaitredescles = await wsa.getCertificatsMaitredescles()
    console.debug("Cert maitre des cles : %O", certMaitredescles)
    let certificatRechiffrage = certMaitredescles.certificat

    // Valider le certificat recu
    const webWorker = this.props.webWorker
    const certificatRechiffrageForge = await validerCertificatRechiffrage(
      webWorker, this.props.idmg, certificatRechiffrage)
    console.debug("Info certificat rechiffrage : %O", certificatRechiffrageForge)
    const fingerprintMaitrecles = await hacherCertificat(certificatRechiffrageForge)
    this.setState({
      certMaitredescles,
      certificatRechiffragePem: certificatRechiffrage,
      certificatRechiffrageForge,
      fingerprintMaitrecles
    })
  }

  clearErr = _ => {
    this.setState({err: ''})
  }

  chargerBatchCles = async (pageRechiffrage) => {
    if(!pageRechiffrage) pageRechiffrage = 0
    const wsa = this.props.wsa
    try {
      // var listeHachageIgnorer = Object.keys(this.state.dictParHachage).filter(item=>{
      //   const infoHachage = this.state.dictParHachage[item]
      //   // Ignorer toutes les cles en cours de traitement
      //   return infoHachage.promise || infoHachage.resultat || infoHachage.err
      // })

      // const pageRechiffrage = this.state.pageRechiffrage
      const reponseClesNonDechiffrables = await wsa.requeteClesNonDechiffrables(BATCH_NOMBRE_FETCH, pageRechiffrage)
      console.debug("Reponse cles non dechiffrables : %O", reponseClesNonDechiffrables)
      // this.setState({pageRechiffrage: pageRechiffrage+1})

      if(reponseClesNonDechiffrables.ok === false) {
        console.error("Erreur rechiffrage cles : %s", reponseClesNonDechiffrables.err)
        this.setState({err: reponseClesNonDechiffrables.err})
        return
      }

      // let certMaitredescles = await wsa.getCertificatsMaitredescles()
      // console.debug("Cert maitre des cles : %O", certMaitredescles)
      // let certificatRechiffrage = certMaitredescles.certificat
      //
      // // Valider le certificat recu
      // const webWorker = this.props.webWorker
      // const certificatRechiffrageForge = await validerCertificatRechiffrage(
      //   webWorker, this.props.idmg, certificatRechiffrage)
      // console.debug("Info certificat rechiffrage : %O", certificatRechiffrageForge)
      // const fingerprintMaitrecles = await hacherCertificat(certificatRechiffrageForge)

      await new Promise(resolve=>{
        this.setState({
          clesNonDechiffrables: reponseClesNonDechiffrables,
          // certificatRechiffrageForge,
          // certificatRechiffragePem: certificatRechiffrage,
          // fingerprintMaitrecles,
        }, _=>{
          console.debug("chargerBatchCles State : %O", this.state)
          resolve()
        })
      })
    } catch(err) {
      console.error("Erreur requete cles non dechiffrables : %O", err)
      this.setState({err: ''+err})
    }
  }

  demarrerRechiffrage = async event => {
    console.debug("Demarrer rechiffrage des cles pour idmg %s", this.props.idmg)

    // Nombre de pages a parcourir
    const nbPages = Math.ceil(this.state.nombreClesNonDechiffrables / BATCH_NOMBRE_FETCH)

    const webWorker = this.props.webWorker,
          fingerprintMaitrecles = this.state.fingerprintMaitrecles

    console.debug("Rechiffrage %d batch de %d, props : %O, state: %O", nbPages, BATCH_NOMBRE_FETCH, this.props, this.state)

    try {
      const clesRechiffrees = await rechiffrerCles(
        webWorker, this.state.clesNonDechiffrables.cles, this.state.certificatRechiffragePem)
      console.debug("Cles rechiffrees : %O", clesRechiffrees)

      for(let page=0; page < nbPages; page++) {
        console.debug("Rechiffrage page %d", page)
        if(page > 0) await this.chargerBatchCles(page) // Skip premiere batch, deja chargee
        let clesRechiffrees = await this.rechiffrer()
        console.debug("Cles rechiffrees : %O", clesRechiffrees)

        for(let infoCle in this.state.clesNonDechiffrables) {
          let hachage_bytes = infoCle.hachage_bytes
          let cleSecreteChiffree = clesRechiffrees[hachage_bytes]
          await traiterCle(webWorker, fingerprintMaitrecles, infoCle, cleSecreteChiffree)
        }
      }

    } catch(err) {
      console.error("Erreur traitement batch cles : %O", err)
    }

    console.debug("Rechiffrage Termine sur %d cles : %O", Object.keys(this.state.dictParHachage).length, this.state.dictParHachage)
    this.setState({confirmation: "Rechiffrage termine"})
  }

  rechiffrer = async _ => {
    const {wsa, webWorker} = this.props

    const clesRechiffrees = await rechiffrerCles(
      webWorker, this.state.clesNonDechiffrables.cles, this.state.certificatRechiffragePem)
    console.debug("Operation terminee, cles rechiffrees : %O", clesRechiffrees)

    // Associer information des cles a hachage_bytes pour retransmettre info
    const clesParHachage = this.state.clesNonDechiffrables.cles.reduce((accumulateur, item)=>{
      accumulateur[item.hachage_bytes] = {
        ...item,
        cleRechiffree: clesRechiffrees[item.hachage_bytes]
      }
      return accumulateur
    }, {})
    console.debug("Information cles par hachages : %O", clesParHachage)

    const hachages = Object.keys(clesRechiffrees)
    console.debug("Cles rechiffrees : %O", hachages)
    const dictPromises = {}
    for(let idx=0; idx<hachages.length; idx++) {
      const hachage_bytes = hachages[idx]
      const infoCle = clesParHachage[hachage_bytes]

      // Verifier si la cle a deja ete traitee
      var infoHachage = this.state.dictParHachage[hachage_bytes]
      if(infoHachage) {
        // Erreur, on a deja traite cette cle.
        infoHachage = {...infoHachage}  // Shallow copy
        infoHachage.err = "Cle completee et recue en batch a nouveau, on abandonne"
      } else if(infoCle) {
        // // Creer promise pour le traitement
        const cleRechiffree = clesRechiffrees[hachage_bytes]
        const fingerprint = this.state.fingerprintMaitrecles
        const promise = traiterCle(webWorker, fingerprint, infoCle, cleRechiffree)
        infoHachage = {promise, retransmissions: 0, confirmations: 0}
      } else {
        console.warn("Cle inconnue pour hachage %s", hachage_bytes)
        infoHachage = {err: 'Cle inconnue', retransmissions: 0, confirmations: 0}
      }
      dictPromises[hachage_bytes] = infoHachage

      if(infoHachage.promise) {
        // Ajouter traitement du resultat de rechiffrage
        infoHachage.promise = infoHachage.promise.then(commande=>{
          console.debug("Soumettre commande cle : %O", commande)
          return wsa.soumettreCleRechiffree(commande)
        }).then(reponse=>{
          const infoPromise = {...this.state.dictParHachage[hachage_bytes]}
          delete infoPromise.promise
          infoPromise.resultat = reponse
          this.setState({
            dictParHachage: {...this.state.dictParHachage, [hachage_bytes]: infoPromise}
          })

          // Completer traitement de la cle
          return {hachage_bytes}
        }).catch(err=>{
          console.error("Erreur traitement commande cle %O : %O", infoCle, err)

          const infoPromise = {...this.state.dictParHachage[hachage_bytes]}
          delete infoPromise.promise
          infoPromise.err = err
          this.setState({
            dictParHachage: {...this.state.dictParHachage, [hachage_bytes]: infoPromise}
          })

          return {hachage_bytes}
        }).finally(_=>{
          // S'assurer de retirer la promise de dictParHachage pour eviter
          // boucle sans fin
          console.debug("Finally de %s", hachage_bytes)
          if(this.state.dictParHachage[hachage_bytes].promise) {
            // La promise est encore en place, on la retire
            console.warn("Erreur nettoyage promise %s, suppression dans finally", hachage_bytes)
            const infoPromise = {...this.state.dictParHachage[hachage_bytes]}
            delete infoPromise.promise
            this.setState(
              {dictParHachage: {...this.state.dictParHachage, [hachage_bytes]: infoPromise}},
            )
          }
        })
      }

    }

    // Charger prochaine batch
    //await this.chargerBatchCles()
    //console.debug("Prochaine batch chargee")
    var derniereBatchDownloadee = Object.keys(dictPromises).length < BATCH_NOMBRE_FETCH
    const dictParHachage = {...this.state.dictParHachage, ...dictPromises}
    await new Promise(resolve=>{
      this.setState({
        dictParHachage,
        clesNonDechiffrables: '',  // On a traiter toutes les cles recues dans la bacth
        derniereBatchDownloadee,
      }, _=>{
        console.debug("Dict rechiffrage : %O", this.state.dictParHachage)
        resolve()
      })
    })
  }

  setNbClesCompletees = nbCompletees => {
    this.setState({nbCompletees})
  }

  render() {

    var compteClesCompletees = this.state.clesCompletees,
        compteErreurs = 0

    // Calcul stats
    if(this.state.dictParHachage) {
      const nbClesTraitees = Object.values(this.state.dictParHachage).filter(item=>{
        return item.resultat || item.complete || item.err
      })
      compteClesCompletees += nbClesTraitees.length

      const infoErreurs = Object.values(this.state.dictParHachage).filter(item=>{
        return item.err
      })
      compteErreurs = infoErreurs.length
    }

    return (
      <>
        <h2>Rechiffrer cles</h2>

        <Alert variant="danger" show={this.state.err!==''} onClose={this.clearErr} dismissible>
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{''+this.state.err}</p>
        </Alert>

        <Alert variant="success" show={this.state.confirmation!==''}>
          <Alert.Heading>Termine</Alert.Heading>
          <p>{''+this.state.confirmation}</p>
        </Alert>

        <InformationClesNonChiffrees nombreClesNonDechiffrables={this.state.nombreClesNonDechiffrables}
                                     nombreClesRechiffrees={compteClesCompletees}
                                     nombreErreurs={compteErreurs} />

        <div>

          <Button onClick={this.demarrerRechiffrage}
                  disabled={!this.props.modeProtege || this.state.confirmation || !this.props.cleMillegrilleChargee}>Rechiffrer</Button>
        </div>
      </>
    )
  }

}

async function validerCertificatRechiffrage(webWorker, idmg, certificatRechiffragePEM) {
  console.debug("Verifier certificat : %O", certificatRechiffragePEM)

  await webWorker.verifierCertificat(certificatRechiffragePEM)
  const certificatForge = forgePki.certificateFromPem(certificatRechiffragePEM)
  const extensions = extraireExtensionsMillegrille(certificatForge)
  console.debug("Certificat rechiffrage cles : %O\nExtensions: %O", certificatForge, extensions)

  // S'assurer que le certificat est le maitre des cles
  if( ! extensions.roles.includes('maitrecles') ) {
    throw new Error("Certificat de rechiffrage doit etre pour le maitre des cles")
  }
  if( ! extensions.niveauxSecurite.includes('3.protege') && ! extensions.niveauxSecurite.includes('4.secure') ) {
    throw new Error("Certificat de rechiffrage doit etre de niveau 3.protege ou 4.secure")
  }

  return certificatForge
}

async function traiterCle(webWorker, fingerprintMaitrecles, infoCle, cleSecreteChiffree) {
  console.debug("Preparer transaction rechiffrer cle partition %s : %O rechiffree = ", fingerprintMaitrecles, infoCle, cleSecreteChiffree)

  const cleSecreteMb = String.fromCharCode.apply(null, multibase.encode('base64', cleSecreteChiffree))

  var commande = {
    'cles': {[fingerprintMaitrecles]: cleSecreteMb},
  }

  // Copier les champs presents
  const champs = ['domaine', 'partition', 'iv', 'tag', 'format', 'hachage_bytes', 'identificateurs_document']
  champs.forEach(item=>{
    const valeur = infoCle[item]
    if(valeur) commande[item] = valeur
  })

  // Signer transaction
  const domaine = 'MaitreDesCles'
  const action = 'sauvegarderCle'
  commande = await webWorker.formatterMessage(commande, domaine, {action, partition: fingerprintMaitrecles})
  console.debug("Commande cle rechiffree : %O", commande)

  return commande
}

async function transformerClePriveeForgeVersSubtle(webWorker, clePriveeForge) {
  const clePEM = sauvegarderPrivateKeyToPEM(clePriveeForge)
  const cle = await webWorker.importerClePriveeSubtle(clePEM)
  return cle
}

function rechiffrerCles(webWorker, cles, pemRechiffrage) {
  // Extraire les cles et mettre dans un dict fingerprint: buffer
  const secretsChiffres = cles.reduce((secretsChiffres, item)=>{
    const buffer = multibase.decode(item.cle)
    secretsChiffres[item.hachage_bytes] = buffer
    return secretsChiffres
  }, {})

  return webWorker.rechiffrerAvecCleMillegrille(
    secretsChiffres, pemRechiffrage, {DEBUG: false})
}
