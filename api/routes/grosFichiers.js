var express = require('express');
var router = express.Router();
var fs = require('fs');
var sessionManagement = require('./res/sessionManagement');
var multer = require('multer');
var httpProxy = require('http-proxy');

var stagingFolder = process.env.MG_STAGING_FOLDER || "/tmp/uploadStaging";
var multer_fn = multer({dest: stagingFolder}).array('grosfichier');

var proxy = httpProxy.createProxyServer({
  secure: false
});

function authentication(req, res, next) {
  let url = req.url;

  if(url.startsWith('/grosFichiers')) {
    // Pour le transfert de fichiers, il faut fournir un token de connexion
    let authtoken = req.headers.authtoken;
    // console.debug("AUTH: Recu token " + authtoken);
    if(sessionManagement.consommerToken(authtoken)) {
      // console.debug("Token consomme: " + authtoken + ", accepte.");
      next();
    } else {
      // console.error("Token invalide pour transfert fichier" + authToken);
      res.sendStatus(403);
    }
  } else {
    // URL n'est pas protege
    next();
  }

  return;
};

// router.use(authentication);  // Utilise pour transfert de fichiers
router.use(multer_fn);

router.put('/nouveauFichier', function(req, res) {
  // console.log('Fichiers recus');
  // console.log(req.files);
  res.sendStatus(200);
});

router.get('/telecharger/*', function(req, res) {

  let targetFile = req.url.replace('/telecharger', '');
  let repertoire_fichiers = '/grosFichiers';
  console.log(targetFile);

  // L'autentification est OK (fait precedemment)
  // Connexion au proxy
  proxy.web(req, res, {
    target: 'https://www.maple.millegrilles.mdugre.info' + repertoire_fichiers + targetFile,
    ignorePath: true
  });
  // res.sendStatus(200);
  return;
});

module.exports = router;
