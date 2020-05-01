const express = require('express');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const request = require('request');

const {ProcesseurUpload, ProcesseurDownloadCrypte} = require('./res/fichierProcesseur');
const {MulterCryptoStorage} = require('./res/multerCryptoStorage');

// const sessionManagement = require('./res/sessionManagement');
// var router = express.Router();
// const pki = require('./res/pki')

function initialiserGrosFichiers(sessionManagement) {
  const router = express.Router();

  const stagingFolder = process.env.MG_STAGING_FOLDER || "/tmp/coupdoeilStaging";
  const serveurConsignation = process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers';

  // Configuration du stockage de fichier securise
  // Va faire deux operations dans le stream (on the fly):
  //   - digest
  //   - cryptage (pour fichier proteges ou secure)
  const multerCryptoStorageHandler = new MulterCryptoStorage({});
  var multerHandler = multer({
    storage: multerCryptoStorageHandler,
    limits: {
      fileSize: 100 * 1024 * 1024,
    }
  });

  const fichierProcesseurUpload = new ProcesseurUpload();
  const fichierProcesseurDownloadCrypte = new ProcesseurDownloadCrypte();

  function _charger_certificat(cb) {
    var mq_cert = process.env.MG_MQ_CERTFILE;
    if(mq_cert !== undefined) {
      fs.readFile(mq_cert, (err, data)=>{
        cb(data);
      });
    }
  }

  // _charger_certificat((cert)=>{
  //   multerCryptoStorageHandler.setCertificatMaitreDesCles(cert);
  // })

  const bodyParserHandler = bodyParser.urlencoded({ extended: true });

  function authentication(req, res, next) {
    // Pour le transfert de fichiers, il faut fournir un token de connexion
    let authtoken = req.headers.authtoken || req.body.authtoken;
    // console.debug("Headers ");
    // console.debug(req.headers);
    // console.debug(req.body);
    console.debug("AUTH: Recu token " + authtoken);
    // console.debug(sessionManagement.transferTokens);
    const {idmg} = sessionManagement.consommerToken(authtoken);
    if(idmg) {
      console.debug("Idmg " + idmg);
      const rabbitMQ = sessionManagement.fctRabbitMQParIdmg(idmg);
      if(!rabbitMQ) {
        console.error("RabbitMQ non disponible pour idmg " + idmg);
        res.sendStatus(500);
        return;
      }
      // console.debug("Token consomme: " + authtoken + ", accepte.");
      req.authentification = {idmg, rabbitMQ};
      next();
    } else {
      console.error("Token invalide pour transfert fichier" + authtoken);
      res.sendStatus(403);
    }

    return;
  };

  const uploadNouveauFichier = multerHandler.single('grosfichier');

  // Configuration router

  router.use(bodyParserHandler);
  router.use(authentication);

  router.put(
    '/nouveauFichier',
    uploadNouveauFichier,
    function(req, res, next) {
      // console.debug('*****FICHIERS******');
      // console.debug(req.file);
      let fichier = req.file;
      fichierProcesseurUpload.ajouterFichier(req, fichier, serveurConsignation)
      .then(params => {
        // console.debug("Traitement fichier termine: " + params);
        // console.debug(params);
        res.sendStatus(200);
      })
      .catch(err => {
        console.error("Erreur traitement fichier: " + fichier.originalname);
        console.error(err);
        res.sendStatus(500);
      })
    }
  );

  const noFileMulter = multer();

  router.post('/local/*', noFileMulter.none(), function(req, res, next) {
    // console.debug("local POST " + req.url);
    // console.debug("Headers: ");
    // console.debug(req.headers);
    // console.debug("/local POST Body: ");
    // console.debug(req.body);

    let fuuid = req.body.fuuid;
    let securite = req.body.securite;
    let extension = req.body.extension;
    let fingerprint = req.body.fingerprint;
    // console.debug("local fichier: " + req.url + " fuuid: " + fuuid + ", securite: " + securite);

    const {rabbitMQ} = req.authentification;

    let promiseStream = null;
    if(securite === '3.protege' || securite === '4.secure') {
      // console.debug("Le fichier est crypte.");

      if(fingerprint) {
        // console.debug("Le navigateur est capable de decrypter, on demande la cle secrete cryptee");
        promiseStream = fichierProcesseurDownloadCrypte.getCleSecreteCryptee(rabbitMQ, fuuid, fingerprint)
        .then((cleIv)=>{
          // Ajouter dict de cle et iv au response header
          res.set(cleIv);

          // Pipe dans le result stream directement
          // Le decryptage va etre fait par le navigateur directement
          return res;
        });

      } else {
        // console.debug("Aucun fingerprint de navigateur, on doit demander un pipe de decryptage");
        // promiseStream = fichierProcesseurDownloadCrypte.getDecipherPipe4fuuid(fuuid)
        // .then(pipeDecipher=>{
        //   pipeDecipher.pipe(res);
        //   return pipeDecipher; // Pipe au travers du decipher
        // })
        throw new Error("Fichier protege/secure - activer le certificat de navigateur pour transfert chiffre end-to-end.");
      }

    } else {
      promiseStream = Promise.resolve(res);
    }

    promiseStream.then(pipe => {
      // console.debug("Debut download fichier " + fuuid);
      return _pipeFileToResult(req, res, pipe, securite);
    })
    .catch(err=>{
      console.error("Erreur download fichier " + fuuid);
      console.error(err);
      res.sendStatus(503);
    })

  });

  function _pipeFileToResult(req, res, pipes, securite) {
    let fuuid = req.body.fuuid;
    let extension = req.body.extension;

    // Connecter au serveur consignation.
    let headers = {
      fuuid: req.body.fuuid,
      contenttype: req.body.contenttype,
      securite: securite,
      extension,
    }

    let targetConsignation = serveurConsignation + '/grosFichiers/local/' + fuuid;
    // console.debug("Transfert a partir de : " + targetConsignation);

    const {rabbitMQ} = req.authentification;
    const pki = rabbitMQ.pki;

    const options = {
      url: targetConsignation,
      headers: headers,
      agentOptions: {
        ca: pki.ca,
        key: pki.cle,
        cert: pki.chainePEM,
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

module.exports = {initialiserGrosFichiers};
