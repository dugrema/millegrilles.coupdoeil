import React, {useState, useEffect, useCallback} from 'react'
import {Row, Col, Button, Form, InputGroup, FormControl, Alert} from 'react-bootstrap'
import axios from 'axios'

import { AlertTimeout, ModalAttente } from '@dugrema/millegrilles.reactjs'
import { pki as forgePki } from '@dugrema/node-forge'

import { signerCertificatInstance } from './ConfigurationNoeudsListe'

function CommandeHttp(props) {

  const {workers, etatConnexion, etatAuthentifie, instance, usager} = props
  const idmg = usager.idmg
  const hostnameConfigure = instance.hostname
  const ipDetectee = instance.ip_detectee

  const [hostname, setHostname] = useState('')
  const [instanceInfo, setInstanceInfo] = useState('')
  const [attente, setAttente] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')

  useEffect(()=>{
    if(!instance) return
    var hostname = hostnameConfigure || ipDetectee
    setHostname(hostname)
  }, [setHostname, hostnameConfigure, ipDetectee])

  const confirmationCb = useCallback( confirmation => { setConfirmation(confirmation); setAttente(false) }, [setConfirmation, setAttente]  )

  const erreurCb = useCallback(
      (err, message) => { 
          console.debug("Set erreurs %O, %s", err, message)
          setError({err, message})
          setAttente(false)  // Reset attente
      }, 
      [setError, setAttente]
  )

  const verifierAccesNoeudCb = useCallback(event => {
    verifierAccesNoeud(hostname, idmg, setInstanceInfo, erreurCb)
      .catch(err=>console.error("Erreur verifierAccesNoeudCb : %O", err))
  }, [hostname, idmg, setInstanceInfo, erreurCb])

  return (
    <>
      <h2>Configuration d'une instance via Http</h2>

      <AlertTimeout variant="danger" titre="Erreur" delay={false} value={error} setValue={setError} />
      <AlertTimeout message={confirmation} setMessage={setConfirmation} />
      <ModalAttente show={attente} setAttente={setAttente} />

      <p>
        Transmet des commandes de configuration signees avec le certificat du navigateur.
      </p>

      <label htmlFor="hostmq">URL de connexion a l'instance (https)</label>
      <InputGroup>
        <InputGroup.Text id="hostname">
          https://
        </InputGroup.Text>
        <FormControl id="hostname"
                      aria-describedby="urlNoeud"
                      value={hostname}
                      onChange={event=>setHostname(event.currentTarget.value)} />
      </InputGroup>

      <Row>
        <Col>
          <Button variant="primary" onClick={verifierAccesNoeudCb}>Charger</Button>
        </Col>
      </Row>

      <AfficherInfoConfiguration 
        workers={workers}
        instance={instance}
        instanceInfo={instanceInfo || ''}
        hostname={hostname}
        etatConnexion={etatConnexion} 
        etatAuthentifie={etatAuthentifie}
        confirmationCb={confirmationCb}
        erreurCb={erreurCb} />

    </>
  )
}

export default CommandeHttp

