import React from 'react'
import { Nav, Navbar, NavDropdown, NavLink, NavItem, Dropdown, Container, Row, Col} from 'react-bootstrap';
import { Trans, Translation, withTranslation } from 'react-i18next';

export function Menu(props) {
  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        <MenuItems />
        <Nav className="justify-content-end">
          <Nav.Link eventKey={props.languageChangement} onSelect={props.changeLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

function MenuItems(props) {
  return (
    <Nav className="mr-auto" activeKey={props.section}>
      <Nav.Item>
        <Nav.Link eventKey='Principal'>
          <Trans>menu.Principal</Trans>
        </Nav.Link>
      </Nav.Item>
      <Dropdown as={NavItem}>
        <Dropdown.Toggle as={NavLink}><Trans>menu.Parametres</Trans></Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item><Trans>menu.Backup</Trans></Dropdown.Item>
          <Dropdown.Item><Trans>menu.Hebergement</Trans></Dropdown.Item>
          <Dropdown.Item><Trans>menu.Pki</Trans></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </Nav>
  )
}
