#!/usr/bin/env bash

CERT_FOLDER=~/.acme.sh/mg-dev3.maple.maceroc.com
WEBPACK_SSL=node_modules/webpack-dev-server/ssl
WEBPACK_FILE=$WEBPACK_SSL/server.pem

cat $CERT_FOLDER/mg-dev3.maple.maceroc.com.key $CERT_FOLDER/fullchain.cer > $WEBPACK_FILE
chmod 644 $WEBPACK_FILE
sudo chown root:root $WEBPACK_FILE
