import React from 'react'

import {Backup} from './Backup'
import {PageConfigurationNoeudsListe as ConfigurationNoeuds} from './ConfigurationNoeudsListe'
import {InterfacePrincipale as Principale} from './Principale.js'
import {Parametres} from './Parametres.js'
import {Hebergement} from './Hebergement'
import {Pki} from './Pki.js'
import {Accueil} from './Accueil.js'
import {SommaireNoeud} from './Noeud'
import {SommaireDomaine} from './Domaine'

import {ParametresCataloguesApplications} from './DomaineCatalogueApplications'
import {ParametresGrosFichiers} from './DomaineGrosFichiers'
import {DomaineMaitredescles} from './DomaineMaitredescles'

const domainesConnus = {
  Accueil,
  Principale,
  Backup,
  ConfigurationNoeuds,
  Parametres,
  Hebergement,
  Pki,
  SommaireNoeud,
  SommaireDomaine,
  CatalogueApplications: ParametresCataloguesApplications,
  MaitreDesCles: DomaineMaitredescles,
  GrosFichiers: ParametresGrosFichiers,
};

export function SectionContenu(props) {

  const Page = domainesConnus[props.rootProps.page]

  let contenu
  if(Page) {
    contenu = <Page rootProps={props.rootProps} />
  } else {
    contenu = <p>Section non definie : "{props.rootProps.page}"</p>
  }

  return contenu
}
