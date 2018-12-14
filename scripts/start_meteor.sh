#!/bin/bash

# Command pour creer compte MongoDB:
# use coupdoeil
# db.createUser({user: "coupdoeil", pwd: "p1234", roles: [{ role: "readWrite", db: "coupdoeil" }]})

#PORT=[2607:f2c0:eb70:1785:215:5dff:fe01:1f00]:3000
PORT=192.168.1.110:3000
MONGO_URL='mongodb://coupdoeil:p1234@192.168.1.110/mg-sansnom?ssl=true'
MONGO_OPLOG_URL='mongodb://coupdoeil:p1234@192.168.1.110/local?ssl=true&authSource=mg-sansnom'

MG_MQ_HOST=dev2.maple.mdugre.info
MG_MQ_PORT=5671
MG_MQ_USER=coupdoeil
MG_MQ_PASSWORD=gLOUj3xLAj82

export MONGO_URL MONGO_OPLOG_URL MG_MQ_HOST MG_MQ_PORT MG_MQ_USER MG_MQ_PASSWORD

meteor --port $PORT