function AfficherInfoConfiguration(props) {

  const {
    workers, instance, instanceInfo, etatConnexion, etatAuthentifie, hostname,
    confirmationCb, erreurCb,
  } = props
  const instanceId = instance.instance_id

  const renouvelerCertificatCb = useCallback(async event => {
    renouvellerCertificat(workers, hostname, instance, confirmationCb, erreurCb)
      .catch(err=>console.error("Erreur renouvelerCertificatCb : %O", err))
  }, [workers, hostname, instance, confirmationCb, erreurCb])

  if(!instanceInfo) return ''

  return (
    <>
      <h2>Information instance</h2>
      <Row>
        <Col md={3}>Idmg</Col>
        <Col className="idmg">{instanceInfo.idmg}</Col>
      </Row>
      <Row>
        <Col md={3}>Id</Col>
        <Col>{instanceInfo.instance_id}</Col>
      </Row>
      <Row>
        <Col md={3}>Securite</Col>
        <Col>{instanceInfo.securite}</Col>
      </Row>
      <Row>
        <Col md={3}>FQDN detecte</Col>
        <Col>{instanceInfo.fqdn_detecte}</Col>
      </Row>

      <ConfigurerDomaine
        workers={workers}
        instanceId={instanceId}
        instanceInfo={instanceInfo} 
        hostname={hostname} 
        etatAuthentifie={etatAuthentifie}
        confirmationCb={confirmationCb} 
        erreurCb={erreurCb} />

      <h3>Certificat</h3>
      <AfficherExpirationCertificat pem={instanceInfo.certificat || ''}/>
      <Row>
        <Col>
          <Button variant="secondary" onClick={renouvelerCertificatCb}
                  disabled={!etatAuthentifie}>Renouveler</Button>
        </Col>
      </Row>

      <ConfigurerMQ 
        workers={workers}
        hostname={hostname}
        etatAuthentifie={etatAuthentifie}
        erreurCb={erreurCb}
        confirmationCb={confirmationCb} />
    </>
  )
}

function ConfigurerDomaine(props) {

  const { workers, etatAuthentifie, instanceId, instanceInfo, hostname, confirmationCb, erreurCb } = props
  const domaineConfigure = instanceInfo.hostname

  const changerDomaineCb = useCallback(event=>{
    console.debug("Changer domaine pour : %s", hostname)
    changerHostnameInstance(workers, instanceId, hostname, confirmationCb, erreurCb)
  }, [workers, instanceId, hostname, confirmationCb, erreurCb])

  return (
    <>
      <h3>Domaine</h3>
      
      <Row>
        <Col md={4}>Configure</Col>
        <Col>{domaineConfigure}</Col>
      </Row>

      <Row>
        <Col md={4}>Utilise</Col>
        <Col>{hostname}</Col>
      </Row>

      <label htmlFor="changerDomaine">Changer le hostname configure pour le hostname utilise.</label>
      <br/>
      <Button 
        id="changerDomaine" 
        variant="secondary" 
        disabled={hostname===domaineConfigure||!etatAuthentifie} 
        onClick={changerDomaineCb}>Changer</Button>
    </>
  )

}

async function renouvellerCertificat(workers, hostname, instance, confirmationCb, erreurCb) {
  console.debug("Renouveler certificat du noeud %s", hostname)

  const { connexion } = workers

  try {
    const urlCsr = new URL('https://localhost/installation/api/csrInstance')
    urlCsr.hostname = hostname
    var reponseCsr = await axios.get(urlCsr.href)
    console.debug("Reponse CSR : %O", reponseCsr)
  } catch(err) {
    return erreurCb(err, 'Erreur recuperation de la requete de certificat (CSR)')
  }

  if(reponseCsr.status === 410) {
    console.debug("Le CSR n'existe pas, demander au noeud d'en generer un nouveau")
    const urlGenerer = new URL('https://localhost/installation/api/genererCsr')
    urlGenerer.hostname = hostname
    console.debug("URL verification noeud : %s", urlGenerer.href)

    const domaine = 'monitor', action = 'genererCsr'
    const commande = await connexion.formatterMessage({}, domaine, {action, attacherCertificat: true})

    try {
      const reponse = await axios({
        method: 'post',
        url: urlGenerer.href,
        data: commande,
        timeout: 5000,
      })

      var csr = reponse.data
    } catch(err) {
      erreurCb(err, "Erreur demande du CSR")
      return
    }
  } else if(reponseCsr.status === 200) {
    var csr = reponseCsr.data
  } else {
    erreurCb(`Erreur renouvellement certificat (CSR non recu, status : ${reponseCsr.status})`)
    return
  }

  console.debug("CSR a utiliser\n%s", csr)
  const securite = instance.securite

  try {
    if(csr && securite) {
      const reponseCertificat = await signerCertificatInstance(connexion, csr, securite, hostname)
      console.debug("Certificat signe : %O", reponseCertificat)
      const certificat = reponseCertificat.certificat

      const urlInstallerCertificat = new URL('https://localhost/installation/api/installerCertificat')
      urlInstallerCertificat.hostname = hostname
      const reponseAxios = await axios({
        url: urlInstallerCertificat.href,
        method: 'post',
        data: {certificat},
        timeout: 5000,
      })
      console.debug("Recu reponse installation certificat\n%O", reponseAxios)
      
      confirmationCb('Certificat renouvelle avec succes.')
    } else {
      erreurCb("Il manque le csr ou le niveau de securite")
    }
  } catch(err) {
    console.error("Erreur prendrePossession : %O", err)
    erreurCb(err, 'Erreur renouvellement de certificat.')
  }
}

