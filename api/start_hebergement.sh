#!/usr/bin/env bash

# source /opt/millegrilles/etc/variables.env
# export MG_IDMG=$IDMG
# export MG_CONSIGNATION_PATH=/var/opt/millegrilles/$IDMG/mounts/consignation
export HOST=`hostname`

# CERT_FOLDER=/opt/millegrilles/$MG_NOM_MILLEGRILLE/pki/deployeur
CERT_FOLDER=/home/mathieu/mgdev/certs

# export COUPDOEIL_SESSION_TIMEOUT=15000
export MG_MQ_CAFILE=$CERT_FOLDER/pki.millegrille.cert
export HEB_CERTFILE=$CERT_FOLDER/pki.heb_coupdoeil.cert
export HEB_KEYFILE=$CERT_FOLDER/pki.heb_coupdoeil.key

export CERT=~/.acme.sh/mg-dev3.maple.maceroc.com/fullchain.cer
export PRIVKEY=~/.acme.sh/mg-dev3.maple.maceroc.com/mg-dev3.maple.maceroc.com.key
export MG_MQ_URL=amqps://$HOST:5673
export PORT=3006

export MG_HTTPPROXY_SECURE=false
export MG_CONSIGNATION_HTTP=https://$HOST:3003

npm run-script hebergement
