#!/usr/bin/env bash

set -e  # Abandonner immediatement pour toute erreur d'execution

source image_info.txt

if [ -z $VERSION ]; then
  echo "Erreur, la version n'est pas inclue dans image_info.txt"
  exit 3
fi

BUILD_FILE=coupdoeil_react.$VERSION.tar.gz
BUILD_PATH=/home/mathieu/git/millegrilles.coupdoeil

traiter_fichier_react() {
  # Decide si on bati ou telecharge un package pour le build react.
  # Les RPi sont tres lents pour batir le build, c'est mieux de juste recuperer
  # celui qui est genere sur une workstation de developpement.

  ARCH=`uname -m`
  rm -f coupdoeil_react.*.tar.gz

  if [ $ARCH == 'x86_64' ] || [ -z $URL_SERVEUR_DEV ]; then
    echo "Architecture $ARCH (ou URL serveur DEV non inclus), on fait un nouveau build React"
    package_build
  else
    echo "Architecture $ARCH, on va chercher le fichier avec le build coupdoeil pour React sur $URL_SERVEUR_DEV"
    telecharger_package
  fi
}

package_build() {
  echo "Building new Coup D'Oeil React app"
  cd $BUILD_PATH/front-end
  # Sauvegarder information de version
  makeManifest
  npm run-script build
  tar -zcf ../$BUILD_FILE build
}

telecharger_package() {
  sftp ${URL_SERVEUR_DEV}:${BUILD_PATH}/$BUILD_FILE
  if [ $? -ne 0 ]; then
    echo "Erreur download fichier react"
    exit 1
  fi
  echo "Nouvelle version du fichier react telechargee"
}

installer() {
  echo "Installation de l'application coupdoeil React dans $BUILD_PATH"
  cd $BUILD_PATH
  rm -rf react_build
  mkdir react_build && \
    tar -xf $BUILD_FILE -C react_build
}

makeManifest() {
  source ../image_info.txt
  cd src
  DATECOURANTE=`date "+%Y-%m-%d %H:%M"`
  mv manifest.build.js manifest.build.js.cp
  echo "const build = {" >> manifest.build.js
  echo "  date: '$DATECOURANTE'," >> manifest.build.js
  echo "  version: '$VERSION'" >> manifest.build.js
  echo "}" >> manifest.build.js
  echo "module.exports = build;" >> manifest.build.js
  cd ..
}

sequence() {
  traiter_fichier_react
  installer
}

sequence
