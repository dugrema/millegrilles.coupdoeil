#!/bin/bash

echo "Setup image docker pour meteor"

export http_proxy=http://192.168.1.28:8000

apt-get update
apt-get --yes --force-yes install curl python build-essential git
export METEOR_ALLOW_SUPERUSER=true
curl https://install.meteor.com/ | sed s/--progress-bar/-sL/g | sh
apt-get --yes --force-yes purge curl
apt-get --yes --force-yes autoremove
adduser --system --group meteor --home /
export "NODE=$(find /.meteor/ -path '*bin/node' | grep '/.meteor/packages/meteor-tool/' | sort | head -n 1)"
ln -sf ${NODE} /usr/local/bin/node && \
ln -sf "$(dirname "$NODE")/npm" /usr/local/bin/npm


