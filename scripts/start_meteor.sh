#!/bin/bash

PORT=[2607:f2c0:eb70:1785:215:5dff:fe01:1f00]:3000
MONGO_URL='mongodb://root:example@192.168.1.110/'

export MONGO_URL

meteor --port $PORT

