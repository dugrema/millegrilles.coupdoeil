import React, {useState, useEffect, useCallback} from 'react'
import {proxy as comlinkProxy} from 'comlink'

// const subscriptionsMonitor = [
//   'evenement.presence.monitor',
// ]
//
// const subscriptionsDomaine = [
//   'evenement.presence.domaine',
// ]
//
// const subscriptionsDocker = [
//   'evenement.servicemonitor.__noeudId__.docker/container',
//   'evenement.servicemonitor.__noeudId__.docker/service',
// ]
//
// const subscriptionsApplications = [
//   'evenement.servicemonitor.__noeudId__.applicationDemarree',
//   'evenement.servicemonitor.__noeudId__.applicationArretee',
// ]

// Fonctions globales utilisees dans fonctions wrappes par comlinkProxy
// let _processMessageNoeuds = null,
//     _processMessageApplication = null,
//     _processMessageDocker = null,
//     _processMessageDomaine = null
const noeudsContexte = {},
      domainesContexte = {}

export function ListeNoeuds(props) {

  const [noeuds, setNoeuds] = useState('')

  const modeProtege = props.rootProps.modeProtege,
        connexion = props.workers.connexion,
        noeud_id = props.noeud_id

  useEffect(()=>{noeudsContexte.noeuds = noeuds}, [noeuds])

  useEffect(()=>{
    if(modeProtege) {
      connexion.enregistrerCallbackEvenementsNoeuds(processMessageNoeuds)
      chargerListeNoeuds(connexion, noeud_id)
        .then(noeuds=>{setNoeuds(noeuds)})
        .catch(err=>{console.error("Erreur chargement liste noeuds : %O", err)})

      // Cleanup
      return () => {
        connexion.retirerCallbackEvenementsNoeuds()
      }
    }
  }, [modeProtege, connexion, noeud_id])

  const processMessageNoeuds = useCallback(comlinkProxy(event => {
    const noeuds = noeudsContexte.noeuds,
          noeud_id = noeudsContexte.noeud_id

    // console.debug("Message noeud : %o", event)
    if( ! noeud_id || noeud_id === event.message.noeud_id) {
      const noeudsMaj = majNoeuds(noeuds, '3.protege', event.message)
      setNoeuds(noeudsMaj)
    }

  }), [noeudsContexte, setNoeuds])

  // const processMessageApplication = useCallback(comlinkProxy(message => {
  //   console.debug("Message application : %O", message)
  //   if(noeud_id) {
  //     var noeud = noeuds.filter(item=>item.noeud_id===noeud_id)[0]
  //   }
  // }), [noeud_id, noeuds])
  //
  // _processMessageDocker = useCallback(comlinkProxy(event => {
  //   const message = event.message
  //   const domaineAction = event.routingKey.split('.').pop()
  //
  //   if(noeud_id) {
  //     var noeudCopy = {...noeuds.filter(item=>item.noeud_id===noeud_id)[0]}
  //     if(domaineAction === 'docker/container') {
  //       console.debug("Message docker container : %O", message)
  //     } else if(domaineAction === 'docker/service') {
  //       console.debug("Message docker service : %O", message)
  //       if(message.Action === 'remove') {
  //         // Supprimer le service
  //         // console.debug("Supprimer service, info noeud : %O", noeudCopy)
  //         var nomApplication = message.Actor.Attributes.name
  //         var servicesRestants = {...noeudCopy.services}
  //         // console.debug("Services avant suppression : %O", servicesRestants)
  //         delete servicesRestants[nomApplication]
  //         noeudCopy.services = servicesRestants
  //         // console.debug("Copie noeud apres suppression : %O", noeudCopy)
  //       } else if(message.Action === 'create') {
  //         // console.debug("Creer service, info noeud : %O", noeudCopy)
  //         var nomApplication = message.Actor.Attributes.name
  //       }
  //     } else {
  //       // console.debug("Message docker type non gere : %O", message)
  //     }
  //
  //     // Creer copie de la liste de noeuds
  //     var listeCopie = noeuds.map(item=>{
  //       if(item.noeud_id === noeud_id) {
  //         return noeudCopy
  //       }
  //       return item
  //     })
  //     setNoeuds(listeCopie)
  //   }
  // }), [noeud_id, noeuds, setNoeuds])


  if(noeuds) {
    const children = props.children
    return React.Children.map(children, (child, i) => {
      const clone = React.cloneElement(child, {noeuds})
      return clone
    })
  } else {
    return ''
  }

}

