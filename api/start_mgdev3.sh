#!/usr/bin/env bash

CERT_FOLDER=/opt/millegrilles/mg-dev3/pki
export MG_NOM_MILLEGRILLE=mg-dev3

# export COUPDOEIL_SESSION_TIMEOUT=15000
# export MG_MQ_CAFILE=$CERT_FOLDER/millegrilles/pki.millegrilles.ssl.CAchain
# export MG_MQ_CERTFILE=$CERT_FOLDER/millegrilles/certs/dev2.maple.mdugre.info.cert.pem
# export MG_MQ_KEYFILE=$CERT_FOLDER/millegrilles/privkeys/dev2.maple.mdugre.info.pem

export MG_MQ_CAFILE=$CERT_FOLDER/certs/mg-dev3_CA_chain.cert.pem
export MG_MQ_CERTFILE=$CERT_FOLDER/certs/mg-dev3_middleware.cert.pem
export MG_MQ_KEYFILE=$CERT_FOLDER/keys/mg-dev3_middleware.key.pem

export CERT=$CERT_FOLDER/certs/mg-dev3_fullchain.cert.pem
export PRIVKEY=$CERT_FOLDER/keys/mg-dev3_middleware.key.pem
export MG_MQ_URL=amqps://mg-dev3:5673/$MG_NOM_MILLEGRILLE
export PORT=3001

export MG_HTTPPROXY_SECURE=false
export MG_CONSIGNATION_HTTP=https://mg-dev3.local:3003

npm start
