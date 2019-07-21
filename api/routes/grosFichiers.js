var express = require('express');
var router = express.Router();
var fs = require('fs');
var sessionManagement = require('./res/sessionManagement');
var multer = require('multer');
var httpProxy = require('http-proxy');
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');
const fichierProcesseur = require('./res/fichierProcesseur');

var stagingFolder = process.env.MG_STAGING_FOLDER || "/tmp/uploadStaging";
var multer_fn = multer({dest: stagingFolder}).array('grosfichier');
const serveurConsignation = 'https://dev2.maple.mdugre.info:3003'; // process.env.MG_CONSIGNATION_HTTP ||

var proxy = httpProxy.createProxyServer({
  secure: process.env.MG_HTTPPROXY_SECURE !== 'false' && true
});

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
  console.log('Fichiers recus');
  console.log(req.files);

  req.files.forEach(fichier=>{
    fichierProcesseur.ajouterFichier(fichier, serveurConsignation)
    .then(params => {
      console.debug("Traitement fichier termine: ");
      console.debug(params);
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

  let targetFile = req.url.replace('/local', '');
  let fuuide = req.body.fuuide;
  let repertoire_fichiers = '/grosFichiers/local';
  console.debug("local fichier: " + targetFile + " fuuide: " + fuuide);

  let headers = {
    fuuide: req.body.fuuide,
    nomfichier: req.body.nomfichier,
    contenttype: req.body.contenttype,
  }

  // delete req.body;

  let targetProxy =
    serveurConsignation + path.join(repertoire_fichiers, fuuide);
  console.debug("Proxying vers: " + targetProxy);

  // Connecter au proxy,
  const options = {
    url: targetProxy,
    headers: headers,
    strictSSL: false,
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
