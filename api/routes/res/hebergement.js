class HebergementCoupdoeil {

  REQUETE_MILLEGRILLES_ACTIVES = 'requete.millegrilles.domaines.Hebergement.requeteMilleGrillesActives';

  constructor(mq) {
    this.mq = mq;
    this.millegrilles = {};
  }

  async executer() {

    try {
      console.debug("Transmettre requete pour MilleGrilles hebergees");
      const reponse = await this.mq.transmettreRequete(REQUETE_MILLEGRILLES_ACTIVES, {});
      const content = JSON.parse(reponse.content.toString('utf-8'));
      const milleGrillesHebergees = content.resultats;
      console.debug("MilleGrilles hebergees");
      console.debug(milleGrillesHebergees);

      // Demarrage hebergement des millegrilles manquantes
      for(let idx in milleGrillesHebergees) {
        const infoMilleGrille = milleGrillesHebergees[idx];
        const idmg = infoMilleGrille.idmg;
        if(!this.millegrilles[idmg]) {
          this.demarrerHebergementIdmg(idmg);
        }
      }

      // Desactiver millegrilles qui ne sont plus dans la liste

    } catch(err) {
      console.error("Erreur entretien hebergement");
      console.error(err);
    } finally {
      // Boucle executer entretien
      setTimeout(() => {this.executer()}, 60000);
    }

  }

  async demarrerHebergementIdmg(idmg) {
    console.info("Demarrage hebergement %s", idmg);
  }

}

module.exports = {HebergementCoupdoeil};
