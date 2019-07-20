const rabbitMQ = require('./rabbitMQ');
const {
    generateRegistrationChallenge,
    parseRegisterRequest,
    generateLoginChallenge,
    parseLoginRequest,
    verifyAuthenticatorAssertion,
} = require('@webauthn/server');
const crypto = require('crypto');

class SessionManagement {

  constructor() {
    this.timer;
    this.session_timeout = process.env.COUPDOEIL_SESSION_TIMEOUT || (60 * 1000);
    this.session_timeout = Number(this.session_timeout);
    this.transferTokens = {};
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

  addSocketConnection(socket) {
    // Ajoute un socket et demarre l'authentification.

    return new Promise((resolve, reject) => {
      // Authentifier le socket
      let filtre = {"_mg-libelle": "profil.usager"};
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

        socket.emit('challenge', challenge_genere, reply => {
          // console.log("/login-challenge appele");
          // console.log(reply);

            const { challenge, keyId } = parseLoginRequest(reply);
            if (!challenge) {
              // console.debug("Challenge pas recu")
              socket.emit('erreur', {'erreur': 'Challenge pas initialise'});
              socket.disconnect();
              reject();
              return;
            }

            if (challenge_genere.challenge !== challenge) {
              console.warn("Challenge ne match pas");
              socket.emit('erreur', {'erreur': 'Challenge mismatch'});
              socket.disconnect();
              reject();
              return;
            }

            let filtre = {"_mg-libelle": "profil.usager"};
            rabbitMQ.singleton.get_document(
              'millegrilles.domaines.Principale', filtre)
            .then( doc => {
              // console.log(doc);
              if (!doc || doc.empreinte_absente) {
                console.warn("Doc absent ou empreinte_absente trouvee");
                socket.emit('erreur', {'erreur': 'Doc absent ou empreinte_absente==true'});
                socket.disconnect();
                reject();
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
                socket.emit('erreur', {'erreur': 'Cle inconnue'});
                socket.disconnect();
                reject();
                return;
              }

              const loggedIn = verifyAuthenticatorAssertion(reply, cle_match);

              socket.emit('login', loggedIn);
              resolve();
              return;
            }).catch( err => {
              console.error("Erreur login")
              console.error(err);
              socket.emit('erreur', {'erreur': 'Erreur login generique'});
              socket.disconnect();
              reject();
              return;
            });
        });

        return;

      }).catch( err => {
        console.error("Erreur login")
        console.error(err);
        socket.emit('erreur', {'erreur': 'Erreur login - timeout MQ'});
        socket.disconnect();
        reject();
      });
    });
  }

}
const sessionManagement = new SessionManagement();
sessionManagement.start();

module.exports = sessionManagement;
