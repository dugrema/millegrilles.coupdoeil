/* Module pour les graphiques */

export class GraphiqueCharte2D {

  constructor(parametres) {
    this.svg_pret = false;
    this.donnees = null;

    // Defaults
    this.idDiv = '#graphique_horaire';
    this.nomVariableOrdonnee1 = 'temperature-maximum';
    this.nomVariableOrdonnee1 = 'temperature-minimum';
    this.nombreSeriesDonnees = 1;

    this.ordonnee_base_max = 100;
    this.ordonnee_base_min = 0;

  }

  preparer_graphique() {
    const graphique = new Object();
    this.graphique = graphique;

    const nomVariableOrdonnee1 = this.nomVariableOrdonnee1,
          nomVariableOrdonnee2 = this.nomVariableOrdonnee2;

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

    if (this.nombreSeriesDonnees > 1) {
      graphique.valueline2 = d3.svg.line()
          .x(function(d) { return graphique.x_range(d["periode"]); })
          .y(function(d) { return graphique.y_range(d[nomVariableOrdonnee2]); });
    }
  }

  attacher_svg() {
    const graphique = this.graphique;
    const idDiv = this.idDiv;

    graphique.svg = d3.select(idDiv)
        .append("svg")
        .attr("width", graphique.width + graphique.margin.left + graphique.margin.right)
        .attr("height", graphique.height + graphique.margin.top + graphique.margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + graphique.margin.left + "," + graphique.margin.top + ")");

    this.svg_pret = true;

    // Le rendering a lieu apres l'application des donnees (deja sauvegardees)
    // On lance le calcul d'affichage immediatement.
    if(this.donnees !== null) {
      this.appliquerDonnees(this.donnees);
      this.donnees = null;
    }
  }

  appliquerDonnees(donnees) {
    const graphique = this.graphique;
    const nomVariableOrdonnee1 = this.nomVariableOrdonnee1,
          nomVariableOrdonnee2 = this.nomVariableOrdonnee2;

    // Sauvegarder les donnees temporairement pour affichage des que le
    // rendering est pret.
    this.donnees = donnees;

    // Get the data
    if(this.svg_pret) {
      this.donnees = null;
      // console.log("senseur_historique_horaire.maj_graphique On a des donnees")

      // Scale the range of the data
      graphique.x_range.domain(
        d3.extent(donnees, function(d) { return d["periode"]; })
      );

      // Simuler des donnees pour introduire le range -20 a 10 celsius.
      let val_base_min = {}; val_base_min[nomVariableOrdonnee1] = this.ordonnee_base_min;
      let val_base_max = {}; val_base_max[nomVariableOrdonnee1] = this.ordonnee_base_max;
      let range_y_extremes = [
        val_base_min, // Mettre les extremes habituels
        val_base_max]  // de temperature
        .concat(donnees); // Ajouter donnees reeles pour allonger au besoin
      graphique.y_range.domain([
        d3.min(range_y_extremes, function(d) {
          if(d[nomVariableOrdonnee2] !== undefined) return Math.min(d[nomVariableOrdonnee1], d[nomVariableOrdonnee2]);
          else return d[nomVariableOrdonnee1];
        }),
        d3.max(range_y_extremes, function(d) {
          if(d[nomVariableOrdonnee2] !== undefined) return Math.max(d[nomVariableOrdonnee1], d[nomVariableOrdonnee2]);
          else return d[nomVariableOrdonnee1];
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
          .attr("cx", function(d) { return graphique.x_range(d["periode"]); })
          .attr("cy", function(d) { return graphique.y_range(d[nomVariableOrdonnee1]); });

      if (this.nombreSeriesDonnees > 1) {
        graphique.svg.append("path")
            .attr("class", "line")
            .attr("d", graphique.valueline2(donnees));

        graphique.svg.selectAll("dot")
            .data(donnees)
            .enter()
            .append("circle")
            .attr("class", "minimum")
            .attr("r", 3.5)
            .attr("cx", function(d) { return graphique.x_range(d["periode"]); })
            .attr("cy", function(d) { return graphique.y_range(d[nomVariableOrdonnee2]); });
      }

      // Add the X Axis
      graphique.svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + graphique.height + ")")
          .call(graphique.xAxis);

      // Add the Y Axis
      graphique.svg.append("g")
          .attr("class", "y axis")
          .call(graphique.yAxis);
    }
  }

};
