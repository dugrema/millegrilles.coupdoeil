import React from 'react'

import Alert from 'react-bootstrap/Alert'

import Instances from './Instances.js'

// import {Accueil} from './Accueil.js'
import {Backup as CoreBackup} from './Backup'
import {PageConfigurationNoeudsListe as ConfigurationNoeuds} from './ConfigurationNoeudsListe'
import {Parametres} from './Parametres.js'
import {Pki} from './Pki.js'
// import {SommaireDomaine} from './Domaine'

// import ParametresCataloguesApplications from './DomaineCatalogueApplications'
import {ParametresGrosFichiers} from './DomaineGrosFichiers'
// import DomaineMaitredescles from './DomaineMaitredescles'

const Domaines = React.lazy(()=>import('./Domaines'))

const domainesConnus = {
  // Accueil,
  Instances,
  Domaines,

  CoreBackup,
  ConfigurationNoeuds,
  Parametres,
  CorePki: Pki,
  // SommaireDomaine,
  GrosFichiers: ParametresGrosFichiers,
};

function SectionContenu(props) {

  const Page = domainesConnus[props.page]

  if(Page) {
    return (
        <Page {...props} />
    )
  }

  return (
    <Alert variant="warning">
      <Alert.Heading>Section inconnue</Alert.Heading>
      <p>Section non definie : "{props.page}"</p>
    </Alert>
  )
}

export default SectionContenu
