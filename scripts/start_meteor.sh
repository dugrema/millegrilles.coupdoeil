#!/bin/bash

# Command pour creer compte MongoDB:
# use coupdoeil
# db.createUser({user: "coupdoeil", pwd: "p1234", roles: [{ role: "readWrite", db: "coupdoeil" }]})

PORT=[2607:f2c0:eb70:1785:215:5dff:fe01:1f00]:3000
MONGO_URL='mongodb://coupdoeil:p1234@192.168.1.110/mg-sansnom'

export MONGO_URL

meteor --port $PORT