async function verifierAccesNoeud(hostname, idmg, setInstance, erreurCb) {
  const url = new URL("https://localhost/installation/api/info")
  url.hostname = hostname

  console.debug("URL verification noeud : %s", url.href)
  try {
    const reponse = await axios.get(url.href)
    console.debug("Reponse noeud : %O", reponse)

    const idmgReponse = reponse.data.idmg
    console.debug("Comparaison idmg : Reponse %s, cert %s", idmg, idmgReponse)

    if(idmg === idmgReponse) {

      try {
        const certificat = forgePki.certificateFromPem(reponse.data.certificat)
        console.debug("Certificat noeud : %O", certificat)
      } catch(err) {
        erreurCb(err, 'Erreur chargement certificat (invalide)')
        return
      }

      setInstance(reponse.data)

    } else {
      erreurCb(`Mauvais idmg ${idmgReponse}`)
    }
  } catch(err) {
    erreurCb(err, `Erreur connexion`)
  }
}

async function changerHostnameInstance(workers, instanceId, hostname, confirmationCb, erreurCb) {
  try {
    const {connexion} = workers

    const commande = {
      instance_id: instanceId,
      hostname,
    }
    const domaine = 'monitor', action = 'changerDomaine'
    const commandeSignee = await connexion.formatterMessage(commande, domaine, {action})

    const url = new URL("https://localhost/installation/api/changerDomaine")
    url.hostname = hostname
    console.debug("URL verification noeud : %s", url.href)

    const reponse = await axios({
      method: 'post',
      url: url.href,
      data: commandeSignee,
      timeout: 20000,
    })
    console.debug("Reponse noeud : %O", reponse)

    const idmgReponse = reponse.data.idmg
    console.debug("Comparaison idmg : Reponse %s", idmgReponse)

    confirmationCb("Hostname change avec succes.")
  } catch(err) {
    erreurCb(err, `Erreur connexion`)
  }
}

function ConfigurerMQ(props) {

  const { workers, hostname, etatAuthentifie, confirmationCb, erreurCb } = props

  const [hostMq, setHostMq] = useState('')
  const [portMq, setPortMq] = useState('5673')

  const soumettre = useCallback(event=>{
    configurerMq(workers, hostname, hostMq, portMq, confirmationCb, erreurCb)
      .catch(err=>console.error("Erreur %O", err))
  }, [workers, hostname, hostMq, portMq, confirmationCb, erreurCb])

  return (
    <>
      <h3>Configurer MQ</h3>
      <p>Modifier la configuration de MQ pour reconnecter l'instance au serveur 3.protege.</p>

      <label htmlFor="hostmq">Configuration de la connexion MQ</label>
      <Row>
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text id="hostmq">
              Host
            </InputGroup.Text>
            <FormControl 
              id="hostmq"
              aria-describedby="hostmq"
              name="host"
              value={hostMq}
              placeholder="exemple : serveur.domain.com"
              onChange={event=>setHostMq(event.currentTarget.value)} />
          </InputGroup>
        </Col>

        <Col md={4}>
          <InputGroup>
            <InputGroup.Text id="portmq">
              Port
            </InputGroup.Text>
            <FormControl 
              id="portmq"
              aria-describedby="portmq"
              name="port"
              value={portMq}
              onChange={event=>setPortMq(event.currentTarget.value)} />
          </InputGroup>
        </Col>
      </Row>

      <Row>
        <Col>
          <Button variant="secondary" disabled={!hostMq} onClick={soumettre}>Configurer</Button>
        </Col>
      </Row>
    </>
  )
}

