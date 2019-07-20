var express = require('express');
var router = express.Router();
var fs = require('fs');
var sessionManagement = require('./res/sessionManagement');

router.put('/nouveauFichier', function(req, res, next) {
  console.log('Fichiers recus!');
  console.log(req.files);
  res.sendStatus(200);
  next();
});

module.exports = router;
