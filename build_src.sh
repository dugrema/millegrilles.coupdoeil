#!/usr/bin/env bash

BUILD_FILE=coupdoeil_react.tar.gz
BUILD_PATH=/home/mathieu/git/MilleGrilles.coupdoeil

if [ ! -f $BUILD_FILE ]; then
  echo "Building new Coup D'Oeil React app"
  cd $BUILD_PATH/front-end
  npm run-script build
  tar -zcf ../$BUILD_FILE build
else
  echo "Reusing existing Coup D'Oeil React file $BUILD_FILE"
fi

cd $BUILD_PATH
rm -rf react_build
mkdir react_build && \
  tar -xf $BUILD_FILE -C react_build
