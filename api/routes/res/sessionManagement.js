// const rabbitMQ = require('./rabbitMQ');
const {
    generateRegistrationChallenge,
    parseRegisterRequest,
    generateLoginChallenge,
    parseLoginRequest,
    verifyAuthenticatorAssertion,
} = require('@webauthn/server');
const crypto = require('crypto');
// const pki = require('./pki')

class SessionManagement {

  constructor(rabbitMQParIdmg) {
    this.rabbitMQParIdmg = rabbitMQParIdmg;
    this.timer;
    this.session_timeout = process.env.COUPDOEIL_SESSION_TIMEOUT || (60 * 1000);
    this.session_timeout = Number(this.session_timeout);
    this.transferTokens = {};
    this.challenges = {};
    this.pinTemporaireDevice = {};  // PIN utilise pour ajouter un device

    // Certificat du maitre des cles. Permet de transmettre des fichiers
    // de maniere securisee.
    this.certMaitreDesCles = null;
  }

  start() {
    // Cleanup des sessions expirees aux 5 minutes
  }

  clean() {
    let expiredTokens = [], expiredChallenges = [];
    let tempsCourant = (new Date()).getTime();

    for(var tokenKey in this.transferTokens) {
      let token = this.transferTokens[tokenKey];
      if(token.expiration < tempsCourant) {
        expiredTokens.push(tokenkey)
      }
    };
    tempsCourant.forEach(tokenKey=>{
      // console.debug("Expiration token transfert " + tokenKey);
      delete this.transferTokens[tokenKey];
    });

    for(var challengeIdmg in this.challenges) {
      let token = this.challenges[challengeIdmg];
      if(token.expiration < tempsCourant) {
        expiredTokens.push(challengeIdmg)
      }
    };
    tempsCourant.forEach(challengeIdmg=>{
      delete this.challenges[challengeIdmg];
    });

  }

