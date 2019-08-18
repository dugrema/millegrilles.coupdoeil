#!/usr/bin/env bash

if [ -z $VERSION ]; then
  echo "Parametre globaux manquants. Il faut fournir: VERSION"
  exit 2
fi

BUILD_FILE=coupdoeil_react.$VERSION.tar.gz
BUILD_PATH=/home/mathieu/git/MilleGrilles.coupdoeil
URL_SERVEUR=mathieu@dev2.local

set -e  # Abandonner immediatement pour toute erreur d'execution

traiter_fichier_react() {
  ARCH=`uname -m`
  if [ $ARCH == 'x86_64' ]; then
    echo "Architecture $ARCH, on fait un nouveau build React"
    package_build
  else
    echo "Architecture $ARCH, on va chercher le fichier avec le build coupdoeil pour React"
    telecharger_package
  fi
}

package_build() {
  rm -f coupdoeil_react.*.tar.gz
  echo "Building new Coup D'Oeil React app"
  cd $BUILD_PATH/front-end
  # Sauvegarder information de version
  makeManifest
  npm run-script build
  tar -zcf ../$BUILD_FILE build
}

telecharger_package() {
  sftp ${URL_SERVEUR}${BUILD_PATH}/$BUILD_FILE
  if [ $? -ne 0 ]; then
    echo "Erreur download fichier react"
    exit 1
  fi
  echo "Nouvelle version du fichier react telechargee"
}

installer() {
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
