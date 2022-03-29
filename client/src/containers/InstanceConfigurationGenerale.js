import React, {useState, useEffect, useCallback} from 'react'
import {Row, Col, Button, Form, InputGroup, FormControl, Alert} from 'react-bootstrap'

import { AlertTimeout, ModalAttente } from './Util'

// Note: Look behind (?<!) pas supporte sur Safari (iOS)
// RE_DOMAINE = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/
const RE_DOMAINE = /^([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,6}$/

function ConfigurationGenerale(props) {

    const {workers, etatConnexion, instance, idmg} = props
    const hostnameConfigure = instance.domaine

    const [attente, setAttente] = useState(false)
    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const confirmationCb = useCallback( confirmation => { setConfirmation(confirmation); setAttente(false) }, [setConfirmation, setAttente]  )

    const erreurCb = useCallback(
        (err, message) => { 
            console.debug("Set erreurs %O, %s", err, message)
            setError(err, message)
            if(message) setErrorMessage(message)
            else setErrorMessage(''+err)
            setAttente(false)  // Reset attente
        }, 
        [setError, setErrorMessage, setAttente]
    )
  
    return (
        <>
            <h2>Configuration generale d'une instance</h2>
    
            <AlertTimeout 
                variant="danger" delay={false} 
                message={errorMessage} setMessage={setErrorMessage} err={error} setError={setError} />
            <AlertTimeout message={confirmation} setMessage={setConfirmation} />
            <ModalAttente show={attente} setAttente={setAttente} />
    
            <p>Cette page permet de modifier la configuration generale de l'instance.</p>
            <p>
                Pour configurer la connexion MQ, le domaine (hostname) ou renouveller le certificat, 
                aller sous <strong>Commande Http</strong> du menu Configuration.
            </p>


            <ConfigurerDomaine 
                workers={workers} 
                instance={instance}
                confirmationCb={confirmationCb}
                erreurCb={erreurCb} />
        </>
    )
}

export default ConfigurationGenerale

function ConfigurerDomaine(props) {

    const { workers, instance, erreurCb } = props
    const { connexion } = workers
    const { domaine } = instance
    const instanceId = instance.noeud_id

    const [configurationAvancee, setConfigurationAvancee] = useState(false)
    const [configurationAcme, setConfigurationAcme] = useState('')
    const [modeTest, setModeTest] = useState(false)
    const [cloudns_subauthid, setCloudns_subauthid] = useState('')

    useEffect(()=>{
        const methode = configurationAcme.methode
        if(methode) {
            setConfigurationAvancee(true)
        }
    }, [configurationAcme, setConfigurationAvancee, setModeTest, setCloudns_subauthid])

    // state = {
    //   domaine: '',
    //   domaineValide: false,
  
    //   configurationAvancee: false,
    //   modeTest: false,
    //   modeCreation: 'webroot',
  
    //   cloudnsSubid: '',
    //   cloudnsPassword: '',
    //   dnssleep: '240',
  
    //   confirmation: '',
    //   erreur: '',
    // }
  
    // setInternetDisponible = event => {
    //   const eventInfo = event.currentTarget
    //   this.setState({internetDisponible: event.currentTarget.checked})
    // }
  
    // changerDomaine = event => {
    //   const value = event.currentTarget?event.currentTarget.value:event
    //   const valide = this.RE_DOMAINE.test(value)
    //   this.setState({domaine: value, domaineValide: valide})
    // }
  
    // changerTextfield = event => {
    //   const {name, value} = event.currentTarget
    //   this.setState({[name]: value})
    // }
  
    // setCheckbox = event => {
    //   const {name, checked} = event.currentTarget
    //   this.setState({[name]: checked})
    // }
  
    // setModeCreation = event => {
    //   const {value} = event.currentTarget
    //   this.setState({modeCreation: value}, ()=>{console.debug("State :\n%O", this.state)})
    // }
  
    // soumettre = async event => {
    //   const infoInternet = this.state
    //   var commande = {
    //     domaine: infoInternet.domaine,
    //     modeTest: infoInternet.modeTest,
    //   }
  
    //   if(this.state.modeCreation === 'dns_cloudns') {
    //     commande['modeCreation'] = infoInternet.modeCreation
    //     commande['cloudnsSubid'] = infoInternet.cloudnsSubid
    //     commande['cloudnsPassword'] = infoInternet.cloudnsPassword
    //   }
  
    //   const connexion = this.props.workers.connexion
  
    //   // const signateurTransaction = this.props.rootProps.signateurTransaction
    //   // await signateurTransaction.preparerTransaction(commande, 'Monitor.changerConfigurationDomaine')
  
    //   const domaine = 'monitor', action = 'changerConfigurationDomaine'
    //   const commandeSignee = await connexion.formatterMessage(commande, domaine, {action})
  
    //   console.debug("Commande a transmettre : %O", commande)
    //   const url = 'https:/' + path.join('/', this.props.urlNoeud, '/installation/api/configurerDomaine')
    //   try {
    //     const reponse = await axios({
    //       method: 'post',
    //       url,
    //       data: commandeSignee,
    //       timeout: 5000,
    //     })
    //     console.debug("Reponse configuration domaine : %O", reponse)
    //     this.setState({confirmation: "Configuration transmise"})
    //   } catch(err) {
    //     this.setState({erreur: ''+err})
    //   }
    // }
  
    const soumettreCb = useCallback(event=>{
        console.debug("Soumettre")
    }, [])

    const toggleAvanceCb = useCallback(event=>setConfigurationAvancee(event.currentTarget.checked), [setConfigurationAvancee])

    useEffect(()=>{
        connexion.getConfigurationAcme(instanceId)
            .then(reponse=>{
                console.debug("Reponse configuration acme : %O", reponse)
                if(reponse.err) return erreurCb(reponse.err)
                setConfigurationAcme(reponse)
            })
            .catch(err=>erreurCb(err))
    }, [connexion, instanceId, setConfigurationAcme, erreurCb])

    return (
        <>
            <h3>Certificat web TLS (SSL)</h3>

            <p>
                Generer ou modifier le certificat web TLS (SSL) de l'instance.
            </p>

            <Row>
                <Col md={3}>Domaine</Col>
                <Col>{domaine}</Col>
            </Row>

            {/* <AfficherFormInternet workers={workers} /> */}

            <Form.Check 
                id="configuration-avancee" 
                type="switch"
                checked={configurationAvancee} 
                onChange={toggleAvanceCb}
                label="Configuration avancee" />

            {configurationAvancee?
                <ConfigurationLetencryptAvancee 
                    configurationAcme={configurationAcme} />
                :
                <p>
                    Le certificat va etre renouvelle gratuitement avec <a href="https://letsencrypt.org/">Let's Encrypt</a>. 
                    Veuillez vous assurer que le port 80 (http) de l'instance est expose a internet 
                    (e.g. configuration du routeur, ...).
                </p>
            }

            <Row>
                <Col>
                    <Button onClick={soumettreCb}>Soumettre</Button>
                </Col>
            </Row>
        </>
    )
}

function ConfigurationLetencryptAvancee(props) {

    const {configurationAcme} = props

    const [modeTest, setModeTest] = useState(false)

    const [modeCreation, setModeCreation] = useState('webroot')
    const [params, setParams] = useState('')

    useEffect(()=>{
        const { methode } = configurationAcme
        const {commande, mode_test, params_environnement} = methode || {}
        setModeTest(mode_test?true:false)
        if(commande) {
            if(commande.indexOf('dns_cloudns') > -1) setModeCreation('dns_cloudns')
        }
        if(params_environnement) {
            const params = params_environnement.reduce((acc, item)=>{
                const items = item.split('=')
                acc[items[0]] = items[1]
                return acc
            }, {})
            setParams(params)
        }

    }, [configurationAcme, setModeCreation])

    let PageConfigurationMode
    switch(modeCreation) {
        case 'dns_cloudns': PageConfigurationMode = ModeCloudns; break
        default: PageConfigurationMode = () => ''
    }

    return (
        <>
            <p>Configuration avancee</p>
            <Form.Check id="certificat-test">
                <Form.Check.Input type='checkbox' name="modeTest" value="true" checked={modeTest} onChange={event=>setModeTest(event.currentTarget.checked)} />
                <Form.Check.Label>Certificat de test</Form.Check.Label>
            </Form.Check>

            <Form.Group controlId="modeCreationCertificat">
                <Form.Label>Mode de creation certificat</Form.Label>
                <Form.Select type="text"
                    placeholder="Choisir un mode"
                    onChange={event=>setModeCreation(event.currentTarget.value)}
                    value={modeCreation}>
                    
                    <option value="webroot">Mode http (port 80)</option>
                    <option value="dns_cloudns">ClouDNS</option>

                </Form.Select>
            </Form.Group>

            <PageConfigurationMode params={params} />
        </>
    )
}

function ModeCloudns(props) {

    const params = props.params || {}

    const [subid, setSubid] = useState('')
    const [password, setPassword] = useState('')
    const [sleep, setSleep] = useState('240')

    useEffect(()=>{
        const subid = params['CLOUDNS_SUB_AUTH_ID']
        if(subid) setSubid(subid)
    }, [params, setSubid])

    return (
        <>
            <label htmlFor="cloudns-subid">Configuration ClouDNS</label>
            <InputGroup>
                <InputGroup.Text id="cloudns-subid">
                    SubID (numero)
                </InputGroup.Text>
                <FormControl 
                    id="cloudns-subid"
                    aria-describedby="cloudns-subid"
                    name="cloudnsSubid"
                    value={subid}
                    onChange={event=>setSubid(event.currentTarget.value)} />
            </InputGroup>
            <InputGroup>
                <InputGroup.Text id="cloudns-password">
                    Mot de passe
                </InputGroup.Text>
                <FormControl 
                    id="cloudns-password"
                    aria-describedby="cloudns-password"
                    placeholder="Saisir mot de passe"
                    type="password"
                    name="cloudnsPassword"
                    value={password}
                    onChange={event=>setPassword(event.currentTarget.value)} />
            </InputGroup>

            <InputGroup>
                <InputGroup.Text id="dns-sleep">
                    DNS sleep
                </InputGroup.Text>
                <FormControl id="dns-sleep"
                    aria-describedby="dns-sleep"
                    name="dnssleep"
                    value={sleep}
                    onChange={event=>setSleep(event.currentTarget.value)} />
            </InputGroup>
        </>
    )
}
  
// function AfficherFormInternet(props) {

//     var flagDomaineInvalide = null;
//     if( ! props.domaineValide ) {
//       flagDomaineInvalide = <i className="fa fa-close btn-outline-danger"/>
//     }
  
//     var configurationAvancee = ''
//     if(props.configurationAvancee) {
//       var cloudnsParams = ''
//       if (props.modeCreation === 'dns_cloudns') {
//         cloudnsParams = (
//           <div>
//             <label htmlFor="cloudns-subid">Configuration ClouDNS</label>
//             <InputGroup>
//               <InputGroup.Text id="cloudns-subid">
//                 SubID (numero)
//               </InputGroup.Text>
//               <FormControl id="cloudns-subid"
//                            aria-describedby="cloudns-subid"
//                            name="cloudnsSubid"
//                            value={props.cloudnsSubid}
//                            onChange={props.changerTextfield} />
//             </InputGroup>
//             <InputGroup>
//               <InputGroup.Text id="cloudns-password">
//                 Mot de passe
//               </InputGroup.Text>
//               <FormControl id="cloudns-password"
//                            aria-describedby="cloudns-password"
//                            type="password"
//                            name="cloudnsPassword"
//                            value={props.cloudnsPassword}
//                            onChange={props.changerTextfield} />
//             </InputGroup>
  
//             <InputGroup>
//               <InputGroup.Text id="dns-sleep">
//                 DNS sleep
//               </InputGroup.Text>
//               <FormControl id="dns-sleep"
//                            aria-describedby="dns-sleep"
//                            name="dnssleep"
//                            value={props.dnssleep}
//                            onChange={props.changerTextfield} />
//             </InputGroup>
  
//           </div>
//         )
//       }
  
//       configurationAvancee = (
//         <div>
//           <Form.Check id="certificat-test">
//             <Form.Check.Input type='checkbox' name="modeTest" value="true" checked={props.modeTest} onChange={props.setCheckbox} />
//             <Form.Check.Label>Certificat de test</Form.Check.Label>
//           </Form.Check>
  
//           <Form.Group controlId="modeCreationCertificat">
//             <Form.Label>Mode de creation certificat</Form.Label>
//             <Form.Control as="select" value={props.modeCreation} onChange={props.setModeCreation}>
//               <option value="webroot">Mode http (port 80)</option>
//               <option value="dns_cloudns">ClouDNS</option>
//             </Form.Control>
//           </Form.Group>
  
//           {cloudnsParams}
//         </div>
//       )
//     }
  
//     return (
//       <>
//         <Row>
//           <Col>
//             <h4>Configuration prealable</h4>
  
//             <ul>
//               <li>Nom de domaine</li>
//               <li>Configurer les ports TCP 443 et 80 sur le routeur</li>
//             </ul>
  
//             <p>
//               Adresse IPv4 detectee pour le noeud : {props.ipDetectee}
//             </p>
  
//           </Col>
//         </Row>
  
//         <Row>
//           <Col>
//             <h3>Configuration</h3>
//           </Col>
//         </Row>
//         <Form>
//           <label htmlFor="noeud-url">URL d'acces au noeud {flagDomaineInvalide}</label>
//           <InputGroup className="mb-3">
//             <InputGroup.Text id="noeud-addon3">
//               https://
//             </InputGroup.Text>
//             <FormControl id="noeud-url" aria-describedby="noeud-addon3" value={props.domaine} onChange={props.changerDomaine}/>
//           </InputGroup>
  
//           <Form.Check id="configuration-avancee">
//             <Form.Check.Input type='checkbox' name="configurationAvancee" value="true" checked={props.configurationAvancee} onChange={props.setCheckbox} />
//             <Form.Check.Label>Configuration avancee</Form.Check.Label>
//           </Form.Check>
  
//           {configurationAvancee}
  
//         </Form>
//       </>
//     )
// }

