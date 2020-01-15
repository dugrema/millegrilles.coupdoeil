import React from 'react';

export class Feuille extends React.Component {

  render() {

    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">

          {this.props.children}

        </div>
      </div>
    );
  }

}
