/* Module pour les graphiques */
import React from 'react';

var d3 = require('d3');

const NOM_VARIABLE_TEMPORELLE = 'timestamp';

// Charte 2D
// props:
//  - name: nom unique du div id
//  - nomVariableOrdonnee1
//  - nomVariableOrdonnee2: deuxieme ordonnee (optionnel)
//  - donnees: liste des donnees
//  - serie: nom de la variable pour ordonnee1 dans donnees
//  - serie2: nom de la variable pour ordonnee2 dans donnees
//  - min: Minimum par defaut sur ordonnee - sera ajuste avec les donnees
//  - max: Maximum par defaut sur ordonnee - sera ajuste avec les donnees
//  - tick: Espace entre lignes sur l'ordonnee
export class GraphiqueCharte2D extends React.Component {

  state = {
    graphique: null,
  }

  componentDidMount() {
    const graphique = {};

    graphique.nomVariableOrdonnee1 = this.props.serie;
    graphique.nomVariableOrdonnee2 = this.props.serie2;

    graphique.idDiv = "#" + this.props.name;
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
      // console.log("Bounds : " + graphique.width + " x " + graphique.height);
      // console.log(bounds);

    } else {
      // On met des valeurs arbitraires pour le graphique
      graphique.width = 600 - graphique.margin.left - graphique.margin.right;
      graphique.height = 270 - graphique.margin.top - graphique.margin.bottom;
    }

    // Set the ranges
    graphique.x_range = d3.scaleTime().range([0, graphique.width]);
    graphique.y_range = d3.scaleLinear().range([graphique.height, 0]);

    // Define the line
    graphique.valueline = d3.line()
        .x(d => { return graphique.x_range(d[NOM_VARIABLE_TEMPORELLE]*1000); })
        .y(d => { return graphique.y_range(d[graphique.nomVariableOrdonnee1]); });
    if(graphique.nomVariableOrdonnee2) {
      graphique.valueline2 = d3.line()
          .x(d => { return graphique.x_range(d[NOM_VARIABLE_TEMPORELLE]*1000); })
          .y(d => { return graphique.y_range(d[graphique.nomVariableOrdonnee2]); });
    }

    graphique.svg = d3.select(graphique.idDiv)
        .append("svg")
        .attr("width", graphique.width + graphique.margin.left + graphique.margin.right)
        .attr("height", graphique.height + graphique.margin.top + graphique.margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + graphique.margin.left + "," + graphique.margin.top + ")");

    this.setState({graphique});
  }

  appliquerDonnees() {
    const donnees = this.props.donnees;
    const graphique = this.state.graphique;

    // Cleanup si graphique existe deja
    d3.select(graphique.idDiv).select('svg').select('g').selectAll('*').remove();

    // Reajuster la taille du graphique, au besoin
    // if(this.props.containerId) {
    //   var bounds = d3.select('div#'+this.props.containerId).node().getBoundingClientRect();
    //   graphique.width = bounds.width;
    //   graphique.height = Math.round(graphique.width * 0.45);
    // }

    // console.debug("Donnees charte");
    // console.debug(donnees);

    // Scale the range of the data
    graphique.x_range.domain(
      d3.extent(donnees, function(d) { return d[NOM_VARIABLE_TEMPORELLE]*1000; })
    );

    // Simuler des donnees pour introduire le range -20 a 10 celsius.
    let val_base_min = {}; val_base_min[graphique.nomVariableOrdonnee1] = graphique.ordonnee_base_min;
    let val_base_max = {}; val_base_max[graphique.nomVariableOrdonnee1] = graphique.ordonnee_base_max;
    let range_y_extremes = [
      val_base_min, // Mettre les extremes habituels
      val_base_max]  // de temperature
      .concat(donnees); // Ajouter donnees reeles pour allonger au besoin

    graphique.y_range.domain([
      d3.min(range_y_extremes, function(d) {
        if(d[graphique.nomVariableOrdonnee2] !== undefined) return Math.min(d[graphique.nomVariableOrdonnee1], d[graphique.nomVariableOrdonnee2]);
        else return d[graphique.nomVariableOrdonnee1];
      }),
      d3.max(range_y_extremes, function(d) {
        if(d[graphique.nomVariableOrdonnee2] !== undefined) return Math.max(d[graphique.nomVariableOrdonnee1], d[graphique.nomVariableOrdonnee2]);
        else return d[graphique.nomVariableOrdonnee1];
      })
    ]);

    // Add the valueline path.
    graphique.svg.append("path")
       .attr("class", "line")
       .attr("d", graphique.valueline(donnees));

    // Add the scatterplot
    graphique.svg.selectAll("dot")
        .data(donnees)
        .enter()
        .append("circle")
        .attr("class", "maximum")
        .attr("r", 3.5)
        .attr("cx", function(d) { return graphique.x_range(d[NOM_VARIABLE_TEMPORELLE]*1000); })
        .attr("cy", function(d) { return graphique.y_range(d[graphique.nomVariableOrdonnee1]); });

    if (graphique.nomVariableOrdonnee2) {
      graphique.svg.append("path")
          .attr("class", "line")
          .attr("d", graphique.valueline2(donnees));

      graphique.svg.selectAll("dot")
          .data(donnees)
          .enter()
          .append("circle")
          .attr("class", "minimum")
          .attr("r", 3.5)
          .attr("cx", function(d) { return graphique.x_range(d[NOM_VARIABLE_TEMPORELLE]*1000); })
          .attr("cy", function(d) { return graphique.y_range(d[graphique.nomVariableOrdonnee2]); });
    }

    // Add the X Axis
    graphique.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + graphique.height + ")")
        .call(d3.axisBottom(graphique.x_range));

    // Add the Y Axis
    graphique.svg.append("g")
        .attr("class", "y axis")
        .call(
          d3.axisLeft(graphique.y_range)
            .ticks(this.ordonnee_tick)
      );
  }

  render() {
    if(this.state.graphique && this.props.donnees) {
      this.appliquerDonnees();
    } else {
      console.debug("Graphique");
      console.debug(this.state.graphique);
      console.debug("Donnees");
      console.debug(this.props.donnees);
    }

    return (
      <div id={this.props.name}></div>
    );
  }

};
