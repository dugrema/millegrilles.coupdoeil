#!/bin/bash

source image_info.txt

MG_MONGO_HOST=192.168.1.28
MG_NOM_MILLEGRILLE=maple
MG_MONGO_USER=coupdoeilmeteor
MG_MONGO_PASSWORD=higCYUD096aQUI67

docker run -d \
  -e ROOT_URL=http://dev2.maple.mdugre.info \
  -e MONGO_URL=mongodb://$MG_MONGO_USER:$MG_MONGO_PASSWORD@$MG_MONGO_HOST/mg-$MG_NOM_MILLEGRILLE?ssl=true \
  -e MONGO_OPLOG_URL=mongodb://$MG_MONGO_USER:$MG_MONGO_PASSWORD@$MG_MONGO_HOST/local?ssl=true\&authSource=admin \
  -p 3000:3000 \
  $REPO/$NAME.x86_64:$VERSION


