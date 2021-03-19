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

const BATCH_NOMBRE_FETCH = 15       // Nombre cles downloadees a la fois

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

        <RechiffrerCles wsa={this.props.rootProps.websocketApp}
                        modeProtege={this.props.rootProps.modeProtege}
                        idmg={this.props.rootProps.idmg}
                        nombreClesNonDechiffrables={this.state.nombreClesNonDechiffrables}
                        updateEtatRechiffrage={this.updateEtatRechiffrage}
                        webWorker={this.props.rootProps.chiffrageWorker} />
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

  // props
  //

  state = {
    nombreClesNonDechiffrables: '',

    clesNonDechiffrables: '',
    // infoCertificatRechiffrage: '',
    certificatRechiffrageForge: '',

    //  Cle: sha512_b64:... = {promise, retransmissions, confirmations, err}
    dictParHachage: {},

    clesCompletees: 0,

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
  }

  clearErr = _ => {
    this.setState({err: ''})
  }

  chargerBatchCles = async _ => {
    const wsa = this.props.wsa
    try {
      var listeHachageIgnorer = Object.keys(this.state.dictParHachage).filter(item=>{
        const infoHachage = this.state.dictParHachage[item]
        // Ignorer toutes les cles en cours de traitement
        return infoHachage.promise || infoHachage.resultat || infoHachage.err
      })

      const reponseClesNonDechiffrables = await wsa.requeteClesNonDechiffrables(BATCH_NOMBRE_FETCH, listeHachageIgnorer)
      console.debug("Reponse cles non dechiffrables : %O", reponseClesNonDechiffrables)

      if(reponseClesNonDechiffrables.error) {
        console.error("Erreur rechiffrage cles : %s", reponseClesNonDechiffrables.message)
        this.setState({err: reponseClesNonDechiffrables.message})
        return
      }

      // Valider le certificat recu
      const webWorker = this.props.webWorker
      const certificatRechiffrageForge = await validerCertificatRechiffrage(
        webWorker, this.props.idmg, reponseClesNonDechiffrables.certificat_rechiffrage)
      console.debug("Info certificat rechiffrage : %O", certificatRechiffrageForge)
      const fingerprintMaitrecles = await hacherCertificat(certificatRechiffrageForge)

      await new Promise(resolve=>{
        this.setState({
          clesNonDechiffrables: reponseClesNonDechiffrables,
          certificatRechiffrageForge,
          certificatRechiffragePem: reponseClesNonDechiffrables.certificat_rechiffrage,
          fingerprintMaitrecles,
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

    // Mettre une limite sur la boucle pour eviter loop infini
    const limiteBoucle = this.state.nombreClesNonDechiffrables
    var idxBoucle = 0

    const webWorker = this.props.webWorker

    console.debug("Rechiffrage, props : %O, state: %O", this.props, this.state)

    try {
      await this.rechiffrer()
      console.debug("Demarrage premiere batch rechiffrer completee")

      var promises = [Promise.resolve()]  // Initial seed

      var derniereBatchDownloadee = false
      while(promises.length > 0 && limiteBoucle > idxBoucle) {
        idxBoucle++  // Protection de boucle infini

        const resultatPromise = await Promise.any(promises)  // Effectuer traitement des qu'une promise est completee
        console.debug("Resultat d'une promise settled : %O", resultatPromise)

        // Traiter la promise
        if(resultatPromise && resultatPromise.hachage_bytes) {
          const hachage = resultatPromise.hachage_bytes
          const infoHachage = {...this.state.dictParHachage[hachage]}

          // Supprimer resultat
          delete infoHachage.resultat
          infoHachage.complete = true

          // Conserver information pour s'assurer que la cle ne revient pas dans
          // la prochaine batch
          this.setState({
            dictParHachage: {...this.state.dictParHachage, [hachage]: infoHachage},
          })
        }

        // Regenerer la liste des promises
        var promises = Object.values(this.state.dictParHachage)
          .filter(item=>(item.promise))
          .map(item=>item.promise)
        console.debug("Il reste %d promises a traiter", promises.length)

        // Demander une nouvelle batch
        if(promises.length < BATCH_NOMBRE_FETCH && ! this.state.derniereBatchDownloadee) {
          console.debug("Demander nouvelle batch cles a rechifrer")
          await this.chargerBatchCles()
          await this.rechiffrer()
        }

      }

      // console.debug("Info promises: %O", await Promise.allSettled(promises))

      const dictParHachage = {}
      for(const hachage in this.state.dictParHachage) {
        const infoHachage = this.state.dictParHachage[hachage]
        console.debug("Information resultat %s = %O", hachage, infoHachage)
      }

    } catch(err) {
      console.error("Erreur traitement batch cles : %O", err)
    }

    console.debug("Rechiffrage Termine sur %d cles : %O", Object.keys(this.state.dictParHachage).length, this.state.dictParHachage)
    this.setState({confirmation: "Rechiffrage termine"})
  }

  rechiffrer = async _ => {
    // var clesARechiffrer = [...this.state.clesNonDechiffrables.cles]
    const {wsa, webWorker} = this.props

    const clesRechiffrees = await rechiffrerCles(
      webWorker, this.state.clesNonDechiffrables.cles, this.state.certificatRechiffragePem)
    console.debug("Cles rechiffrees : %O", clesRechiffrees)

    const clesParHachage = this.state.clesNonDechiffrables.cles.reduce((accumulateur, item)=>{
      accumulateur[item.hachage_bytes] = item
      return accumulateur
    })

    // const clePriveeSubtle = this.props.clePriveeSubtle
    // const certificatRechiffrageForge = this.state.certificatRechiffrageForge
    // const fingerprintMaitrecles = this.state.fingerprintSha256Base64
    // const webWorker = this.props.webWorker

    // // Importer cle publique en format subtle
    // console.debug("State - importer cle publique PEM de cert: %O\nState: %O", certificatRechiffrageForge, this.state)
    // if( ! certificatRechiffrageForge ) throw new Error("Cle maitre des cles non chargee")
    // var publicKey = certificatRechiffrageForge.publicKey
    // publicKey = forgePki.publicKeyToPem(publicKey)

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
                  disabled={!this.props.modeProtege || this.state.confirmation}>Rechiffrer</Button>
        </div>
      </>
    )
  }

}

async function validerCertificatRechiffrage(webWorker, idmg, certificatRechiffragePEM) {
  console.debug("Verifier certificat : %O", certificatRechiffragePEM)
  //const certificatRechiffrage = verifierChaineCertificats(certificatRechiffragePEM)
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

// async function rechiffrerCles(wsa, signateurTransaction, clePriveeSubtle,
//     fingerprintBase64Maitrecles, clePubliquePem, batchCles,
//     setNbClesCompletees) {
//   console.debug("Rechiffrer cles %O", batchCles)
//
//   const promises = batchCles.cles.map(infoCle => {
//     return traiterCle(signateurTransaction, clePriveeSubtle, fingerprintBase64Maitrecles, clePubliquePem, infoCle)
//   })
//
//   var resultatPromises = await Promise.allSettled(promises)
//   const commandes = resultatPromises.filter(item=>item.status==='fulfilled').map(item=>item.value)
//   console.debug("Commandes cles rechiffrees : %O", commandes)
//
//   const errors = resultatPromises.filter(item=>item.status!=='fulfilled').forEach(item=>{
//     console.error("Erreur rechiffrage cle : %O", item.reason)
//   })
//
//   return wsa.soumettreBatchClesRechiffrees(commandes)
// }

async function traiterCle(webWorker, fingerprintMaitrecles, infoCle, cleSecreteChiffree) {
  console.debug("Preparer transaction rechiffrer cle : %O", infoCle)
  // const cleChiffreeOrigine = infoCle.cle

  // Rechiffrer cle
  // const cleSecrete = await cryptageAsymetrique.decrypterCleSecrete(cleChiffreeOrigine, clePriveeSubtle.clePriveeDecrypt)
  // const cleSecrete = await webWorker.dechiffrerCleSecreteSubtle(clePriveeSubtle, cleChiffreeOrigine, {DEBUG: true})
  // const cleSecreteChiffree = await webWorker.chiffrerCleSecreteSubtle(clePubliqueSubtle, cleSecrete, {DEBUG: true})
  const cleSecreteMb = String.fromCharCode.apply(null, multibase.encode('base64', cleSecreteChiffree))

  // console.debug("Cle secrete dechiffree = %O", cleSecrete)
  // const cleSecreteHex = base64ToHexstring(cleSecrete)
  // var cleRechiffree = await cryptageAsymetrique.crypterCleSecrete(clePubliquePem, cleSecreteHex)
  // cleRechiffree = bufferToBase64(cleRechiffree)

  var commande = {
    'cles': {[fingerprintMaitrecles]: cleSecreteMb},
  }

  // Copier les champs presents
  const champs = ['domaine', 'iv', 'tag', 'format', 'hachage_bytes', 'identificateurs_document']
  champs.forEach(item=>{
    const valeur = infoCle[item]
    if(valeur) commande[item] = valeur
  })

  // Signer transaction
  const domaineAction = 'MaitreDesCles.sauvegarderCle'
  commande = await webWorker.formatterMessage(commande, domaineAction)
  console.debug("Commande cle rechiffree : %O", commande)

  return commande
}

async function transformerClePriveeForgeVersSubtle(webWorker, clePriveeForge) {
  const clePEM = sauvegarderPrivateKeyToPEM(clePriveeForge)
  // const cle = await cryptageAsymetrique.preparerClePrivee(clePEM)
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

  console.debug("Preparation secrets : %O", secretsChiffres)

  return webWorker.rechiffrerAvecCleMillegrille(
    secretsChiffres, pemRechiffrage, {DEBUG: true})
}
