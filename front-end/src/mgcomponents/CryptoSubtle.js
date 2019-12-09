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
