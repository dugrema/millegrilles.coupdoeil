import React from 'react'

// import Alert from 'react-bootstrap/Alert'

import Instances from './Instances.js'

const Domaines = React.lazy(()=>import('./Domaines'))

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
