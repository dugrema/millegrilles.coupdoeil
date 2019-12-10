const crypto = require('crypto');

function str2ab(str) {

  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;

}

export class CryptageAsymetrique {

  algorithm = "RSA-OAEP";
  hashFunction = "SHA-256";

  genererKeyPair() {
    return new Promise((resolve, reject)=>{

      if(window && window.crypto && window.crypto.subtle) {
        console.log("SubtleCrypto est disponible, on l'utilise pour generer les cles");

        window.crypto.subtle.generateKey(
          {
            name: this.algorithm,
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: this.hashFunction
          },
          true,
          ["encrypt", "decrypt"]
        )
        .then(keyPair=>{
          console.log("Cles generees");
          console.log(keyPair);

          window.crypto.subtle.exportKey('spki', keyPair.publicKey)
          .then(clePublique=>{
            console.log(clePublique);
            window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
            .then(clePrivee=>{
              console.log(clePrivee);

              let cles = {
                clePrivee: btoa(String.fromCharCode.apply(null, new Uint8Array(clePrivee))),
                clePublique: btoa(String.fromCharCode.apply(null, new Uint8Array(clePublique))),
              };

              console.log(cles);

              resolve(cles);
            })
          })
        })


      } else {
        throw(Object({erreur: "Pas de Subtle Crypto"}));
      }

    });
  }

  crypterCleSecrete(clePublique, cleSecrete, iv) {
    // var keyByteString = forge.util.bytesToHex(cleSecrete);

    console.log("Crypter cle secrete");
    console.log(clePublique);
    let clePubliqueBuffer = str2ab(window.atob(clePublique));
    console.log(clePubliqueBuffer);
    console.log(cleSecrete);

    return window.crypto.subtle.importKey(
      'spki',
      clePubliqueBuffer,
      {
        name: this.algorithm,
        hash: this.hashFunction,
      },
      true,
      ["encrypt"]
    )
    .then(clePubliqueImportee=>{

      console.log("Cle publique chargee");
      console.log(clePubliqueImportee);

      return window.crypto.subtle.encrypt(
        {
          name: this.algorithm
        },
        clePubliqueImportee,
        cleSecrete
      );

    });

  }

  decrypterCleSecrete(cleSecreteCryptee, clePrivee) {
    console.log("Decrypter cle secrete");
    console.log(clePrivee);
    let clePriveeBuffer = str2ab(window.atob(clePrivee));
    console.log(clePriveeBuffer);
    console.log("Cle secrete cryptee");
    console.log(cleSecreteCryptee);

    return window.crypto.subtle.importKey(
      'pkcs8',
      clePriveeBuffer,
      {
        name: this.algorithm,
        hash: this.hashFunction,
      },
      true,
      ["decrypt"]
    )
    .then(clePriveeImportee=>{

      console.log("Cle privee chargee");
      console.log(clePriveeImportee);

      let cleSecreteCrypteeBuffer = str2ab(window.atob(cleSecreteCryptee));

      return window.crypto.subtle.decrypt(
        {
          name: this.algorithm
        },
        clePriveeImportee,
        cleSecreteCrypteeBuffer
      );

    })
    .then(cleSecreteDecryptee=>{
      console.log("Cle secrete decryptee");
      console.log(cleSecreteDecryptee);
      let cleSecreteB64 = btoa(String.fromCharCode.apply(null, new Uint8Array(cleSecreteDecryptee)));
      console.log(cleSecreteB64);
      return cleSecreteB64;
    });

  }
}

export class CryptageSymetrique {

  genererCleSecreteIv() {
    var cleSecreteLocal = null;
    var cleSecreteExporteeLocal = null;

    return crypto.subtle.generateKey(
      {
        name: 'AES-CBC',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    ).then(cleSecrete=>{
      cleSecreteLocal = cleSecrete;

      // Exporter et crypter cle secrete
      return crypto.subtle.exportKey('raw', cleSecrete);
    })
    .then(cleSecreteExportee=>{
      cleSecreteExporteeLocal = cleSecreteExportee;

      const iv = new ArrayBuffer(16);
      let ivView = new Uint8Array(iv);
      window.crypto.getRandomValues(ivView);

      return({
        cleSecrete: cleSecreteLocal,
        cleSecreteExportee: cleSecreteExporteeLocal,
        iv
      });
    });
  }

  crypterContenu(buffer) {
    var clesIvLocal = null;
    return this.genererCleSecreteIv()
    .then(clesIv=>{
      clesIvLocal = clesIv;
      console.log(clesIv.cleSecrete);
      console.log('Cle secrete : ' + btoa(String.fromCharCode.apply(null, new Uint8Array(clesIv.cleSecreteExportee))));
      console.log('iv : ' + btoa(String.fromCharCode.apply(null, new Uint8Array(clesIv.iv))));

      return crypto.subtle.encrypt(
        {
          name: "AES-CBC",
          iv: clesIv.iv
        },
        clesIv.cleSecrete,
        buffer
      )
    })
    .then(bufferCrypte=>{
      return ({...clesIvLocal, bufferCrypte});
    });
  }

  chargerCleSecrete(cleBase64, ivBase64) {
    let cle = atob(cleBase64);
    let iv = atob(ivBase64);
    // console.log(cle);
    // console.log(iv);

    let ivABView = new Uint8Array(iv.length);
    for(let i=0; i<iv.length; i++) {
      ivABView[i] = iv.charCodeAt(i);
    }
    console.log(ivABView);

    let cleABView = new Uint8Array(cle.length);
    for(let i=0; i<cle.length; i++) {
      cleABView[i] = cle.charCodeAt(i);
    }
    console.log(cleABView);

    // Importer cle secrete format subtle
    return crypto.subtle.importKey(
      'raw',
      cleABView,
      {
        name: 'AES-CBC',
        length: 256,
      },
      false,
      ['decrypt']
    )
    .then(cleSecreteSubtle=>{
      console.log("Cle subtle");
      console.log(cleSecreteSubtle);

      return {cleSecrete: cleSecreteSubtle, iv: ivABView};
    });

  }

  decrypterContenu(buffer, cleSecrete, iv) {

    return crypto.subtle.decrypt(
      {name: "AES-CBC", iv: iv},
      cleSecrete,
      buffer
    );

  }

}

export class MilleGrillesCryptoHelper {

