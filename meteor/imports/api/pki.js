import { Meteor } from 'meteor/meteor';

class PKIUtils {

  constructor() {
    let mq_cacert = process.env.MG_MQ_CAFILE,
        mq_cert = process.env.MG_MQ_CERTFILE,
        mq_key = process.env.MG_MQ_KEYFILE;

    this.cacertFile = mq_cacert;
    this.certFile = mq_cert;
    this.keyFile = mq_key;

    this.cle = null;
    this.cert = null;

    if(Meteor.isServer) {
      this.chargerPEMs();
    }
  }

  chargerPEMs() {
    const fs = require('fs');
    console.log("PKI: Chargement cle " + this.keyFile + " et cert " + this.certFile);
    this.cle = fs.readFileSync(this.keyFile);
    //this.cert = fs.readFileSync(this.certFile);
  }

  _verifierCertificat() {

  }

  signerTransaction(transaction) {

    let signature = 'N/A';
    if(Meteor.isServer) {
      const crypto = require('crypto');
      const sign = crypto.createSign('SHA512');
      const stringify = require('json-stable-stringify');

      // Stringify en json trie
      let transactionJson = stringify(transaction);
      console.log("Message utilise pour signature: " + transactionJson);

      // Creer algo signature et signer
      sign.write(transactionJson);
      signature = sign.sign(this.cle, 'base64');
    }

    return signature;
  }

};

export const PKI = new PKIUtils();
