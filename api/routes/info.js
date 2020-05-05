const express = require('express');

function initialiserInfo(sessionManagement, opts) {

  const router = express.Router();
  const modeHebergement = opts.hebergement===true;
  const {idmg} = opts;

  const info = {
    modeHebergement,
  };

  if( ! modeHebergement && idmg ) {
    info.idmg = idmg;
  }

  router.get('/info.json', (req, res, next)=>{

    if(!modeHebergement) {
      const rabbitMQ = sessionManagement.fctRabbitMQParIdmg(idmg);

      const routing = 'millegrilles.domaines.Principale';
      const filtre = {"_mg-libelle": "cles"};
      rabbitMQ.get_document(
        'millegrilles.domaines.Principale', filtre)
      .then(doc=>{

        const infoCopie = Object.assign({}, info);

        if (!doc || doc.empreinte_absente) {
          infoCopie.empreinte = false;
        } else {
          infoCopie.empreinte = true;
        }

        const reponse = JSON.stringify(infoCopie);
        // console.debug(reponse);

        res.setHeader('Content-Type', 'application/json');
        res.end(reponse);

      })
      .catch(err=>{
        // On n'a pas recu l'information, on continue.
        console.warn("Erreur reception info/config.json");
        console.warn(err);
        res.sendStatus(500);
      });
    } else {
      // Mode hebergement
      const reponse = JSON.stringify(info);
      res.setHeader('Content-Type', 'application/json');
      res.end(reponse);
    }

  });

  return router;

}

module.exports = {initialiserInfo};