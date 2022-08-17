import React from 'react'

// import Alert from 'react-bootstrap/Alert'

import Instances from './Instances.js'

// import {Accueil} from './Accueil.js'
// import {Backup as CoreBackup} from './Backup'
// import {PageConfigurationNoeudsListe as ConfigurationNoeuds} from './ConfigurationNoeudsListe'
// import {Parametres} from './Parametres.js'
// import {Pki} from './Pki.js'
// import {SommaireDomaine} from './Domaine'

// import ParametresCataloguesApplications from './DomaineCatalogueApplications'
// import {ParametresGrosFichiers} from './DomaineGrosFichiers'
// import DomaineMaitredescles from './DomaineMaitredescles'

// const CoreBackup = React.lazy(()=>import('./Backup'))
const Domaines = React.lazy(()=>import('./Domaines'))

// const domainesConnus = {
//   // Accueil,
//   Instances,
//   Domaines,

//   /CoreBackup,
//   ConfigurationNoeuds,
//   Parametres,
//   CorePki: Pki,
//   // SommaireDomaine,
//   GrosFichiers: ParametresGrosFichiers,
// };

function SectionContenu(props) {

  const { sectionAfficher } = props

  // const Page = domainesConnus[props.page]

  let Page = Instances
  switch(sectionAfficher) {
    case 'domaines': Page = Domaines; break
    case 'instances':
    default:
      Page = Instances
  }

  return (
      <Page {...props} />
  )
}

export default SectionContenu
