var express = require('express');
var router = express.Router();
var fs = require('fs');
var sessionManagement = require('./res/sessionManagement');
var multer = require('multer');
var httpProxy = require('http-proxy');
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');

var stagingFolder = process.env.MG_STAGING_FOLDER || "/tmp/uploadStaging";
var multer_fn = multer({dest: stagingFolder}).array('grosfichier');

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
  // console.log('Fichiers recus');
  // console.log(req.files);
  res.sendStatus(200);
});

router.post('/local/*', function(req, res, next) {
  console.log("local get");
  console.log(req.url);
  console.log("Headers: ");
  console.log(req.headers);
  // console.log("Body: ");
  // console.log(req.body);

  let targetFile = req.url.replace('/local', '');
  // let fuuide = req.body.fuuide || 'fichier_dummy';
  let fuuide = 'nonon';
  // req.method = 'GET'; // Changer methode a get
  let repertoire_fichiers = '/grosFichiers/local';
  console.log("Fichier: " + targetFile + " fuuide: " + fuuide);

  // delete req.body;

  let targetProxy = 'https://dev2.maple.mdugre.info:3003' +
          path.join(repertoire_fichiers, fuuide);
  const options = {
    url: targetProxy,
    headers: {
      fuuide: req.body.fuuide
    },
    strictSSL: false,
  }
  console.log("Proxying vers: " + targetProxy);

  // L'autentification est OK (fait precedemment)
  // Connexion au proxy
  // res.sendStatus(200);
  // proxy.web(req, res, {
  //     target: targetProxy,
  //     ignorePath: true,
  //     proxyTimeout: 3000,
  //   }, next);
  request(options).pipe(res);
  // req.pipe(request(options)).pipe(res);

  /*request.get(targetProxy, (e,r,body) => {
    console.log("Get 2");
    console.log(r);
  });*/

  // req.pipe(request.get(targetProxy, req.body)).pipe(res);

  return;
});

module.exports = router;
