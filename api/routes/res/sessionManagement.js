const rabbitMQ = require('./rabbitMQ');
const {
    generateRegistrationChallenge,
    parseRegisterRequest,
    generateLoginChallenge,
    parseLoginRequest,
    verifyAuthenticatorAssertion,
} = require('@webauthn/server');
const crypto = require('crypto');
const pki = require('./pki')

class SessionManagement {

  constructor() {
    this.timer;
    this.session_timeout = process.env.COUPDOEIL_SESSION_TIMEOUT || (60 * 1000);
    this.session_timeout = Number(this.session_timeout);
    this.transferTokens = {};
    this.pinTemporaireDevice = null;  // PIN utilise pour ajouter un device

    // Certificat du maitre des cles. Permet de transmettre des fichiers
    // de maniere securisee.
    this.certMaitreDesCles = null;
  }

  start() {
    // Cleanup des sessions expirees aux 5 minutes
  }

  clean() {
    let expiredTokens = [];
    let tempsCourant = (new Date()).getTime();
    for(var tokenKey in this.transferTokens) {
      let token = this.transferTokens[tokenKey];
      if(token.expiration < tempsCourant) {
        expiredTokens.push(tokenkey)
      }
    };

    tempsCourant.forEach(tokenKey=>{
      console.debug("Expiration token transfert " + tokenKey);
      delete this.transferTokens[tokenKey];
    });
  }

  createTokenTransfert() {
    var token = crypto.randomBytes(20).toString('hex');
    this.transferTokens[token] = {
      expiration: (new Date()).getTime() + 60000
    };
    return token;
  }

  consommerToken(tokenKey) {
    // Consomme un token de transfert de fichier
    // Retourne true si le token est valide
    var token = this.transferTokens[tokenKey];
    if(token) {
      delete this.transferTokens[tokenKey]; // Delete si token utilise ou expire
      if(token.expiration>=(new Date()).getTime())  {
        // console.debug("Token consomme " + tokenKey);
        return true;
      }
    }
    return false;
  }

  createPinTemporaireDevice() {
    var pin = ''+crypto.randomBytes(4).readUInt32BE();
    pin = pin.substring(0, 6);
    this.pinTemporaireDevice = {
      'pin': pin,
      'expiration': (new Date()).getTime() + 120000
    };
    return pin;
  }

  consommerPinTemporaireDevice(pin) {
    var infoPin = this.pinTemporaireDevice;
    this.pinTemporaireDevice = null; // On enleve le PIN a la premiere tentative
    if(infoPin && pin === infoPin.pin && infoPin.expiration>=(new Date()).getTime())  {
      console.info("PIN Temporaire Device correct");
      return true;
    }
    return false;
  }

  authentifier(socket, params) {
    console.debug("Authentification");
    console.debug(params);

    if(params.methode === 'certificatLocal') {
      let fingerprint = params.fingerprint;
      this.creerChallengeCertificat(socket, fingerprint);
    } else if (params.methode === 'tokenUSB') {
      this.creerChallengeUSB(socket);
    } else {
      // Erreur d'Authentification
      console.error("Erreur d'authentification, methode inconnue: " + params.methode);
      socket.emit('erreur.login', {'erreur': 'methode inconnue', 'methode': params.methode});
      socket.disconnect();
    }
  }

