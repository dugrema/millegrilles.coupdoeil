var express = require('express');
var router = express.Router();
var fs = require('fs');
var sessionManagement = require('./res/sessionManagement');
var multer = require('multer');

var stagingFolder = process.env.MG_STAGING_FOLDER || "/tmp/uploadStaging";
var multer_fn = multer({dest: stagingFolder}).array('grosfichier');

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

router.use(authentication);  // Utilise pour transfert de fichiers
router.use(multer_fn);

router.put('/nouveauFichier', function(req, res, next) {
  // console.log('Fichiers recus');
  // console.log(req.files);
  res.sendStatus(200);
});

module.exports = router;
