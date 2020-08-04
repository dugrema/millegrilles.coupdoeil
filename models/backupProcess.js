const express = require('express');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const request = require('request');

function initialiserBackupRoute() {
  const router = express.Router();

  // const stagingFolder = process.env.MG_STAGING_FOLDER || "/tmp/coupdoeilStaging";
  // const serveurConsignation = process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers';

  // function authentication(req, res, next) {
  //   // Pour le transfert de fichiers, il faut fournir un token de connexion
  //   let authtoken = req.headers.authtoken || req.body.authtoken;
  //   // console.debug("Headers ");
  //   // console.debug(req.headers);
  //   // console.debug(req.body);
  //   console.debug("AUTH: Recu token " + authtoken);
  //   // console.debug(sessionManagement.transferTokens);
  //   const {idmg} = sessionManagement.consommerToken(authtoken);
  //   if(idmg) {
  //     console.debug("Idmg " + idmg);
  //     const rabbitMQ = sessionManagement.fctRabbitMQParIdmg(idmg);
  //     if(!rabbitMQ) {
  //       console.error("RabbitMQ non disponible pour idmg " + idmg);
  //       res.sendStatus(500);
  //       return;
  //     }
  //     // console.debug("Token consomme: " + authtoken + ", accepte.");
  //     req.authentification = {idmg, rabbitMQ};
  //     next();
  //   } else {
  //     console.error("Token invalide pour transfert fichier" + authtoken);
  //     res.sendStatus(403);
  //   }
  //
  //   return;
  // };

  // const uploadNouveauFichier = multerHandler.single('grosfichier');

  // Configuration router

  // router.use(bodyParserHandler);
  // router.use(authentication);

  // router.put(
  //   '/nouveauFichier',
  //   uploadNouveauFichier,
  //   function(req, res, next) {
  //     // console.debug('*****FICHIERS******');
  //     // console.debug(req.file);
  //     let fichier = req.file;
  //     fichierProcesseurUpload.ajouterFichier(req, fichier, serveurConsignation)
  //     .then(params => {
  //       // console.debug("Traitement fichier termine: " + params);
  //       // console.debug(params);
  //       res.sendStatus(200);
  //     })
  //     .catch(err => {
  //       console.error("Erreur traitement fichier: " + fichier.originalname);
  //       console.error(err);
  //       res.sendStatus(500);
  //     })
  //   }
  // );
  //
  // const noFileMulter = multer();

  router.get('/backup.tar', function(req, res, next) {
    // console.debug("local POST " + req.url);
    console.debug("Headers:\n%O", req.headers);
    // console.debug("/local POST Body: ");
    // console.debug(req.body);

    // let fuuid = req.body.fuuid;
    // let securite = req.body.securite;
    // let extension = req.body.extension;
    // let fingerprint = req.body.fingerprint;
    // console.debug("local fichier: " + req.url + " fuuid: " + fuuid + ", securite: " + securite);

    // const {rabbitMQ} = req.authentification;
    if(!req.session.estProprietaire) {
      return res.sendStatus(403)  // Download backup disponible pour proprio uniquement
    }

    let promiseStream = Promise.resolve(res);
    promiseStream.then(pipe => {
      // console.debug("Debut download fichier " + fuuid);
      return _pipeFileToResult(req, res, pipe);
    })
    .catch(err=>{
      console.error("Erreur download backup.tar\n%O", err);
      res.sendStatus(503);
    })

  });

  function _pipeFileToResult(req, res, pipes) {
    // Connecter au serveur consignation.
    let headers = {
      // fuuid: req.body.fuuid,
      // contenttype: req.body.contenttype,
      // securite: securite,
      // extension,
    }

    // let targetConsignation = serveurConsignation + '/grosFichiers/local/' + fuuid;
    // console.debug("Transfert a partir de : " + targetConsignation);

    // const {rabbitMQ} = req.authentification;
    // const pki = rabbitMQ.pki;
    const pki = req.mq.pki

    const domaineFichiers = process.env.MG_CONSIGNATION_HTTP || 'https://fichiers'

    const options = {
      url: domaineFichiers + '/backup/backup.tar',
      headers: headers,
      agentOptions: {
        ca: pki.hoteCA,
        key: pki.cle,
        cert: pki.hotePEM,
      },  // Utilisation certificats SSL internes
    }

    var requestDownload = request(options);
    requestDownload.pipe(pipes);

    requestDownload.on('error', function(err) {
      // Handle error
      console.error("Erreur download fichier");
      console.error(err);
      res.sendStatus(503);
    });

    return requestDownload;
  }

  return router;
}

module.exports = {initialiserBackupRoute};
