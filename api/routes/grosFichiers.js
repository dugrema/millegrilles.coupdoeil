var express = require('express');
var router = express.Router();
var fs = require('fs');
var sessionManagement = require('./res/sessionManagement');
var multer = require('multer');
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');
const fichierProcesseur = require('./res/fichierProcesseur');
const pki = require('./res/pki')

var stagingFolder = process.env.MG_STAGING_FOLDER || "/tmp/coupdoeilStaging";
var multer_fn = multer({dest: stagingFolder}).array('grosfichier');
const serveurConsignation = process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers';

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

router.use(bodyParser.urlencoded({ extended: false }));
router.use(authentication);  // Utilise pour transfert de fichiers
router.use(multer_fn);

router.put('/nouveauFichier', function(req, res) {
  // console.log('Fichiers recus');
  // console.log(req.files);

  console.debug("*** BODY ***");
  console.debug(req.body);
  var repertoire_uuid = req.body.repertoire_uuid;
  req.files.forEach(fichier=>{
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
