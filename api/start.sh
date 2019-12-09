#!/usr/bin/env bash

export MG_NOM_MILLEGRILLE=dev3
export HOST=`hostname`

# CERT_FOLDER=/opt/millegrilles/$MG_NOM_MILLEGRILLE/pki/deployeur
CERT_FOLDER=/home/mathieu/mgdev/certs

# export COUPDOEIL_SESSION_TIMEOUT=15000
export MG_MQ_CAFILE=$CERT_FOLDER/pki.ca.root.cert
export MG_MQ_CERTFILE=$CERT_FOLDER/pki.coupdoeil.fullchain
export MG_MQ_KEYFILE=$CERT_FOLDER/pki.coupdoeil.key

export CERT=$MG_MQ_CERTFILE
export PRIVKEY=$MG_MQ_KEYFILE
export MG_MQ_URL=amqps://$HOST.local:5673/$MG_NOM_MILLEGRILLE
export PORT=3001

export MG_HTTPPROXY_SECURE=false
export MG_CONSIGNATION_HTTP=https://$HOST:3003

npm start
