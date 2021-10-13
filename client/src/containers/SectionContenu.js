import React, {Suspense} from 'react'

import {Backup} from './Backup'
import {PageConfigurationNoeudsListe as ConfigurationNoeuds} from './ConfigurationNoeudsListe'
import {Parametres} from './Parametres.js'
import {Hebergement} from './Hebergement'
import {Pki} from './Pki.js'
import {Accueil} from './Accueil.js'
import {SommaireNoeud} from './Noeud'
import {SommaireDomaine} from './Domaine'

import {ParametresCataloguesApplications} from './DomaineCatalogueApplications'
import {ParametresGrosFichiers} from './DomaineGrosFichiers'
import {DomaineMaitredescles} from './DomaineMaitredescles'

const GestionUsagers = React.lazy(_=>import('./GestionUsagers'))

const domainesConnus = {
  Accueil,
  Backup,
  ConfigurationNoeuds,
  Parametres,
  Hebergement,
  CorePki: Pki,
  SommaireNoeud,
  SommaireDomaine,
  CoreCatalogues: ParametresCataloguesApplications,
  MaitreDesCles: DomaineMaitredescles,
  GrosFichiers: ParametresGrosFichiers,
  GestionUsagers,
};

export function SectionContenu(props) {

  const Page = domainesConnus[props.rootProps.page]

  let contenu
  if(Page) {
    contenu = <Page workers={props.workers} rootProps={props.rootProps} />
  } else {
    contenu = <p>Section non definie : "{props.rootProps.page}"</p>
  }

  return (
    <Suspense fallback={<ChargementEnCours/>}>
      {contenu}
    </Suspense>
  )
}

function ChargementEnCours(props) {
  return <p>Chargement en cours</p>
}
