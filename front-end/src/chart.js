/* Module pour les graphiques */
import React from 'react';

var d3 = require('d3');

const NOM_VARIABLE_TEMPORELLE = 'timestamp';

// Charte 2D
// props:
//  - name: nom unique du div id
//  - donnees: liste des donnees
//  - serie: nom de la variable pour ordonnee1 dans donnees
//  - serie2: nom de la variable pour ordonnee2 dans donnees
//  - serie3: nom de la variable pour ordonnee3 dans donnees
//  - min: Minimum par defaut sur ordonnee - sera ajuste avec les donnees
//  - max: Maximum par defaut sur ordonnee - sera ajuste avec les donnees
//  - tick: Espace entre lignes sur l'ordonnee
export class GraphiqueCharte2D extends React.Component {

  state = {
  }

  elemementSvg = null;

  componentDidMount() {
    const graphique = {};
    graphique.idDiv = "#" + this.props.name;

    this.setState({graphique});
  }

  trouverValeur(datapoint, ordonnees, fonction) {
    var donnees = [];
    for(var idx in ordonnees) {
      var nomPoint = ordonnees[idx];
      donnees.push(datapoint[nomPoint]);
    }

    var resultat = fonction.apply(Math, donnees);

    return resultat;
  }

  appliquerDonnees() {
    const graphique = this.state.graphique;

    var ordonnees = [this.props.serie];
    if(this.props.serie2) {
      ordonnees.push(this.props.serie2);
    }
    if(this.props.serie3) {
      ordonnees.push(this.props.serie3);
    }

    // Cleanup donnees, on garde juste les points avec des donnees pour l'ordonnee
    const donnees = [];
    for(var idx in this.props.donnees) {
      var donnee = this.props.donnees[idx];
      if(donnee[ordonnees[0]]) {
        donnees.push(donnee);
      }
    }

    graphique.ordonnee_base_max = this.props.max || 100;
    graphique.ordonnee_base_min = this.props.min || 0;
    graphique.ordonnee_tick = this.props.tick || 1;

    // Set the dimensions of the canvas / graph
    // Si le containerId existe, on l'utilise pour obtenir la largeur de l'ecran
    graphique.margin = {top: 30, right: 20, bottom: 30, left: 50};
    if(this.props.containerId) {
      var bounds = d3.select('div#'+this.props.containerId).node().getBoundingClientRect();
      graphique.width = bounds.width - graphique.margin.left - graphique.margin.right;
      graphique.height = Math.round(graphique.width * 0.45) - graphique.margin.top - graphique.margin.bottom;
    } else {
      // On met des valeurs arbitraires pour le graphique
      graphique.width = 600 - graphique.margin.left - graphique.margin.right;
      graphique.height = 270 - graphique.margin.top - graphique.margin.bottom;
    }

    // Set the ranges
    graphique.x_range = d3.scaleTime().range([0, graphique.width]);
    graphique.y_range = d3.scaleLinear().range([graphique.height, 0]);

    if(this.elementSvg) {
      // Cleanup si graphique existe deja
      this.elementSvg.selectAll('*').remove();
    } else {
      this.elementSvg = d3.select(graphique.idDiv)
          .append("svg")
          .attr("width", graphique.width + graphique.margin.left + graphique.margin.right)
          .attr("height", graphique.height + graphique.margin.top + graphique.margin.bottom)
          .append("g")
          .attr("transform",
                "translate(" + graphique.margin.left + "," + graphique.margin.top + ")");
    }

    // Scale the range of the data
    graphique.x_range.domain(
      d3.extent(donnees, function(d) { return d[NOM_VARIABLE_TEMPORELLE]*1000; })
    );

    // Simuler des donnees pour introduire le range par defaut
    let val_base_min = {}; val_base_min[ordonnees[0]] = graphique.ordonnee_base_min;
    let val_base_max = {}; val_base_max[ordonnees[0]] = graphique.ordonnee_base_max;
    let range_y_extremes = [
      val_base_min, // Mettre les extremes habituels
      val_base_max]  // de temperature
      .concat(donnees); // Ajouter donnees reeles pour allonger au besoin

    graphique.y_range.domain([
      d3.min(range_y_extremes, d => {return this.trouverValeur(d, [this.props.serie], Math.min)}),
      d3.max(range_y_extremes, d => {return this.trouverValeur(d, [this.props.serie], Math.max)}),
    ]);

    for(var idx in ordonnees) {
      var ordonnee = ordonnees[idx];
      console.log("Path, ordonnee " + ordonnee);

      var valueLine = d3.line()
          .x(d => { return graphique.x_range(d[NOM_VARIABLE_TEMPORELLE]*1000); })
          .y(d => { return graphique.y_range(d[ordonnee]); });

      // Add the valueline path.
      this.elementSvg.append("path")
         .datum(donnees)
         .attr("class", "line")
         .attr("d", valueLine);

      // Add the scatterplot
      this.elementSvg.selectAll("dot")
          .data(donnees)
          .enter()
          .append("circle")
          .attr("class", "maximum")
          .attr("r", 3.5)
          .attr("cx", d => { return graphique.x_range(d[NOM_VARIABLE_TEMPORELLE]*1000); })
          .attr("cy", d => { return graphique.y_range(d[ordonnee]); });
    }

    // Add the X Axis
    this.elementSvg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + graphique.height + ")")
        .call(d3.axisBottom(graphique.x_range));

    // Add the Y Axis
    this.elementSvg.append("g")
        .attr("class", "y axis")
        .call(
          d3.axisLeft(graphique.y_range)
            .ticks(this.ordonnee_tick)
      );
  }

  render() {
    if(this.state.graphique && this.props.donnees) {
      this.appliquerDonnees();
    }

    return (
      <div id={this.props.name}></div>
    );
  }

};
