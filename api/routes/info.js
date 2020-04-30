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

  // const infoPromise = new Promise((resolve, reject)=>{
  //
  //   const info = {
  //     modeHebergement,
  //   };
  //
  //   if( ! modeHebergement && idmg ) {
  //     info.idmg = idmg;
  //
  //     // Aller chercher l'information sur la MilleGrille, verifier si empreinte
  //     // a deja ete faite.
  //     const rabbitMQ = sessionManagement.rabbitMQParIdmg[idmg];
  //
  //     const routing = 'millegrilles.domaines.Principale';
  //     const filtre = {"_mg-libelle": "cles"};
  //
  //     rabbitMQ.get_document(
  //       'millegrilles.domaines.Principale', filtre)
  //     .then(doc=>{
  //       if (!doc || doc.empreinte_absente) {
  //         info.empreinte = false;
  //       } else {
  //         info.empreinte = true;
  //       }
  //       resolve(info);
  //     })
  //     .catch(err=>{
  //       // On n'a pas recu l'information, on continue.
  //       console.warn("Erreur reception info/config.json");
  //       console.warn(err);
  //     })
  //     .finally(()=>{
  //       resolve(info);
  //     });
  //
  //   } else {
  //     resolve(info);
  //   }
  //
  // })
  // .then(info=>{
    router.get('/info.json', (req, res, next)=>{

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
        console.debug(reponse);

        res.setHeader('Content-Type', 'application/json');
        res.end(reponse);

      })
      .catch(err=>{
        // On n'a pas recu l'information, on continue.
        console.warn("Erreur reception info/config.json");
        console.warn(err);
        res.sendStatus(500);
      });

    });
  // });

  return router;

}

module.exports = {initialiserInfo};