export function ListeDomaines(props) {

  const connexion = props.workers.connexion,
        modeProtege = props.rootProps.modeProtege

  const [domaines, setDomaines] = useState([])

  useEffect(()=>{domainesContexte.domaines = domaines}, [domaines])

  useEffect(()=>{
    if(modeProtege) {
      connexion.enregistrerCallbackEvenementsPresenceDomaine(processMessageDomaine)
      chargerListeDomaines(connexion)
        .then(domaines=>{
          // console.debug("Domaines charges : %O", domaines)
          setDomaines(domaines)
        })

      // Cleanup
      return ()=>{
        connexion.retirerCallbackEvenementsPresenceDomaine()
      }
    }
  }, [modeProtege, setDomaines])

  const processMessageDomaine = useCallback(comlinkProxy(message => {
    // console.debug("Message recu : %O", message)
    const domaines = domainesContexte.domaines

    const domainesMaj = majDomaines(domaines, message.exchange, message.message)
    setDomaines(domainesMaj)
  }), [setDomaines])

  const children = props.children
  return React.Children.map(children, (child, i) => {
    const clone = React.cloneElement(child, {domaines})
    return clone
  })

}

// export class ListeNoeuds extends React.Component {
//
//   listenersSocket = []
//
//   state = {
//     noeuds: '',
//     subscriptionsMonitor,
//   }
//
//   componentDidMount() {
//     const websocketApp = this.props.workers.connexion
//     websocketApp.enregistrerCallbackEvenementsNoeuds(this.processMessageNoeud)
//     chargerListeNoeuds(websocketApp, this.props.noeud_id).then(noeuds=>this.setState({noeuds}))
//   }
//
//   componentWillUnmount() {
//     const websocketApp = this.props.workers.connexion
//     websocketApp.retirerCallbackEvenementsNoeuds()
//   }
//
//   processMessageNoeud = comlinkProxy(event => {
//     console.debug("Message noeud : %o", event)
//     const noeud_id = this.props.noeud_id
//     if( ! noeud_id || noeud_id === event.message.noeud_id) {
//       const noeuds = majNoeuds(this.state, '3.protege', event.message)
//       this.setState({noeuds})
//     }
//   })
//
//   processMessageApplication = comlinkProxy(message => {
//     console.debug("Message application : %O", message)
//     if(this.props.noeud_id) {
//       var noeud = this.state.noeuds.filter(item=>item.noeud_id===this.props.noeud_id)[0]
//     }
//   })
//
//   processMessageDocker = comlinkProxy(event => {
//     const message = event.message
//     const domaineAction = event.routingKey.split('.').pop()
//
//     if(this.props.noeud_id) {
//       var noeudCopy = {...this.state.noeuds.filter(item=>item.noeud_id===this.props.noeud_id)[0]}
//       if(domaineAction === 'docker/container') {
//         console.debug("Message docker container : %O", message)
//       } else if(domaineAction === 'docker/service') {
//         console.debug("Message docker service : %O", message)
//         if(message.Action === 'remove') {
//           // Supprimer le service
//           // console.debug("Supprimer service, info noeud : %O", noeudCopy)
//           var nomApplication = message.Actor.Attributes.name
//           var servicesRestants = {...noeudCopy.services}
//           // console.debug("Services avant suppression : %O", servicesRestants)
//           delete servicesRestants[nomApplication]
//           noeudCopy.services = servicesRestants
//           // console.debug("Copie noeud apres suppression : %O", noeudCopy)
//         } else if(message.Action === 'create') {
//           // console.debug("Creer service, info noeud : %O", noeudCopy)
//           var nomApplication = message.Actor.Attributes.name
//         }
//       } else {
//         // console.debug("Message docker type non gere : %O", message)
//       }
//
//       // Creer copie de la liste de noeuds
//       var listeCopie = this.state.noeuds.map(item=>{
//         if(item.noeud_id === this.props.noeud_id) {
//           return noeudCopy
//         }
//         return item
//       })
//       this.setState({noeuds: listeCopie})
//     }
//   })
//
//   render() {
//     // console.warn("Render liste topologie : %O", this)
//
//     if(this.state.noeuds) {
//       const children = this.props.children
//       return React.Children.map(children, (child, i) => {
//         const clone = React.cloneElement(child, {noeuds: this.state.noeuds})
//         return clone
//       })
//     } else {
//       return ''
//     }
//   }
//
// }

