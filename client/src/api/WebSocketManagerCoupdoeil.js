import {WebSocketManager} from './WebSocketManager'
import openSocket from 'socket.io-client'
import { solveRegistrationChallenge, solveLoginChallenge } from '@webauthn/client'

export class WebSocketManagerCoupdoeil extends WebSocketManager {

  constructor(opts) {
    super()

    if(!opts) opts = {}
    this.opts = opts

    this.path = opts.path || '/coupdoeil/socket.io'
    // this.websocketManager = new WebSocketManager()

    this.callbackModeProtege = null
    this.timeoutModeProtege = null
  }

  async connecter() {
    console.debug("Connecter socket.io")
    const socket = this.openSocketHelper()
    await this.enregistrerEvenementsGeneriques(socket)
    this.setupWebSocket(socket)
  }

  deconnecter() {
    console.debug("Deconnecter socket.io")
  }

  openSocketHelper() {
    let socket
    if(this.opts.reconnection) {
      socket = openSocket('/', {
        path: this.path,
        reconnection: true,
        reconnectionAttempts: 30,
        reconnectionDelay: 500,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5
      });
    } else {
      socket = openSocket('/', {
        path: this.path,
        reconnection: false,
      });
    }

    return socket;
  }


  async enregistrerEvenementsGeneriques(socket) {
    socket.on('erreur', erreur=>{
      console.error("Erreur recue par Socket.IO");
      console.error(erreur);
    })

    socket.on("challengeU2f", async (message, callback) => {
      console.debug("Message authentifier U2F")
      console.debug(message)
      try {
        const credentials = await solveLoginChallenge(message)
        callback(credentials)   // Callback du challenge via websocket
      } catch(err) {
        console.error("Erreur challenge reply")
        console.error(err)
      }
    })

    socket.on("confirmationModeProtege", confirmation => {
      console.debug("Mode protege active : %s", confirmation.actif)
      this.callbackModeProtege(confirmation.actif)
    })

    socket.on('disconnect', () => {
      console.debug("Deconnexion")
    });

    await new Promise((resolve, reject)=>{
      const echecTimeout = setTimeout(()=>{
        reject({erreur: true, cause: "Timeout login Socket.IO"})
      }, 15000);

      socket.on('erreur.login',
        erreur => {
          console.error("Erreur connexion");
          console.error(erreur);
          clearTimeout(echecTimeout)
          reject({erreur: true, cause: erreur.erreur || erreur})
        }
      ) // erreur.login

      socket.on('pret', confirmation=>{
        console.debug("Message pret recu");
        console.debug(confirmation)

        // Transmettre confirmation de login
        clearTimeout(echecTimeout)
        if(confirmation.login) {
          resolve(confirmation)
        } else {
          reject({erreur: true, cause: "Login Socket.IO refuse"})
        }
      }) // Pret

    }) // Premise connexion

  }

  demandeActiverModeProtege() {
    if(!this.timeoutModeProtege) {
      console.debug("WebsocketManagerCoupdoeil : Demande activation mode protege")
      this.socket.emit("activerModeProtege")
      this.timeoutModeProtege = setTimeout(() => {this.clearTimeoutModeProtege()}, 5000)

      return new Promise((resolve, reject) => {
        this.callbackModeProtege = (resultat) => {
          console.debug("Callback : %s", resultat)

          // Nettoyage
          this.callbackModeProtege = null
          this.clearTimeoutModeProtege()

          if(resultat) {
            resolve()
          } else {
            reject()
          }
        }
      })
    }

    throw new Error("Demande deja faite")
  }

  clearTimeoutModeProtege() {
    console.debug("Clear timeout")
    try {
      if(this.timeoutModeProtege) {
        clearTimeout(this.timeoutModeProtege)
      }
      if(this.callbackModeProtege) {
        this.callbackModeProtege(false)
      }
    } catch(err) {
      console.error("Erreur nettoyage timeout mode protege")
    }

    this.callbackModeProtege = null
    this.timeoutModeProtege = null
  }

  desactiverModeProtege() {
    console.debug("Desactiver mode protege")
  }

}
