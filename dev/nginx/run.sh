#!/usr/bin/env bash

docker run -d -p 8443:443 -p 8080:80 -v /home/mathieu/git/MilleGrilles.coupdoeil/dev/nginx/conf.d/:/etc/nginx/conf.d nginx:mg_dev
