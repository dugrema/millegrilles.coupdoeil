const express = require('express');

function initialiser(sessionManagement, opts) {

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

      // console.debug("Requete info")

      rabbitMQ.transmettreRequete('Principale.getAuthInfo', {}, {decoder: true})
      .then(doc=>{

        // console.debug("reception info")
        // console.debug(doc)

        const docCles = doc.cles;
        const infoCopie = Object.assign({}, info);

        if (!docCles || docCles.empreinte_absente) {
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

module.exports = {initialiser};