async function configurerMq(workers, hostname, hostMq, portMq, confirmationCb, erreurCb) {
  const {connexion} = workers

  var commande = {}
  if(!hostMq && !portMq) {
    commande.supprimer_params_mq = true
  } else {
    commande.host = hostMq
    commande.port = portMq
  }

  const domaine = 'monitor', action = 'changerConfigurationMq'
  const commandeSignee = await connexion.formatterMessage(commande, domaine, {action})

  console.debug("Commande a transmettre : %O", commandeSignee)
  const url = new URL('https://localhost/installation/api/configurerMQ')
  url.hostname = hostname
  try {
    const reponse = await axios({
      method: 'post',
      url,
      data: commandeSignee,
      timeout: 20000,
    })
    console.debug("Reponse configuration MQ : %O", reponse)
    const data = reponse.data
    if(data.ok === false) {
      erreurCb(data.err, 'Erreur changement configuration MQ')
    } else {
      confirmationCb('Configuration MQ modifiee avec succes')
    }
  } catch(err) {
    erreurCb(err, 'Erreur changement configuration MQ')
  }
}

function AfficherExpirationCertificat(props) {
  const [certificat, setCertificat] = useState('')
  useEffect(_=>{
    const pem = props.pem
    var cert = ''
    if(pem) {
      try {
        console.debug("PEM : %O", pem)
        cert = forgePki.certificateFromPem(pem)
        console.debug("Cert : %O", cert)
      } catch(err) {
        console.error("Erreur chargement certificat noeud: %O", err)
      }
    }
    setCertificat(cert)
  }, [props.pem])

  const validity = certificat.validity || ''

  var notAfter = '', expirationDuree = ''
  if(validity) {
    notAfter = '' + validity.notAfter
    const expirationDureeMs = validity.notAfter.getTime() - new Date().getTime()
    if(expirationDureeMs < 0) {
      expirationDuree = 'Expire'
    } else {
      const jourMs = 1000*60*60*24
      if(expirationDureeMs > jourMs) {
        const expirationDureeJours = expirationDureeMs / jourMs
        expirationDuree = Math.floor(expirationDureeJours) + ' jours'
      } else {
        const expirationDureeHeures = expirationDureeMs / (1000*60*60)
        expirationDuree = Math.floor(expirationDureeHeures) + ' heures'
      }
    }
    console.debug("Expiration duree : %O", expirationDuree)
  } else {
    return ''
  }

  return (
    <>
      <Row>
        <Col md={3}>Expiration</Col>
        <Col>{notAfter}</Col>
      </Row>
      <Row>
        <Col md={3}>Duree restante</Col>
        <Col>{expirationDuree}</Col>
      </Row>
    </>
  )
}

async function chiffrerChamp(webWorker, instance_id, certificats, secret) {
  const identificateurs_document = {
    libelle: 'noeud',
    instance_id,
    'champ': 'consignation_web.credentialsSecretAccessKey',
  }
  const certificatMaitredescles = certificats.certificat
  const domaine = 'Topologie'

  // const contenuChiffre = await new MilleGrillesCryptoHelper().chiffrerDictionnaire(
  //   signateurTransaction, certificatMaitredescles, identificateurs_document, domaine, secret)

  throw new Error("TODO : fix refact webWorker")

  const contenuChiffre = await webWorker.chiffrerDocument(
    secret, domaine, certificatMaitredescles.join('\n'), identificateurs_document)

  return contenuChiffre
}

async function renouvelerCertificat(workers, noeudUrl, csr) {
  console.debug("Renouveler le certificat avec csr %O", csr)

}
