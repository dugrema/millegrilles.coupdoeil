import React from 'react'

import {InterfacePrincipale} from './Principale.js'
import {Parametres} from './Parametres.js'
import {Backup} from './Backup'
// import {Pki} from './Pki.js'
// import {Hebergement} from './Hebergement'

const domainesConnus = {
  'Principale': InterfacePrincipale,
  Parametres,
  Backup,
  // Hebergement,
  // Pki,
};

export function SectionContenu(props) {

  const Page = domainesConnus[props.rootProps.page]

  let contenu
  if(Page) {
    contenu = <Page rootProps={props.rootProps} />
  } else {
    contenu = <p>Section non definie : "{contenu}"</p>
  }

  return contenu
}
