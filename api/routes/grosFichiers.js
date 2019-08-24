var express = require('express');
var router = express.Router();
var fs = require('fs');
var sessionManagement = require('./res/sessionManagement');
var multer = require('multer');
var bodyParser = require('body-parser');
var path = require('path');
const request = require('request');
const {ProcesseurUpload, ProcesseurDownloadCrypte} = require('./res/fichierProcesseur');
const pki = require('./res/pki')
const multerCryptoStorage = require('./res/multerCryptoStorage');

var stagingFolder = process.env.MG_STAGING_FOLDER || "/tmp/coupdoeilStaging";
const serveurConsignation = process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers';

// Configuration du stockage de fichier securise
// Va faire deux operations dans le stream (on the fly):
//   - digest
//   - cryptage (pour fichier proteges ou secure)
const multerCryptoStorageHandler = multerCryptoStorage({});
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

const bodyParserHandler = bodyParser.urlencoded({ extended: false });

function authentication(req, res, next) {
  // Pour le transfert de fichiers, il faut fournir un token de connexion
  let authtoken = req.headers.authtoken || req.body.authtoken;
  console.debug("AUTH: Recu token " + authtoken);
  if(sessionManagement.consommerToken(authtoken)) {
    // console.debug("Token consomme: " + authtoken + ", accepte.");
    next();
  } else {
    // console.error("Token invalide pour transfert fichier" + authToken);
    res.sendStatus(403);
  }

  return;
};

const uploadNouveauFichier = multerHandler.fields([{name: 'grosfichier', maxCount: 10}]);

// Configuration router

router.use(bodyParserHandler);
router.use(authentication);

router.put(
  '/nouveauFichier',
  uploadNouveauFichier,
  function(req, res, next) {
  // console.log('Fichiers recus');
  // console.log(req.files);

  // console.debug("*** BODY ***");
  // console.debug(req.body);
  var repertoire_uuid = req.body.repertoire_uuid;
  // console.debug('*****FICHIERS******');
  // console.debug(req.files);
  req.files['grosfichier'].forEach(fichier=>{
    fichierProcesseurUpload.ajouterFichier(req, fichier, serveurConsignation)
    .then(params => {
      // console.debug("Traitement fichier termine: " + params);
      // console.debug(params);
    })
    .catch(err => {
      console.error("Erreur traitement fichier: " + fichier.originalname);
      console.error(err);
    })
  });

  res.sendStatus(200);
});

router.post('/local/*', function(req, res, next) {
  console.debug("local POST " + req.url);
  // console.debug("Headers: ");
  // console.debug(req.headers);
  // console.debug("Body: ");
  // console.debug(req.body);

  let fuuid = req.body.fuuid;
  let securite = req.body.securite;
  console.debug("local fichier: " + req.url + " fuuid: " + fuuid + ", securite: " + securite);

  let promiseStream = null;
  if(securite === '3.protege' || securite === '4.secure') {
    console.debug("Le fichier est crypte. On doit demander un pipe de decryptage");
    promiseStream = fichierProcesseurDownloadCrypte.getDecipherPipe4fuuid(fuuid)
    .then(pipeDecipher=>{
      pipeDecipher.pipe(res);
      return pipeDecipher; // Pipe au travers du decipher
    })
  } else {
    promiseStream = new Promise((resolve, reject)=>{
      resolve(res);  // Pipe directement aux resultats
    })
  }

  promiseStream.then(pipe=>{
    _pipeFileToResult(req, res, pipe, securite);
  })
  .catch(err=>{
    console.error("Erreur download fichier");
    console.error(err);
    res.sendStatus(503);
  })

});

function _pipeFileToResult(req, res, pipes, securite) {
  let fuuid = req.body.fuuid;

  // Connecter au serveur consignation.
  let headers = {
    fuuid: req.body.fuuid,
    contenttype: req.body.contenttype,
    securite: securite,
  }

  let targetConsignation = serveurConsignation + '/grosFichiers/local/' + fuuid;
  console.debug("Transfert vers: " + targetConsignation);
  console.debug(pki.ca);

  const options = {
    url: targetConsignation,
    headers: headers,
    agentOptions: {ca: pki.ca},  // Utilisation certificats SSL internes
  }
  try {
    request(options).pipe(pipes);
  } catch (ex) {
    logger.error("local erreur");
    logger.error(ex);
    res.sendStatus(500);
  }
}

module.exports = router;
