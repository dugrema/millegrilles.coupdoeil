import React from 'react';
import { Container, Row } from 'react-bootstrap';

export class Feuille extends React.Component {

  render() {

    return (
      <Row className="w3-row-padding">

        <Container className="w3-card w3-round w3-white w3-card_BR">
          {this.props.children}
        </Container>
        
      </Row>

    );
  }

}
