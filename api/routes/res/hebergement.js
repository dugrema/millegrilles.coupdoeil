const {decoderMessage} = require('./rabbitMQ')

// Constantes
REQUETE_MILLEGRILLES_ACTIVES = 'requete.millegrilles.domaines.Hebergement.requeteMilleGrillesActives';
REQUETE_TROUSSEAU = 'requete.millegrilles.domaines.MaitreDesCles.trousseauHebergement';

class HebergementCoupdoeil {

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
          this.demarrerHebergementIdmg(idmg, infoMilleGrille);
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

  async demarrerHebergementIdmg(idmg, infoMilleGrille) {
    console.info("Demarrage hebergement %s", idmg);
    console.debug(infoMilleGrille);

    const requete = {'idmg': [idmg]}
    const trousseau = decoderMessage(await this.mq.transmettreRequete(REQUETE_TROUSSEAU, requete));
    const {certificat_pem, certificats, cle, motdepasse_chiffre} = trousseau.resultats[0];

    console.debug("Trousseau pour MilleGrille %s", idmg);
    console.debug(trousseau);

    const motDePasse = await this.mq.pki.decrypterAsymetrique(motdepasse_chiffre);
    console.debug("Mot de passe dechiffre : %s", motDePasse);

    // const certPems = {
    //   millegrille: certMillegrillePem,
    //   cert: certPem,
    //   key: keyPem,
    // };
    // const pki = new PKIUtils(certPems);
    //
    // console.info("Init PKI");
    // pki.chargerPEMs(certPems);
    //
    // // Connexion a RabbitMQ
    // // amqps://mq:5673/[idmg]
    // const rabbitMQ = new RabbitMQWrapper(pki);
    // const mqConnectionUrl = process.env.MG_MQ_URL;
    // await rabbitMQ.connect(mqConnectionUrl);
    //
    // this.millegrilles[idmg] = {
    //   rabbitMQ,
    // }
  }

}

module.exports = {HebergementCoupdoeil};
