#!/bin/bash

# Command pour creer compte MongoDB:
# use coupdoeil
# db.createUser({user: "coupdoeil", pwd: "p1234", roles: [{ role: "readWrite", db: "coupdoeil" }]})

#PORT=[2607:f2c0:eb70:1785:215:5dff:fe01:1f00]:3000
PORT=192.168.1.110:3000
MONGO_URL='mongodb://coupdoeilmeteor:p1234@mongo/mg-sansnom?ssl=true'
MONGO_OPLOG_URL='mongodb://coupdoeilmeteor:p1234@mongo/local?ssl=true&authSource=mg-sansnom'
MG_NOM_MILLEGRILLE=sansnom
MG_MQ_HOST=mq
MG_MQ_PORT=5673
MG_MQ_USER=dev
MG_MQ_PASSWORD=dev_user1
#MG_MQ_CERT='/home/mathieu/git/MilleGrilles.coupdoeil/cert/dev2.cer'
#MG_MQ_PROTOCOL='amqp'

MG_MQ_CAFILE=/usr/local/etc/millegrilles/pki.millegrilles.ssl.CAchain
MG_MQ_CERTFILE=/usr/local/etc/millegrilles/pki.millegrilles.ssl.cert
MG_MQ_KEYFILE=/usr/local/etc/millegrilles/pki.millegrilles.ssl.key
export MG_MQ_CAFILE MG_MQ_CERTFILE MG_MQ_KEYFILE

MG_MONGO_CAFILE=/usr/local/etc/millegrilles/pki.millegrilles.ssl.CAchain
MG_MONGO_CERTFILE=/usr/local/etc/millegrilles/pki.millegrilles.ssl.cert
MG_MONGO_KEYFILE=/usr/local/etc/millegrilles/pki.millegrilles.ssl.key
export MG_MONGO_CAFILE MG_MONGO_CERTFILE MG_MONGO_KEYFILE

export MONGO_URL MONGO_OPLOG_URL
export MG_MQ_HOST MG_MQ_PORT MG_MQ_USER MG_MQ_PASSWORD MG_NOM_MILLEGRILLE MG_MQ_PROTOCOL

meteor --port $PORT
