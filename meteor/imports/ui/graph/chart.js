/* Module pour les graphiques */

export class GraphiqueCharte2D {

  constructor() {
    this.svg_pret = false;
    this.donnees_affichees = false;

    this.nomVariableOrdonnee1 = 'temperature-moyenne';

    // Preparer l'objet et dimensions du graphique
    this.preparer_graphique();
  }

  preparer_graphique() {
    const graphique = new Object();
    this.graphique = graphique;

    const nomVariableOrdonnee1 = this.nomVariableOrdonnee1;

    // Set the dimensions of the canvas / graph
    graphique.margin = {top: 30, right: 20, bottom: 30, left: 50};
    graphique.width = 600 - graphique.margin.left - graphique.margin.right;
    graphique.height = 270 - graphique.margin.top - graphique.margin.bottom;

    // Set the ranges
    graphique.x_range = d3.time.scale().range([0, graphique.width]);
    graphique.y_range = d3.scale.linear().range([graphique.height, 0]);

    // Define the axes
    graphique.xAxis = d3.svg.axis().scale(graphique.x_range).orient("bottom").ticks(5);
    graphique.yAxis = d3.svg.axis().scale(graphique.y_range).orient("left").ticks(5);

    // Define the line
    graphique.valueline = d3.svg.line()
        .x(function(d) { return graphique.x_range(d["periode"]); })
        .y(function(d) { return graphique.y_range(d[nomVariableOrdonnee1]); });
  }

  attacher_svg() {
    const graphique = this.graphique;

    graphique.svg = d3.select("#graphique_horaire")
        .append("svg")
        .attr("width", graphique.width + graphique.margin.left + graphique.margin.right)
        .attr("height", graphique.height + graphique.margin.top + graphique.margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + graphique.margin.left + "," + graphique.margin.top + ")");

    this.svg_pret = true;
  }

  appliquerDonnees(donnees) {
    const graphique = this.graphique;
    const nomVariableOrdonnee1 = this.nomVariableOrdonnee1;

    // Get the data
    if(donnees !== undefined && this.svg_pret) {
      // console.log("senseur_historique_horaire.maj_graphique On a des donnees")

      // Scale the range of the data
      graphique.x_range.domain(
        d3.extent(donnees, function(d) { return d["periode"]; })
      );

      let range_y_extremes = [
        {nomVariableOrdonnee1: -10}, // Mettre les extremes habituels
        {nomVariableOrdonnee1: 20}]  // de temperature
        .concat(donnees); // Ajouter donnees reeles pour allonger au besoin
      graphique.y_range.domain([
        d3.min(range_y_extremes, function(d) { return d[nomVariableOrdonnee1]; }),
        d3.max(range_y_extremes, function(d) { return d[nomVariableOrdonnee1]; })
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
          .attr("r", 3.5)
          .attr("cx", function(d) { return graphique.x_range(d["periode"]); })
          .attr("cy", function(d) { return graphique.y_range(d[nomVariableOrdonnee1]); });

      // Add the X Axis
      graphique.svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + graphique.height + ")")
          .call(graphique.xAxis);

      // Add the Y Axis
      graphique.svg.append("g")
          .attr("class", "y axis")
          .call(graphique.yAxis);
    } else {
      // if(donnees === undefined) console.log("senseur_historique_horaire.maj_graphique: Pas de donnees");
      // if(graphique === undefined) console.log("senseur_historique_horaire.maj_graphique: Pas de graphique");
    }

    this.donnees_affichees = true;
  }

};
