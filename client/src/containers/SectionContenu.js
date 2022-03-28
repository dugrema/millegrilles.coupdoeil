import React from 'react'

import Alert from 'react-bootstrap/Alert'

import Instances from './Instances.js'

import {Accueil} from './Accueil.js'
import {Backup as CoreBackup} from './Backup'
import {PageConfigurationNoeudsListe as ConfigurationNoeuds} from './ConfigurationNoeudsListe'
import {Parametres} from './Parametres.js'
import {Pki} from './Pki.js'
import {SommaireNoeud} from './Noeud'
import {SommaireDomaine} from './Domaine'

// import ParametresCataloguesApplications from './DomaineCatalogueApplications'
import {ParametresGrosFichiers} from './DomaineGrosFichiers'
// import DomaineMaitredescles from './DomaineMaitredescles'

const Domaines = React.lazy(()=>import('./Domaines'))

const domainesConnus = {
  Accueil,
  Instances,
  Domaines,

  CoreBackup,
  ConfigurationNoeuds,
  Parametres,
  CorePki: Pki,
  SommaireNoeud,
  SommaireDomaine,
  // CoreCatalogues: ParametresCataloguesApplications,
  // MaitreDesCles: DomaineMaitredescles,
  GrosFichiers: ParametresGrosFichiers,
};

function SectionContenu(props) {

  const Page = domainesConnus[props.rootProps.page]
  const idmg = props.rootProps.idmg

  if(Page) {
    return (
        <Page 
          workers={props.workers} 
          rootProps={props.rootProps} 
          etatConnexion={props.etatConnexion} 
          idmg={idmg} />
    )
  }

  return (
    <Alert variant="warning">
      <Alert.Heading>Section inconnue</Alert.Heading>
      <p>Section non definie : "{props.rootProps.page}"</p>
    </Alert>
  )
}

export default SectionContenu
