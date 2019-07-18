#!/usr/bin/env bash

BUILD_FILE=coupdoeil_react.tar.gz
BUILD_PATH=/home/mathieu/git/MilleGrilles.coupdoeil

function makeManifest() {
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

if [ ! -f $BUILD_FILE ]; then
  echo "Building new Coup D'Oeil React app"
  cd $BUILD_PATH/front-end
  # Sauvegarder information de version
  makeManifest
  npm run-script build
  tar -zcf ../$BUILD_FILE build
else
  echo "Reusing existing Coup D'Oeil React file $BUILD_FILE"
fi

cd $BUILD_PATH
rm -rf react_build
mkdir react_build && \
  tar -xf $BUILD_FILE -C react_build
