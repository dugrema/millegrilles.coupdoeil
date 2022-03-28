import React from 'react'

import Alert from 'react-bootstrap/Alert'

import Instances from './Instances.js'
import Domaines from './Domaines.js'

import {Accueil} from './Accueil.js'
import {Backup as CoreBackup} from './Backup'
import {PageConfigurationNoeudsListe as ConfigurationNoeuds} from './ConfigurationNoeudsListe'
import {Parametres} from './Parametres.js'
import {Pki} from './Pki.js'
import {SommaireNoeud} from './Noeud'
import {SommaireDomaine} from './Domaine'

import {ParametresCataloguesApplications} from './DomaineCatalogueApplications'
import {ParametresGrosFichiers} from './DomaineGrosFichiers'
import {DomaineMaitredescles} from './DomaineMaitredescles'

const GestionUsagers = React.lazy(_=>import('./GestionUsagers'))

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
  CoreCatalogues: ParametresCataloguesApplications,
  MaitreDesCles: DomaineMaitredescles,
  GrosFichiers: ParametresGrosFichiers,
  GestionUsagers,
};

function SectionContenu(props) {

  const Page = domainesConnus[props.rootProps.page]

  if(Page) {
    return (
        <Page workers={props.workers} rootProps={props.rootProps} etatConnexion={props.etatConnexion} />
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
