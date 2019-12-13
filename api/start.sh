#!/usr/bin/env bash

CERT_FOLDER=/home/mathieu/mgdev/certs
source /opt/millegrilles/etc/variables.env
export MG_IDMG=$IDMG
export MG_CONSIGNATION_PATH=/var/opt/millegrilles/$IDMG/mounts/consignation
export HOST=`hostname`

# CERT_FOLDER=/opt/millegrilles/$MG_NOM_MILLEGRILLE/pki/deployeur
CERT_FOLDER=/home/mathieu/mgdev/certs

# export COUPDOEIL_SESSION_TIMEOUT=15000
export MG_MQ_CAFILE=$CERT_FOLDER/pki.racine.cert
export MG_MQ_CERTFILE=$CERT_FOLDER/pki.coupdoeil.fullchain
export MG_MQ_KEYFILE=$CERT_FOLDER/pki.coupdoeil.key

export CERT=$MG_MQ_CERTFILE
export PRIVKEY=$MG_MQ_KEYFILE
export MG_MQ_URL=amqps://$HOST.local:5673/$MG_IDMG
export PORT=3001

export MG_HTTPPROXY_SECURE=false
export MG_CONSIGNATION_HTTP=https://$HOST:3003

npm start
