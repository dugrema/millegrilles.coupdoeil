#!/bin/bash

echo "Installation de nginx"
echo "APP_SOURCE_DIR = $APP_SOURCE_DIR"
echo "APP_BUNDLE_DIR = $APP_BUNDLE_DIR"

mkdir -p $APP_BUNDLE_DIR
mkdir -p $APP_SOURCE_DIR

rm /etc/nginx/conf.d/default.conf
mv $APP_SOURCE_DIR/sites-available $APP_BUNDLE_DIR

echo "Copier run.sh, dummy_certs vers $APP_BUNDLE_DIR"
mv $APP_SOURCE_DIR/scripts/run.sh $APP_BUNDLE_DIR
chmod u+x $APP_BUNDLE_DIR/run.sh

mv $APP_SOURCE_DIR/dummy_certs $APP_BUNDLE_DIR
echo "Fichiers dans $APP_BUNDLE_DIR :"
find $APP_BUNDLE_DIR

# Cleanup
rm -rf $APP_SOURCE_DIR

echo "Installation completee"
