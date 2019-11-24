import React from 'react';

import {dateformatter} from '../formatters';

export class DateTimeFormatter extends React.Component {

  renderDernierChangement() {
    let date = this.props.date;

    var maintenant = Math.floor(Date.now()/1000);
    let dateChangement = dateformatter.format_datetime(date);
    let dernierChangementDepuis = maintenant - date;
    dernierChangementDepuis = Math.floor(dernierChangementDepuis / 60);

    let dernierChangementRendered;
    var s;  // Ajouter s (pluriels) au besoin
    if(dernierChangementDepuis < 60) {
      dernierChangementDepuis = Math.max(0, dernierChangementDepuis);
      dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} minutes</span>);
    } else if (dernierChangementDepuis < 1440) {
      dernierChangementDepuis = Math.floor(dernierChangementDepuis / 60);
      if(dernierChangementDepuis > 1) s = 's';
      dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} heure{s}</span>);
    } else if (dernierChangementDepuis < 43200) {
      dernierChangementDepuis = Math.floor(dernierChangementDepuis / 1440);
      if(dernierChangementDepuis > 1) s = 's';
      dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} jour{s}</span>);
    } else if (dernierChangementDepuis < 525600) {
      dernierChangementDepuis = Math.floor(dernierChangementDepuis / 43200);
      dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} mois</span>);
    } else {
      dernierChangementDepuis = Math.floor(dernierChangementDepuis / 525600);
      if(dernierChangementDepuis > 1) s = 's';
      dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} annee{s}</span>);
    }

    return dernierChangementRendered;
  }

  render() {
    return (
      <span className="date">
        {this.renderDernierChangement()}
      </span>
    );
  }

}
