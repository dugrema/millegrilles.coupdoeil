#!/usr/bin/env bash

export MG_NOM_MILLEGRILLE=dev3
export HOST=`hostname`

CERT_FOLDER=/opt/millegrilles/$MG_NOM_MILLEGRILLE/pki/deployeur

# export COUPDOEIL_SESSION_TIMEOUT=15000
export MG_MQ_CAFILE=$CERT_FOLDER/pki.ca.fullchain.pem
export MG_MQ_CERTFILE=$CERT_FOLDER/deployeur.cert.pem
export MG_MQ_KEYFILE=$CERT_FOLDER/deployeur.key.pem

export CERT=$MG_MQ_CERTFILE
export PRIVKEY=$MG_MQ_KEYFILE
export MG_MQ_URL=amqps://$HOST.local:5673/$MG_NOM_MILLEGRILLE
export PORT=3001

export MG_HTTPPROXY_SECURE=false
export MG_CONSIGNATION_HTTP=https://$HOST:3003

npm start