// export class ListeDomaines extends React.Component {
//
//   listenersSocket = []
//
//   state = {
//     domaines: []
//   }
//
//   componentDidMount() {
//     const websocketApp = this.props.workers.connexion
//
//     websocketApp.enregistrerCallbackEvenementsPresenceDomaine(this.processMessagePrive)
//
//     // websocketApp.subscribe(
//     //   subscriptionsDomaine, this.processMessagePrive, {exchange: ['2.prive', '3.protege']})
//
//     chargerListeDomaines(websocketApp).then(domaines=>{
//       console.debug("Domaines charges : %O", domaines)
//       this.setState({domaines})
//     })
//   }
//
//   componentWillUnmount() {
//     const websocketApp = this.props.workers.connexion
//     websocketApp.retirerCallbackEvenementsPresenceDomaine()
//
//     // websocketApp.unsubscribe(
//     //   subscriptionsDomaine, this.processMessagePrive, {exchange: ['2.prive', '3.protege']})
//   }
//
//   processMessagePrive = comlinkProxy(message => {
//     // console.debug("Message recu : %O", message)
//     const domaines = majDomaines(this.state, message.exchange, message.message)
//     this.setState({domaines})
//   })
//   // processMessageProtege = comlinkProxy(message => {
//   //   const domaines = majDomaines(this.state, '3.protege', message.message)
//   //   this.setState({domaines})
//   // })
//
//   render() {
//     const children = this.props.children
//     return React.Children.map(children, (child, i) => {
//       const clone = React.cloneElement(child, {domaines: this.state.domaines})
//       return clone
//     })
//   }
//
// }

// Charge la liste courante des noeuds
async function chargerListeNoeuds(websocketApp, noeud_id) {
  // console.debug("Charger liste noeuds")
  const requete = {}
  if(noeud_id) {
    requete.noeud_id = noeud_id
    requete.all_info = true
  }

  var reponseNoeuds = await websocketApp.requeteListeNoeuds(requete)
  // console.debug("Reponse noeuds : %O", reponseNoeuds)

  if(!reponseNoeuds) reponseNoeuds = []

  // console.debug("Liste noeuds\n%O", reponseNoeuds)
  // const epochCourant = new Date().getTime() / 1000
  var noeuds = reponseNoeuds.map(noeud=>{
    const derniereModification = noeud['_mg-derniere-modification']
    const infoNoeud = mapperNoeud(noeud, derniereModification)
    return infoNoeud
  })

  // Trier la liste par descriptif, avec Principal en premier
  noeuds = trierNoeuds(noeuds)

  return noeuds
}

// Detecter nouveau noeud, ajoute a la liste
function majNoeuds(noeuds, niveauSecurite, message) {
  // console.debug("Message update monitor recu :\n%O", message)
  const noeud_id = message.noeud_id
  const estampille = message['en-tete'].estampille
  const valeursMaj = mapperNoeud(message, estampille)

  var noeudsCourants = [...noeuds]
  var trouve = false
  for(let idx in noeudsCourants) {
    var noeudCourant = noeudsCourants[idx]
    if(noeudCourant.noeud_id === noeud_id) {
      // Copier le noeud et remplacer l'instance dans l'array
      noeudCourant = Object.assign({}, noeudCourant)
      noeudsCourants[idx] = noeudCourant

      noeudCourant = Object.assign(noeudCourant, valeursMaj)

      trouve = true
      break  // Noeud id trouve, plus rien a faire
    }
  }

  if(!trouve) {
    // Nouveau noeud, on l'ajoute a la liste
    noeudsCourants.push(valeursMaj)
    noeudsCourants = trierNoeuds(noeudsCourants)
  }

  // console.debug("Liste noeuds maj:\n%O", noeudsCourants)

  return noeudsCourants
}

