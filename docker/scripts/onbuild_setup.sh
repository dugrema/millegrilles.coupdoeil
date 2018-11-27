#!/bin/bash

export METEOR_ALLOW_SUPERUSER=true

rm -rf /source/.meteor/local /source/node_modules
if [ -x /source/docker-source.sh ]; then /source/docker-source.sh; fi
cp -a /source /build
rm -rf /source
cd /build
meteor list

if [ -f package.json ]; then 
  meteor npm install --production --unsafe-perm
fi
meteor build --headless --directory / 

cd / 
rm -rf /build
if [ -e /bundle/programs/server/package.json ]; then 
  cd /bundle/programs/server
  npm install --unsafe-perm
fi

