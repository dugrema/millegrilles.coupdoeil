import React from 'react';
import 'font-awesome/css/font-awesome.min.css';

import {PanneauFichiersListeDetaillee, PanneauFichiersIcones} from '../mgcomponents/FichiersUI.js';

class EcranSample1 extends React.Component {

  state = {
    sampleData_repertoires_flat: {
      "3d6cbf1a-b88d-11e9-936c-02420a000283": {
        "repertoire_uuid": "3d6cbf1a-b88d-11e9-936c-02420a000283",
        "nom": "Cetait un repertoire de test, plus maintenant",
        "securite": "2.prive"
      },
      "9339dc20-b88d-11e9-936d-02420a000283": {
        "repertoire_uuid": "9339dc20-b88d-11e9-936d-02420a000283",
        "nom": "test2",
        "securite": "2.prive"
      },
      "9c0c6a5c-b88d-11e9-936d-02420a000283": {
        "repertoire_uuid": "9c0c6a5c-b88d-11e9-936d-02420a000283",
        "nom": "Machina tata",
        "securite": "2.prive"
      },
      "a06266fa-b8a2-11e9-9370-02420a000283": {
        "repertoire_uuid": "a06266fa-b8a2-11e9-9370-02420a000283",
        "nom": "Bon1",
        "securite": "2.prive"
      }
    },

    sampleData_fichiers_1: {
      "ca46142b-ea76-499a-8ebc-97c085294765": {
          "uuid": "ca46142b-ea76-499a-8ebc-97c085294765",
          "date_v_courante": 1565223308,
          "fuuid_v_courante": "a504fb01-b8b1-11e9-a990-79ce9b13cc60",
          "mimetype": "image/jpeg",
          "nom": "14926376-0-image-a-9_1560844392605.jpg",
          "securite": "2.prive",
          "taille": 122646
      },
      "f4d288ef-f277-4c9e-a5f7-5e0bdf89b36f": {
          "uuid": "f4d288ef-f277-4c9e-a5f7-5e0bdf89b36f",
          "date_v_courante": 1565223308,
          "fuuid_v_courante": "a504fb00-b8b1-11e9-a990-79ce9b13cc60",
          "mimetype": "application/json",
          "nom": "requete.json",
          "securite": "2.prive",
          "taille": 2112
      },
      "e78a7892-6c46-4351-9f97-f1f80f693891": {
          "uuid": "e78a7892-6c46-4351-9f97-f1f80f693891",
          "date_v_courante": 1565223308,
          "fuuid_v_courante": "a504d3f0-b8b1-11e9-a990-79ce9b13cc60",
          "mimetype": "image/jpeg",
          "nom": "the-milo-sugar-controversy-world-of-buzz-5.jpg",
          "securite": "2.prive",
          "taille": 43415
      }
    }
  }

  doubleclickRepertoire = (event) => {
    let uuidRepertoire = event.currentTarget.dataset.repertoireuuid;
    console.debug("Double click repertoire " + uuidRepertoire);
  }

  doubleclickFichier = (event) => {
    let uuidFichier = event.currentTarget.dataset.fichieruuid;
    console.debug("Double click fichier " + uuidFichier);
  }

  copier = (repertoireDestination) => {
    console.debug("Copier vers " + repertoireDestination);
    let selection = this.state.elementsCopierDeplacer;
    for(var uuid in selection) {
      let infoitem = selection[uuid];
      let typeitem = infoitem.type;
      console.debug(typeitem + " " + uuid);
    }
  }

  deplacer = (repertoireDestination) => {
    console.debug("Deplacer vers " + repertoireDestination);
    let selection = this.state.elementsCopierDeplacer;
    for(var uuid in selection) {
      let infoitem = selection[uuid];
      let typeitem = infoitem.type;
      console.debug(typeitem + " " + uuid);
    }

    // Les items ont ete deplaces, l'operation ne peut pas etre repetee.
    this.setState({elementsCopierDeplacer: null});
  }

  supprimer = (selection) => {
    console.debug("Supprimer");
    for(var uuid in selection) {
      let infoitem = selection[uuid];
      let typeitem = infoitem.type;
      console.debug(typeitem + " " + uuid);
    }
  }

  ouvrir = (uuid, type) => {
    console.debug("Ouvrir " + type + " " + uuid);
  }

  telecharger = (uuid) => {
    console.debug("Telecharger " + uuid);
  }

  activerCopier = selection => {
    this.setState({
      elementsCopierDeplacer: selection,
      operationCopierDeplacer: 'copier',
    });
  }

  activerDeplacer = selection => {
    this.setState({
      elementsCopierDeplacer: selection,
      operationCopierDeplacer: 'deplacer',
    });
  }

  upload = repertoireDestination => {
    console.debug("Upload vers " + repertoireDestination);
  }

  render() {
    let repertoire = {
      repertoire_uuid: 'a06266fa-b8a2-11e9-9370-02420a000285',
      nom: "Le Panneau",
      fichiers: this.state.sampleData_fichiers_1,
      repertoires: this.state.sampleData_repertoires_flat
    }

    return (
      <div>
        <h1>Panneau exemples pour FichiersUI.js</h1>

        <h2>Panneau Fichiers Icones</h2>
        <PanneauFichiersIcones
          repertoire={repertoire}
          doubleclickRepertoire={this.doubleclickRepertoire}
          doubleclickFichier={this.doubleclickFichier}
          activerCopier={this.activerCopier}
          activerDeplacer={this.activerDeplacer}
          operationCopierDeplacer={this.state.operationCopierDeplacer}
          copier={this.copier}
          deplacer={this.deplacer}
          supprimer={this.supprimer}
          ouvrir={this.ouvrir}
          telecharger={this.telecharger}
          upload={this.upload}
          />

        <h2>Panneau Fichiers Liste</h2>
        <PanneauFichiersListeDetaillee />

      </div>
    );
  }

}

export {EcranSample1};
