// import {WebSocketManager} from './WebSocketManager'
import {WebSocketManager} from 'millegrilles.common/react/WebSocketManager'
import openSocket from 'socket.io-client'
import { solveRegistrationChallenge, solveLoginChallenge } from '@webauthn/client'

export class WebSocketManagerCoupdoeil extends WebSocketManager {

  constructor(opts) {
    super()

    if(!opts) opts = {}
    this.opts = opts

    this.path = opts.path || '/coupdoeil/socket.io'
  }

  async connecter() {
    console.debug("Connecter socket.io")
    const socket = this.openSocketHelper()
    await this.enregistrerEvenementsGeneriques(socket)
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
    await this.setupWebSocket(socket)
  }

}
