const rabbitMQ = require('./rabbitMQ');
const {
    generateRegistrationChallenge,
    parseRegisterRequest,
    generateLoginChallenge,
    parseLoginRequest,
    verifyAuthenticatorAssertion,
} = require('@webauthn/server');

class SessionManagement {

  constructor() {
    this.auth_tokens = {'12345': '0'};
    this.timer;
    this.session_timeout = process.env.COUPDOEIL_SESSION_TIMEOUT || (600 * 1000);
    this.session_timeout = Number(this.session_timeout);
    this.webSockets = [];
  }

  start() {
    // Cleanup des sessions expirees aux 5 minutes
    this.timer = setInterval(() => this.clean(), 5 * 60000);
  }

  clean() {
    // console.debug('Session timeout: ' + this.session_timeout);
    // console.debug("Session cleanup start, " + Object.keys(this.auth_tokens).length + " active sessions");

    // Nettoie les sessions expirees
    var tokens_expire = []
    const current_time_ms = (new Date()).getTime();
    for(var idx_token in this.auth_tokens) {
      if(this.auth_tokens[idx_token] < current_time_ms) {
        tokens_expire.push(idx_token);
      }
    }

    var token_expire = tokens_expire.pop();
    while(token_expire) {
      console.debug("Cleanup token expire " + token_expire);
      delete this.auth_tokens[token_expire];
      token_expire = tokens_expire.pop();
    }

  }

  addSocketConnection(socket) {

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

        socket.on('challenge_reply', reply => {
          console.log("/login-challenge appele");
          console.log(reply);

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

              if(loggedIn) {
                // Session valid for 5 minutes of inactivity
                sessionManagement.addSession(challenge);
              }

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

        socket.emit('challenge', challenge_genere);
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

  addSession(token) {
    this.auth_tokens[token] = (new Date()).getTime() + this.session_timeout;
  }

  checkUpdateToken(token) {
    var token_timeout = this.auth_tokens[token];

    if(!token_timeout || token_timeout < (new Date()).getTime()) {
      // Token inconnu ou expire
      delete this.auth_tokens[token];
      return false;
    }

    // Token est correct, on met a jour le timeout.
    this.auth_tokens[token] = (new Date()).getTime() + this.session_timeout;
    return true;
  }

}
const sessionManagement = new SessionManagement();
sessionManagement.start();

module.exports = sessionManagement;
