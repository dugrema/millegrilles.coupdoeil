#!/bin/bash

source image_info.txt

docker run -d \
  -e ROOT_URL=http://dev2.maple.mdugre.info \
  -e MONGO_URL=mongodb://coupdoeil:p1234@192.168.1.110/mg-sansnom?ssl=true \
  -e MONGO_OPLOG_URL=mongodb://root:example@192.168.1.110/local?ssl=true\&authSource=admin \
  -p 3000:3000 \
  $REPO/$NAME.x86_64:$VERSION


