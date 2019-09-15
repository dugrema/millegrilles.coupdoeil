import React from 'react';
// import manifest from './manifest.build.js';  // App version, build date

// Importer les Domaines et creer la liste des domaines connus
import {SenseursPassifs} from './domaines/SenseursPassifs';
import {GrosFichiers} from './domaines/GrosFichiers';
import {InterfacePrincipale} from './domaines/Principale.js';
import {Plume} from './domaines/Plume.js';
import {Parametres} from './domaines/Parametres.js';

const domainesConnus = {
  'SenseursPassifs': SenseursPassifs,
  'GrosFichiers': GrosFichiers,
  'Principale': InterfacePrincipale,
  'Plume': Plume,
  'Parametres': Parametres,
};

export function SectionContenu(props) {
  // Contenu de l'application: Menu de gauche et section domaine
  // Section principale, au milieu de l'ecran

  let pageContenu;
  if(props.domaineActif && domainesConnus[props.domaineActif]) {
    let SectionDomaine = domainesConnus[props.domaineActif]
    pageContenu = (
      <SectionDomaine
        {...props}
      />
    )
  } else {
    if(props.pageActive === 'listeDomaines') {
      pageContenu = (
        <ListeDomaines
          {...props.configDocument}
          fonctionsNavigation={props.fonctionsNavigation}
          />
      )
    } else {
      // Par defaut on affiche la page d'accueil
      pageContenu = (
        <Accueil/>
      )
    }
  }

  return (
    <div className="w3-container w3-content divtop">
      <div className="w3-row">
        <MenuGauche
          {...props.configDocument}
          domaineActif={props.domaineActif}
          fonctionsNavigation={props.fonctionsNavigation}
        />
        {pageContenu}
      </div>
    </div>
  );

}

export class NavBar extends React.Component {
  // Barre de navigation dans le haut de l'ecran

  state = {
  }

  render() {
    return (
      <div className="w3-top">
       <div className="w3-bar w3-theme-d2 w3-left-align w3-large">
        <button className="w3-bar-item w3-button w3-hide-medium w3-hide-large w3-right w3-padding-large w3-hover-white w3-large w3-theme-d2">
          <i className="fa fa-bars"></i>
        </button>
        <button className="w3-bar-item w3-button w3-padding-large w3-theme-d4 Principal">
          <i className="fa fa-home w3-margin-right"></i>
          Coup D'Oeil
        </button>
        <button className="w3-bar-item w3-button w3-hide-small w3-padding-large w3-hover-white" title="Mes tâches">
          <i className="fa fa-calendar-check-o"></i>
        </button>
       </div>
      </div>
    );
  }
}

function Accueil(props) {
  return (
    <div className="w3-col m9">
      <div className="w3-row-padding">
        <div className="w3-col m12">
          <div className="w3-card w3-round w3-white">
            <div className="w3-container w3-padding">
              <h2 className="w3-opacity">
                Bienvenue a Coup D'Oeil.
              </h2>
              <p>Choisissez un domaine dans le menu de gauche pour poursuivre.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListeDomaines(props) {

  let listeDomaines = [];

  if(props.domaines) {
    for(var idx in props.domaines) {
      const domaine = props.domaines[idx];

      // Verifier si le domaine est charge
      if(domainesConnus[domaine.description]) {

        listeDomaines.push((
          <li key={domaine.description}>
            <button
              key={domaine.description}
              className="aslink"
              onClick={props.fonctionsNavigation.changerDomaine}
              data-domaine={domaine.description} >
                {domaine.description}
            </button>
          </li>
        ));
      }
    }
  }


  return (
    <div className="w3-col m9">
      <div className="w3-row-padding">
        <div className="w3-col m12">
          <div className="w3-card w3-round w3-white">
            <div className="w3-container w3-padding">
              <h2 className="w3-opacity">
                Liste des domaines disponibles
              </h2>

              <ul>
                {listeDomaines}
              </ul>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// function Footer(props) {
//   // Section du bas de l'ecran d'application
//   return (
//     <footer>
//       <div className="w3-container w3-theme-d3 w3-padding-small">
//         <h5>Coup D'Oeil version <span title={manifest.date}>{manifest.version}</span></h5>
//           Coup D'Oeil fait partie du groupe de
//           logiciels <a href="https://www.millegrilles.com">MilleGrilles</a>.
//       </div>
//       <div className="w3-container w3-theme-d5">
//           Powered by <a href="https://www.w3schools.com/w3css/default.asp" target="_blank" rel="noopener noreferrer">w3.css</a>,
//            Meteor, node.js, MongoDB, RabbitMQ, Python, nginx, docker, letsencrypt,
//            d3, RaspberryPi, Intel Xeon, Debian, Font Awesome, git.
//       </div>
//     </footer>
//   );
// }

function MenuGauche(props) {
  return (
    <div className="w3-col m3">
      <MenuGaucheTop {...props}/>
      <MenuGaucheNavigation
        domaines={props.domaines}
        {...props.fonctionsNavigation}
        />
    </div>
  );
}

function MenuGaucheTop(props) {

  let titre;
  if(props.domaineActif) {
    titre = (
      <h4 className="w3-center">{props.domaineActif}</h4>
    )
  } else {
    titre = (
      <h4 className="w3-center">MilleGrilles</h4>
    )
  }

  return (
    <div className="w3-card w3-round w3-white w3-card_BR">
      <div className="w3-container">
        {titre}
       <hr/>
       <p>
         <i className="fa fa-home fa-fw w3-margin-right w3-text-theme"></i>
         {props.nom_millegrille}
       </p>
      </div>
    </div>
  );
}

function MenuGaucheNavigation(props) {

  const listeDomaines = []; //, listeDomainesInconnus = [];

  if(props.domaines) {
    for(var idx in props.domaines) {
      const domaine = props.domaines[idx];

      // Verifier si le domaine est charge
      if(domainesConnus[domaine.description]) {

        var className = 'w3-button w3-block w3-theme-l3 w3-left-align bouton-menu-gauche';
        listeDomaines.push((
          <button
            key={domaine.description}
            className={className}
            onClick={props.changerDomaine}
            data-domaine={domaine.description}
          >
            <i className="fa fa-sliders fa-fw w3-margin-right"></i>
            {domaine.description}
          </button>

        ));
      }
      else {
      // console.debug("Domaine inconnu: " + domaine.description);
      //   listeDomainesInconnus.push((
      //     <span
      //       key={domaine.description}
      //       className={classe_rang}
      //     >{domaine.description}</span>
      //   ));
      }

    }
  }

  const menu = (
    <div className="w3-white menu-domaine-gauche">
      <button key='Accueil' className='w3-button w3-block w3-theme-l2 w3-left-align bouton-menu-gauche'
        onClick={props.afficherAccueil}>
        <i className="fa fa-home fa-fw w3-margin-right"></i>
        Accueil
      </button>
      <button key='Domaines' className='w3-button w3-block w3-theme-l2 w3-left-align bouton-menu-gauche'
        onClick={props.afficherListeDomaines}>
        <i className="fa fa-sliders fa-fw w3-margin-right"></i>
        Domaines
      </button>
      {listeDomaines}
    </div>
  );

  return (
    <div className="w3-card w3-round">
        {menu}
    </div>
  );
}
