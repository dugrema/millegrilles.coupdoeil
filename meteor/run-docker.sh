#!/bin/bash

docker run -d \
  -e ROOT_URL=http://dev2.maple.mdugre.info \
  -e MONGO_URL=mongodb://coupdoeil:p1234@192.168.1.110/mg-sansnom \
  -p 3000:3000 \
  registry.maple.mdugre.info:5000/coupdoeil.x86_64:v0.1.1
