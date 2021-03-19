import React from 'react'

export class SommaireDomaine extends React.Component {

  state = {
    domaine: this.props.rootProps.paramsPage.domaine
  }

  render() {
    return (
      <div>
        <h1>Domaine {this.state.domaine}</h1>
      </div>
    )
  }

}
