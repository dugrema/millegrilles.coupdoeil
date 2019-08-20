var express = require('express');
var router = express.Router();
var fs = require('fs');
var sessionManagement = require('./res/sessionManagement');
var multer = require('multer');
var bodyParser = require('body-parser');
var path = require('path');
const request = require('request');
const fichierProcesseur = require('./res/fichierProcesseur');
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
    fichierProcesseur.ajouterFichier(fichier, repertoire_uuid, serveurConsignation)
    .then(params => {
      console.debug("Traitement fichier termine: " + params.url);
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
  console.debug("local fichier: " + req.url + " fuuid: " + fuuid);

  let headers = {
    fuuid: req.body.fuuid,
    contenttype: req.body.contenttype,
  }

  // delete req.body;

  let targetConsignation = serveurConsignation + '/grosFichiers/local/' + fuuid;
  console.debug("Transfert vers: " + targetConsignation);
  console.debug(pki.ca);

  // Connecter au serveur consignation.
  const options = {
    url: targetConsignation,
    headers: headers,
    agentOptions: {ca: pki.ca},  // Utilisation certificats SSL internes
  }

  try {
    request(options).pipe(res);
  } catch (ex) {
    logger.error("local erreur");
    logger.error(ex);
    res.sendStatus(500);
  }

  return;
});

module.exports = router;