  createTokenTransfert(idmg) {
    var token = crypto.randomBytes(20).toString('hex');
    this.transferTokens[token] = {
      expiration: (new Date()).getTime() + 60000,
      idmg,
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
        return token;
      }
    }
    return false;
  }

  conserverChallenge(idmg, challenge) {
    this.challenges[idmg] = {
      expiration: (new Date()).getTime() + 60000,
      challenge,
    };
  }

  consommerChallenge(idmg) {
    const challengeEnveloppe = this.challenges[idmg];
    if(challengeEnveloppe) {
      delete this.challenges[idmg];
      return challengeEnveloppe.challenge;
    }
    return false;
  }

  createPinTemporaireDevice(idmg) {
    var pin = ''+crypto.randomBytes(4).readUInt32BE();
    pin = pin.substring(0, 6);
    this.pinTemporaireDevice[idmg] = {
      'pin': pin,
      'expiration': (new Date()).getTime() + 120000
    };
    return pin;
  }

  consommerPinTemporaireDevice(idmg, pin) {
    var infoPin = this.pinTemporaireDevice[idmg];
    delete this.pinTemporaireDevice[idmg]; // On enleve le PIN a la premiere tentative

    if(infoPin && pin === infoPin.pin && infoPin.expiration>=(new Date()).getTime())  {
      // console.info("PIN Temporaire Device correct");
      return true;
    }
    return false;
  }

  // Authentification de l'usager avec la MilleGrille fournie en parametre
  // Retourne la connexion a RabbitMQ si l'authentification reussi.
  // Lance une erreur en cas d'echec
  authentifier(socket, params) {
    // console.debug("Authentifier");
    // console.debug(params);

    return new Promise((resolve, reject)=>{
      // Lier a l'instance de RabbitMQ correspondant a l'identificateur de MilleGrille
      const idMillegrille = params.idMillegrille;
      const idmg = idMillegrille;  // TODO: Faire lookup
      const rabbitMQ = this.rabbitMQParIdmg[idmg];

      if(!rabbitMQ) {
        // La MilleGrille est inconnue
        reject(new Error("L'identificateur MilleGrille '" + idMillegrille + "' n'est pas connu"));

      } else if(params.methode === 'effectuerEmpreinte') {
        console.debug("Effectuer l'empreinte de la MilleGrille");
        this.effectuerEmpreinte(rabbitMQ, socket, params)
        .then(()=>resolve(rabbitMQ)).catch(err=>reject(err));
      } else if(params.methode === 'ajouterTokenUSB') {
        console.debug("Ajouter un token a la MilleGrille avec un PIN");
        this.ajouterTokenUSB(rabbitMQ, socket, params)
        .then(()=>resolve(rabbitMQ)).catch(err=>reject(err));
      } else if(params.methode === 'genererCertificat') {
        console.debug("Generer un certificat de navigateur pour la MilleGrille avec un PIN");
        this.genererCertificat(rabbitMQ, socket, params)
        .then(()=>resolve(rabbitMQ))
        .catch(err=>{
          console.warn("Erreur challenge certificat, essayer USB");
          this.creerChallengeUSB(rabbitMQ, socket).then(()=>resolve(rabbitMQ)).catch(err=>reject(err));
        })
      } else if(params.methode === 'certificatLocal') {
        // console.debug("Authentification par certificat");
        let fingerprint = params.fingerprint;
        let certificat = params.certificat;
        resolve(
          this.creerChallengeCertificat(rabbitMQ, socket, fingerprint, certificat)
          .then(()=>rabbitMQ)
          .catch(err=>{
            console.warn("Erreur challenge certificat, essayer USB");
            this.creerChallengeUSB(rabbitMQ, socket).then(()=>resolve(rabbitMQ)).catch(err=>reject(err));
          })
        );
      } else if (params.methode === 'tokenUSB') {
        console.debug("Authentification par securityKey USB");
        this.creerChallengeUSB(rabbitMQ, socket).then(()=>resolve(rabbitMQ)).catch(err=>reject(err));
      } else {
        // Erreur d'Authentification
        socket.emit('erreur.login', {'erreur': 'methode inconnue', 'methode': params.methode});
        socket.disconnect();
        return reject(new Error("Erreur d'authentification, methode inconnue: " + params.methode));
      }
    });
  }

  creerChallengeUSB(rabbitMQ, socket) {
    // Authentifier le socket
    let filtre = {"_mg-libelle": "cles"};

    return rabbitMQ.get_document(
      'millegrilles.domaines.Principale', filtre)
    .then( doc => {
      // console.log(doc);
      if (!doc || doc.empreinte_absente) {
          socket.emit('challenge', {'erreur': 'empreinte_absente'});
          socket.disconnect();
          return;
      }
      return generateLoginChallenge(doc.cles);
    })
    .then(challenge_genere=>{
      // console.log("Challenge login");

      return new Promise((resolve, reject) => {
        socket.emit('challengeTokenUSB', challenge_genere, reply => {
          // console.log("/login-challenge appele");
          // console.log(reply);

          const { challenge, keyId } = parseLoginRequest(reply);
          if (!challenge) {
            // console.debug("Challenge pas recu")
            return reject('Challenge pas initialise');
          }

          if (challenge_genere.challenge !== challenge) {
            return reject('Challenge mismatch');
          }

          let filtre = {"_mg-libelle": "cles"};
          rabbitMQ.get_document(
            'millegrilles.domaines.Principale', filtre)
          .then( doc => {
            // console.log(doc);
            if (!doc || doc.empreinte_absente) {
              return reject('Doc absent ou empreinte_absente==true');
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
              return reject("Cle inconnue: " + cle_id_utilisee);
            }

            const loggedIn = verifyAuthenticatorAssertion(reply, cle_match);

            socket.emit('login', loggedIn);
            if(loggedIn) {
              resolve();
            } else {
              reject('Invalid authenticator assertion');
            }
          })
        });
      })
      .catch( err => {
        socket.emit('erreur.login', {'erreur': ''+err});
        socket.disconnect();
      });
    });
  }

  recevoirReponseChallengeCertificat(socket, challenge, reponse) {
    // console.debug("Reponse challenge certificat");
    // console.debug(reponse);
    const bufferReponse = Buffer.from(reponse.reponseChallenge, 'base64');
    // console.debug(bufferReponse.toString('utf-8'));
    // console.debug("Challenge original")
    // console.debug(challenge);
    // console.debug(challenge.toString('hex'));

    const challengeOriginalHex = challenge.toString('hex');
    const reponseHex = bufferReponse.toString('utf-8');

    if(challengeOriginalHex === reponseHex) {
      // Ok
      // console.debug("Reponse challenge ok");
      return true;
    } else {
      console.warn("Challenge et reponse differents");
      return false;
    }
  }

  creerChallengeCertificat(rabbitMQ, socket, fingerprint, pemCertificat) {
    // console.debug("Requete verification " + fingerprint);
    const pki = rabbitMQ.pki;

    let requete = {'fingerprint': fingerprint};
    return rabbitMQ.transmettreRequete(
      'requete.millegrilles.domaines.Pki.confirmerCertificat', requete)
    .then( reponseCertVerif => {
      // console.debug("Reponse verification certificat");
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
          const certificat = pki.chargerCertificatPEM(pemCertificat);
          // console.log(certificat);

          return new Promise((resolve, reject) => {
            pki.genererKeyAndIV((err, randVal)=>{
              if(err) {
                return reject('Erreur generation random secret')
              }

              // Crypter un challenge pour le navigateur
              const challenge = randVal.key;
              let challengeCrypte = pki.crypterContenuAsymetric(certificat.publicKey, challenge);
              socket.emit('challengeCertificat', {challengeCrypte}, reponse => {
                const loggedIn = this.recevoirReponseChallengeCertificat(socket, challenge, reponse);
                socket.emit('login', loggedIn);
                if(loggedIn) {
                  resolve();
                } else {
                  reject("Not logged in");
                }
              });
            });
          });

        } else {
          throw new Error('Role certificat doit inclure coupdoeil.navigateur');
        }

      } else {
        throw new Error('Certificat invalide');
      }
    })
    .catch(err=>{
      console.info("Erreur authentification par certificat");
      console.info(err);
      // socket.emit('erreur.login', {'erreur': ''+err});
      // socket.disconnect();
      throw new Error("Erreur authentification par certificat");
    });

  }

  genererCertificat(rabbitMQ, socket, opts) {
    if(!opts) opts = {};
    const {pin, clePublique, sujet} = opts;

    // console.debug("Requete verification " + fingerprint);
    const pki = rabbitMQ.pki;
    const idmg = pki.idmg;

    // Verifier que le pin est correct
    let pinCorrect = this.consommerPinTemporaireDevice(idmg, pin);

    if(pinCorrect) {
      // console.log("generercertificat: sujet %s, clePublique %s", sujet, clePublique);

      // Creer la transaction pour creer le certificat de navigateur
      const transaction = {
        'sujet': sujet,
        'cle_publique': clePublique,
      };

      return rabbitMQ.transmettreTransactionFormattee(
        transaction, 'millegrilles.domaines.MaitreDesCles.genererCertificatNavigateur'
      )
      .then( msg => {
        // console.log("Recu certificat pour navigateur");
        let messageContent = decodeURIComponent(escape(msg.content));
        let certificatInfo = JSON.parse(messageContent);
        // console.log(messageContent);

        // Transmettre nouveau certificat, confirmer le login avec succes
        socket.emit('certificatGenere', certificatInfo);
        socket.emit('login', true);
      })
      .catch( err => {
        console.error("Erreur message");
        console.error(err);
        socket.emit('erreur.login', "Erreur creation certificat")
        socket.emit('login', false);
      });

    } else {
      console.warn("generercertificat pin incorrect: " + pin);
      socket.emit("erreur", "PIN invalide");
      return Promise.resolve();
    }
  }

  ajouterTokenUSB(rabbitMQ, socket, opts) {
    if(!opts) opts = {};
    const {pin} = opts;
    const idmg = rabbitMQ.pki.idmg;

    // Verifier que le pin est correct
    let pinCorrect = this.consommerPinTemporaireDevice(idmg, pin);

    if(pinCorrect) {

      // Verifier que la MilleGrille n'a pas deja d'empreinte usager
      let filtre = {"_mg-libelle": "cles"};
      return rabbitMQ.get_document(
        'millegrilles.domaines.Principale', filtre)
      .then( doc => {

        // Transmettre le challenge
        const challengeResponse = generateRegistrationChallenge({
            relyingParty: { name: 'coupdoeil' },
            user: { id: idmg, name: 'usager' }
        });
        console.debug("Conserver challenge pour idmg %s", opts.idmg);
        this.conserverChallenge(idmg, challengeResponse.challenge);

        return new Promise((resolve, reject)=>{
          socket.emit('challengeTokenUSBRegistration', challengeResponse, reponse=>{

            const { key, challenge } = parseRegisterRequest(reponse);

            const challengeConserve = this.consommerChallenge(idmg);
            if (challengeConserve !== challenge) {
              reject(new Error("Challenge incorrect, ajout token echoue"));
            } else {

              const infoToken = {
                  'cle': key
              }

              // Noter que la transaction va echouer si l'empreinte a deja ete creee.
              rabbitMQ.transmettreTransactionFormattee(
                infoToken, 'millegrilles.domaines.Principale.ajouterToken')
              .then( msg => {
                // console.log("Recu confirmation d'ajout de nouveau token");
                // console.log(msg);
                resolve();
              })
              .catch( err => {
                console.error("Erreur message");
                console.error(err);

                reject(err);
              });

            }
          });
        })

      })
      .then(()=>{
        socket.emit('login', true);
      })
      .catch( err => {
        console.error("Erreur initialiser-empreinte");
        console.error(err);
        socket.emit("erreur.login", "Erreur initialiser-empreinte");
        socket.emit('login', false);
      });

    } else {
      socket.emit("erreur.login", "Erreur PIN incorrect");
      socket.emit('login', false);
    }

  }

  effectuerEmpreinte(rabbitMQ, socket, opts) {
    if(!opts) opts = {};
    const idmg = rabbitMQ.pki.idmg;

    // Verifier que la MilleGrille n'a pas deja d'empreinte usager
    let filtre = {"_mg-libelle": "cles"};
    return rabbitMQ.get_document(
      'millegrilles.domaines.Principale', filtre)
    .then( doc => {

      if(doc['empreinte_absente'] !== true) {
        socket.emit("erreur", "Empreinte deja appliquee");
        socket.emit('login', false);
        throw new Error("Empreinte deja appliquee");
      } else {
        // Transmettre le challenge
        const challengeResponse = generateRegistrationChallenge({
            relyingParty: { name: 'coupdoeil' },
            user: { id: idmg, name: 'usager' }
        });
        console.debug("Conserver challenge pour idmg %s", opts.idmg);
        this.conserverChallenge(idmg, challengeResponse.challenge);

        return new Promise((resolve, reject)=>{
          socket.emit('challengeTokenUSBRegistration', challengeResponse, reponse=>{

            const { key, challenge } = parseRegisterRequest(reponse);

            const challengeConserve = this.consommerChallenge(idmg);
            if (challengeConserve !== challenge) {
              reject(new Error("Challenge incorrect, ajout token echoue"));
            } else {

              const infoToken = {
                  'cle': key
              }

              // Noter que la transaction va echouer si l'empreinte a deja ete creee.
              rabbitMQ.transmettreTransactionFormattee(
                infoToken, 'millegrilles.domaines.Principale.creerEmpreinte')
              .then( msg => {
                // console.log("Recu confirmation d'empreinte");
                // console.log(msg);
                resolve();
              })
              .catch( err => {
                console.error("Erreur message");
                console.error(err);

                reject(err);
              });

            }
          });
        })

      }

    })
    .then(()=>{
      socket.emit('login', true);
    })
    .catch( err => {
      console.error("Erreur initialiser-empreinte");
      console.error(err);
      socket.emit("erreur", "Erreur initialiser-empreinte");
      socket.emit('login', false);
    });
  }

  // Ajoute un socket et attend l'evenement d'authentification
  addSocketConnection(socket) {
    return new Promise((resolve, reject)=>{
      socket.on('authentification', params=>{
        this.authentifier(socket, params)
        .then(rabbitMQ=>{
          resolve(rabbitMQ);
        })
        .catch(err=>{
          reject(err);
        })
      });

      socket.emit("authentifier", {});
    });
  }

}

// const sessionManagement = new SessionManagement();
// sessionManagement.start();

module.exports = {SessionManagement};
