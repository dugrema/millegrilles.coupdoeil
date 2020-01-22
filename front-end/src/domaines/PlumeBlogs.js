import React from 'react';
import { Feuille } from '../mgcomponents/Feuilles'
import { Form, Button, ButtonGroup, ListGroup, InputGroup,
         Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';

const PREFIX_DATA_URL = 'data:image/jpeg;base64,';

export class PlumeBlogs extends React.Component {

  render() {
    return (
      <div>
        <TitreBlogs/>
      </div>
    )
  }

}

function TitreBlogs(props) {
  return (
    <Feuille>
      <Row>
        <Col>
          <h2 className="w3-opacity"><Trans>plume.blogs.titre</Trans></h2>
        </Col>
      </Row>
    </Feuille>
  )
}
