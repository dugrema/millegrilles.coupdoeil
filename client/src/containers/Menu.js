import React, {useCallback} from 'react'

import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'

import { Trans } from 'react-i18next';

import { IconeConnexion } from '@dugrema/millegrilles.reactjs'

function MenuItems(props) {
    console.debug("Menu props : %O", props)

    const { etatConnexion, changerPage, cleMillegrille, setCleMillegrille } = props

    const changerPageCb = useCallback(param => {
      const params_split = param.split('/')
      var paramsAdditionnels = {}
      if(params_split.length > 1) {
        for(let idx in params_split) {
          if(idx === 0) continue
          var paramCombine = params_split[idx]
          var keyValue = paramCombine.split(':')
          paramsAdditionnels[keyValue[0]] = keyValue[1]
        }
      }

      // Simuler un event avec value et dataset
      const info = {
        value: params_split[0],
        dataset: paramsAdditionnels,
      }
      changerPage({currentTarget: info})

    }, [changerPage])

    return (
      <Nav className="mr-auto" activeKey={props.section} onSelect={changerPageCb}>

        <Nav.Item>
            <Nav.Link eventKey='Instances'>
                <Trans>menu.Instances</Trans>
            </Nav.Link>
        </Nav.Item>

        <Nav.Item>
            <Nav.Link eventKey='Domaines'>
                <Trans>menu.Domaines</Trans>
            </Nav.Link>
        </Nav.Item>

        <DropDownUsager {...props} />

        <Nav.Item>
            <IconeConnexion connecte={etatConnexion} />
        </Nav.Item>

        <Nav.Item>
            <IconeCleMillegrille cleMilleGrille={cleMillegrille} setCleMillegrille={setCleMillegrille} />
        </Nav.Item>

      </Nav>
    )
}

export default MenuItems

function DropDownUsager(props) {

  const nomUsager = props.usager?props.usager.nomUsager:''

  let linkUsager = <><i className="fa fa-user-circle-o"/> {nomUsager}</>
  if(!nomUsager) linkUsager = 'Parametres'

  return (
      <NavDropdown title={linkUsager} id="basic-nav-dropdown" drop="down" className="menu-item">
        <NavDropdown.Item>
          <i className="fa fa-language" /> {' '} Changer Langue
        </NavDropdown.Item>
        <NavDropdown.Item href="/millegrilles">
          <i className="fa fa-home" /> {' '} Portail
        </NavDropdown.Item>
        <NavDropdown.Item href="/millegrilles/authentification/fermer">
          <i className="fa fa-close" /> {' '} Deconnecter
        </NavDropdown.Item>
      </NavDropdown>
  )

}

function IconeCleMillegrille(props) {
  const {cleMilleGrille, setCleMillegrille} = props

  const clickCle = useCallback(()=>{
    console.debug("Click cle")
    setCleMillegrille('')
  }, [])

  if(!cleMilleGrille) return ''

  return (
    <span className="icone-cle-millegrille"><a onClick={clickCle}><i className="fa fa-key"/></a></span>
  )

}