  creerChallengeUSB(socket) {
    // Authentifier le socket
    let filtre = {"_mg-libelle": "cles"};
    rabbitMQ.singleton.get_document(
      'millegrilles.domaines.Principale', filtre)
    .then( doc => {
      // console.log(doc);
      if (!doc || doc.empreinte_absente) {
          socket.emit('challenge', {'erreur': 'empreinte_absente'});
          socket.disconnect();
          reject();
          return;
      }

      let challenge_genere = generateLoginChallenge(doc.cles);
      // console.log("Challenge login");

      socket.emit('challengeTokenUSB', challenge_genere, reply => {
        // console.log("/login-challenge appele");
        // console.log(reply);

          const { challenge, keyId } = parseLoginRequest(reply);
          if (!challenge) {
            // console.debug("Challenge pas recu")
            socket.emit('erreur.login', {'erreur': 'Challenge pas initialise'});
            socket.disconnect();
            return;
          }

          if (challenge_genere.challenge !== challenge) {
            console.warn("Challenge ne match pas");
            socket.emit('erreur.login', {'erreur': 'Challenge mismatch'});
            socket.disconnect();
            return;
          }

          let filtre = {"_mg-libelle": "cles"};
          rabbitMQ.singleton.get_document(
            'millegrilles.domaines.Principale', filtre)
          .then( doc => {
            // console.log(doc);
            if (!doc || doc.empreinte_absente) {
              console.warn("Doc absent ou empreinte_absente trouvee");
              socket.emit('erreur.login', {'erreur': 'Doc absent ou empreinte_absente==true'});
              socket.disconnect();
              return;
            }

            // Trouve la bonne cle a verifier dans la collection de toutes les cles
            var cle_match;
            let cle_id_utilisee = reply.rawId;

            let cles = doc['cles'];
            for(var i_cle in cles) {
              let cle = cles[i_cle];
              let credID = cle['credID'];
              credID = credID.substring(0, cle_id_utilisee.length);

              if(credID === cle_id_utilisee) {
                cle_match = cle;
                break;
              }
            }

            if(!cle_match) {
              console.error("Cle inconnue: " + cle_id_utilisee);
              console.error(cle_id_utilisee);
              socket.emit('erreur.login', {'erreur': 'Cle inconnue'});
              socket.disconnect();
              return;
            }

            const loggedIn = verifyAuthenticatorAssertion(reply, cle_match);

            socket.emit('login', loggedIn);
          }).catch( err => {
            console.error("Erreur login")
            console.error(err);
            socket.emit('erreur.login', {'erreur': 'Erreur login generique'});
            socket.disconnect();
          });
      });

    }).catch( err => {
      console.error("Erreur login")
      console.error(err);
      socket.emit('erreur.login', {'erreur': 'Erreur login - timeout MQ'});
      socket.disconnect();
    });
  }

  recevoirReponseChallengeCertificat(socket, challenge, reponse) {
    console.debug("Reponse challenge certificat");
    console.debug(reponse);
    const bufferReponse = new Buffer(reponse.reponseChallenge, 'base64');
    console.debug(bufferReponse.toString('utf-8'));
    console.debug("Challenge original")
    console.debug(challenge);
    console.debug(challenge.toString('hex'));

    const challengeOriginalHex = challenge.toString('hex');
    const reponseHex = bufferReponse.toString('utf-8');

    if(challengeOriginalHex === reponseHex) {
      // Ok
      console.debug("Reponse challenge ok");
      socket.emit('login', true);
    } else {
      console.warn("Challenge et reponse differents");
    }
  }

  creerChallengeCertificat(socket, fingerprint) {
    console.debug("Requete verification " + fingerprint);

    let requete = {'fingerprint': fingerprint};
    rabbitMQ.singleton.transmettreRequete(
      'requete.millegrilles.domaines.Pki.confirmerCertificat', requete)
    .then( reponseCertVerif => {
      console.debug("Response verification certificat");
      const contenuResponseCertVerif = JSON.parse(reponseCertVerif.content.toString('utf-8'));
      // console.debug(contenuResponseCertVerif);

      if(contenuResponseCertVerif.valide && contenuResponseCertVerif.roles) {
        // Certificat est valide, on verifie que c'est bien un certificat de navigateur
        const roles = contenuResponseCertVerif.roles;
        let estRoleNavigateur = false;
        for(let idx in roles) {
          let role = roles[idx];
          estRoleNavigateur = estRoleNavigateur || (role === 'coupdoeil.navigateur');
        }
        // console.log(estRoleNavigateur);

        if(estRoleNavigateur === true) {
          // C'est bien un certificat de navigateur. On genere un challenge
          // avec la cle publique.
          let pemCertificat = contenuResponseCertVerif.certificat;
          const certificat = pki.chargerCertificatPEM(pemCertificat);
          // console.log(certificat);

          pki.genererKeyAndIV((err, randVal)=>{
            if(err) {
              console.error("Erreur creation challenge random");
              socket.emit('erreur.login', {'erreur': 'Generation random secret'});
              socket.disconnect();
              return;
            }
            // Crypter un challenge pour le navigateur
            const challenge = randVal.key;
            let challengeCrypte = pki.crypterContenuAsymetric(certificat.publicKey, challenge);
            socket.emit('challengeCertificat',
              {challengeCrypte},
              reponse => {this.recevoirReponseChallengeCertificat(socket, challenge, reponse)}
            )
          });

        } else {
          socket.emit('erreur.login', {'erreur': 'Role certificat doit inclure coupdoeil.navigateur'});
          socket.disconnect();
        }

      } else {
        socket.emit('erreur.login', {'erreur': 'Certificat invalide'});
        socket.disconnect();
      }
    })
    .catch(err=>{
      console.error("Erreur authentification par certificat");
      console.error(err);
    });

  }

  // Ajoute un socket et attend l'evenement d'authentification
  addSocketConnection(socket) {
    socket.on('authentification', params=>{this.authentifier(socket, params)});
  }

}

const sessionManagement = new SessionManagement();
sessionManagement.start();

module.exports = sessionManagement;
