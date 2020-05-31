import {WebSocketManager} from './WebSocketManager'
import openSocket from 'socket.io-client'

export class WebSocketManagerCoupdoeil {

  constructor(opts) {
    if(!opts) opts = {}
    this.opts = opts

    this.path = opts.path || '/coupdoeil/socket.io'
    this.websocketManager = new WebSocketManager()
  }

  async connecter() {
    console.debug("Connecter socket.io")
    const socket = this.openSocketHelper()
    await this.enregistrerEvenementsGeneriques(socket)
    this.websocketManager.setupWebSocket(socket)
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

    socket.on("authentifier", ()=>{
      console.debug("Message authentifier")
      // socket.emit('authentification', {
      //   methode: 'tokenUSB',
      //   idMillegrille,
      // });
    })

    socket.on('disconnect', () => {
      console.debug("Deconnexion")
    });

    await new Promise((resolve, reject)=>{
      const echecTimeout = setTimeout(()=>{
        reject({erreur: true, cause: "Timeout login Socket.IO"})
      }, 15000);


      socket.on(
        'erreur.login',
        erreur => {
          console.error("Erreur connexion");
          console.error(erreur);
          clearTimeout(echecTimeout)
          reject({erreur: true, cause: erreur.erreur || erreur})
        }
      )

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
      });
    })

  }


}
