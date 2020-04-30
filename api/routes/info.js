const express = require('express');

function initialiserInfo(sessionManagement, opts) {

  const router = express.Router();
  const modeHebergement = opts.hebergement===true;
  const {idmg} = opts;

  const infoPromise = new Promise((resolve, reject)=>{

    const info = {
      modeHebergement,
    };

    if( ! modeHebergement && idmg ) {
      info.idmg = idmg;

      // Aller chercher l'information sur la MilleGrille, verifier si empreinte
      // a deja ete faite.
      const rabbitMQ = sessionManagement.rabbitMQParIdmg[idmg];

      const routing = 'millegrilles.domaines.Principale';
      const filtre = {"_mg-libelle": "cles"};

      rabbitMQ.get_document(
        'millegrilles.domaines.Principale', filtre)
      .then(doc=>{
        if (!doc || doc.empreinte_absente) {
          info.empreinte = false;
        } else {
          info.empreinte = true;
        }
        resolve(info);
      })
      .catch(err=>{
        // On n'a pas recu l'information, on continue.
        console.warn("Erreur reception info/config.json");
        console.warn(err);
      })
      .finally(()=>{
        resolve(info);
      });

    } else {
      resolve(info);
    }

  })
  .then(info=>{
    router.get('/info.json', (req, res, next)=>{

      const reponse = JSON.stringify(info);
      console.debug(reponse);

      res.setHeader('Content-Type', 'application/json');
      res.end(reponse);

    });
  });

  return router;

}

module.exports = {initialiserInfo};