  algorithm = 'aes-256-cbc';  // Meme algorithme utilise sur MG en Python
  rsaAlgorithm = 'RSA-OAEP';
  cryptageAsymetrique = new CryptageAsymetrique();

  crypter(dictACrypter, clePublique) {
    return new Promise((resolve, reject)=>{
      let contenuACrypter = JSON.stringify(dictACrypter);

      this.creerCipherKey()
      .then(cipher_key_iv=>{

        let {cipher, key, iv} = cipher_key_iv;
        let keyString = key.toString('base64');
        let ivString = iv.toString('base64');
        console.log("Secrets key=" + keyString + ", iv=" + ivString);

        let contenuCrypte = cipher.update(contenuACrypter, 'utf8', 'base64');
        contenuCrypte += cipher.final('base64');
        console.log("Contenu crypte: " + contenuCrypte);

        let resultat = {contenu: contenuACrypter, contenuCrypte, cleSecrete: keyString, iv: ivString};
        if(clePublique) {
          this.cryptageAsymetrique.crypterCleSecrete(clePublique, key)
          .then(cleSecreteCryptee=>{
              resultat.cleSecreteCryptee = btoa(String.fromCharCode.apply(null, new Uint8Array(cleSecreteCryptee)));
              resolve(resultat);
          })
          .catch(err=>{
            reject(err);
          })
        } else {
          resolve(resultat);
        }

      })
      .catch(err=>{
        reject(err);
      });
    })
  }

  // Genere un cipher et crypter la cle secrete
  creerCipherCrypterCleSecrete(clePublique) {
    return new Promise((resolve, reject)=>{
      this.creerCipherKey()
      .then(cipher_key_iv=>{
        let {cipher, key, iv} = cipher_key_iv;
        let keyString = key.toString('base64');
        let ivString = iv.toString('base64');
        console.log("Secrets key=" + keyString + ", iv=" + ivString);

        // TODO : Crypter cle secrete avec la clePublique

        let resultat = {cipher, cleSecrete: keyString, iv: ivString};
        resolve(resultat);

      })
      .catch(err=>{
        reject(err);
      });
    })
  }

  genererSecret(callback) {
    var lenBuffer = 16 + 32;
    crypto.pseudoRandomBytes(lenBuffer, (err, pseudoRandomBytes) => {
      // Creer deux buffers, iv (16 bytes) et password (24 bytes)
      var iv = pseudoRandomBytes.slice(0, 16);
      var key = pseudoRandomBytes.slice(16, pseudoRandomBytes.length);
      callback(err, {key: key, iv: iv});
    });
  }

  creerCipherKey() {
    let promise = new Promise((resolve, reject) => {
      this.genererSecret((err, {key, iv})=>{
        if(err) {
          reject(err);
        }

        console.log("Creer cipher");
        var cipher = crypto.createCipheriv(this.algorithm, key, iv);

        resolve({cipher, key, iv});
      });
    });

    return promise;
  }

  decrypter(contenuCrypte, cleSecrete, iv) {
    return new Promise((resolve, reject)=>{

      let cleSecreteBuffer = str2ab(window.atob(cleSecrete));
      let ivBuffer = str2ab(window.atob(iv));

      console.log("Creer decipher secretKey: " + cleSecreteBuffer.toString('base64') + ", iv: " + ivBuffer.toString('base64'));
      var decipher = crypto.createDecipheriv(this.algorithm, cleSecreteBuffer, ivBuffer);

      console.log("Decrypter " + contenuCrypte.toString('base64'));
      let contenuDecrypteString = decipher.update(contenuCrypte, 'base64',  'utf8');
      contenuDecrypteString += decipher.final('utf8');

      console.debug("Contenu decrypte :");
      console.debug(contenuDecrypteString);

      let dictDecrypte = JSON.parse(contenuDecrypteString);
      console.log("Dict decrypte: ");
      console.log(dictDecrypte);

      resolve(contenuDecrypteString);
    });
  }

}
