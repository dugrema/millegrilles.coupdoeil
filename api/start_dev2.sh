#!/usr/bin/env bash

CERT_FOLDER=/home/mathieu/certificates
export MG_NOM_MILLEGRILLE=dev2

# export COUPDOEIL_SESSION_TIMEOUT=15000
# export MG_MQ_CAFILE=$CERT_FOLDER/millegrilles/pki.millegrilles.ssl.CAchain
# export MG_MQ_CERTFILE=$CERT_FOLDER/millegrilles/certs/dev2.maple.mdugre.info.cert.pem
# export MG_MQ_KEYFILE=$CERT_FOLDER/millegrilles/privkeys/dev2.maple.mdugre.info.pem

export MG_MQ_CAFILE=$CERT_FOLDER/millegrilles/certs/millegrille_dev2.maple.mdugre.info.cert.pem.rootchain
export MG_MQ_CERTFILE=$CERT_FOLDER/millegrilles/certs/dev2.maple.mdugre.info.cert.pem.20190808
export MG_MQ_KEYFILE=$CERT_FOLDER/millegrilles/privkeys/dev2.maple.mdugre.info.pem.20190808

export CERT=$CERT_FOLDER/dev2.maple.mdugre.info/fullchain.pem
export PRIVKEY=$CERT_FOLDER/dev2.maple.mdugre.info/privkey.pem
export MG_MQ_URL=amqps://dev2.local:5673/$MG_NOM_MILLEGRILLE
export PORT=3001

export MG_HTTPPROXY_SECURE=false
export MG_CONSIGNATION_HTTP=https://dev2.maple.mdugre.info:3003

npm start