function trierNoeuds(noeuds) {
  return noeuds.sort((a,b)=>{
    if(a === b) return 0
    if(!a || !a.descriptif) return -1
    if(!b || !b.descriptif) return 1
    if(a.descriptif === 'Principal') return -1
    if(b.descriptif === 'Principal') return 1
    return a.descriptif.localeCompare(b.descriptif)
  })
}

function mapperNoeud(noeudInfo, derniereModification) {
  // console.debug("NOEUD RECU : %O", noeudInfo)

  var actif = true
  const epochCourant = new Date().getTime() / 1000
  if(epochCourant > derniereModification + 60) {
    actif = false
  }

  var principal = false
  var securite = noeudInfo.securite
  if(!noeudInfo.parent_noeud_id && securite === '3.protege') {
    principal = true
  }

  var descriptif = noeudInfo.nom
  if(!descriptif && principal) {
    if(noeudInfo.domaine) descriptif = noeudInfo.domaine + ' (P)'
    else descriptif = 'Principal'
  } else {
    descriptif = noeudInfo.domaine || noeudInfo.fqdn || noeudInfo.noeud_id
  }

  const mappingNoeud = {
    descriptif,
    actif,
    securite,
    principal,
    parent_noeud_id: noeudInfo.parent_noeud_id,
    noeud_id: noeudInfo.noeud_id,
    ip_detectee: noeudInfo.ip_detectee,
    fqdn: noeudInfo.fqdn_detecte,
    date: derniereModification,
    domaine: noeudInfo.domaine,
  }

  const champsOptionnels = ['services', 'containers', 'consignation_web', 'applications_configurees']
  champsOptionnels.forEach(champ=>{
    if(noeudInfo[champ]) mappingNoeud[champ] = noeudInfo[champ]
  })

  return mappingNoeud
}

// Charge la liste courante des noeuds
async function chargerListeDomaines(websocketApp) {
  const reponseDomaines = await websocketApp.requeteListeDomaines()

  // console.debug("Liste domaines\n%O", reponseDomaines)

  var domaines = reponseDomaines.map(domaine=>{
    const derniereModification = domaine['_mg-derniere-modification']
    const infoDomaine = mapperDomaine(domaine, derniereModification)
    return infoDomaine
  })

  // Trier la liste par descriptif, avec Principal en premier
  domaines = trierDomaines(domaines)

  return domaines
}

// Detecter nouveau noeud, ajoute a la liste
function majDomaines(domaines, niveauSecurite, message) {
  // console.debug("Message update domaines recu :\n%O", message)
  const noeud_id = message.noeud_id
  const estampille = message['en-tete'].estampille

  // const estampille = message['en-tete'].estampille
  // const valeursMaj = {
  //   descriptif: message.domaine
  // }
  const valeursMaj = mapperDomaine(message, estampille)

  var domainesCourants = [...domaines]
  var trouve = false
  for(let idx in domainesCourants) {
    var domaineCourant = domainesCourants[idx]
    if(domaineCourant.descriptif === valeursMaj.descriptif) {
      // Copier le noeud et remplacer l'instance dans l'array
      domaineCourant = Object.assign({}, domaineCourant)
      domainesCourants[idx] = domaineCourant

      domaineCourant = Object.assign(domaineCourant, valeursMaj)

      trouve = true
      break  // Noeud id trouve, plus rien a faire
    }
  }

  if(!trouve) {
    // Nouveau noeud, on l'ajoute a la liste
    domainesCourants.push(valeursMaj)
    domainesCourants = trierNoeuds(domainesCourants)
  }

  // console.debug("Liste noeuds maj:\n%O", noeudsCourants)

  return domainesCourants
}

function trierDomaines(domaines) {
  return domaines.sort((a,b)=>{
    if(a === b) return 0
    if(!a || !a.descriptif) return -1
    if(!b || !b.descriptif) return 1
    return a.descriptif.localeCompare(b.descriptif)
  })
}

function mapperDomaine(domaineInfo, derniereModification) {
  var actif = true
  const epochCourant = new Date().getTime() / 1000
  if(epochCourant > derniereModification + 60) {
    actif = false
  }

  var descriptif = domaineInfo.domaine
  var noeud_id = domaineInfo.noeud_id

  const mappingDomaine = {
    descriptif,
    actif,
    noeud_id,
  }

  return mappingDomaine
}
