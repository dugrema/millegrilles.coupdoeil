NAME='dev2.maple.mdugre.info ' docker run \
--name "${NAME}" --hostname "${NAME}" \
--env ROOT_URL=http://dev2.maple.mdugre.info \
-it \
coupdoeil /bin/bash

# --detach=true \
# --env MAIL_URL=smtp://example.com \
# --volume "${CONFIG}:/etc/service/meteor/run.config" \
# --volume "${METEOR_LOG}:/var/log/meteor" \
# --volume "${METEOR_STORAGE}:/storage" \
# --volume /srv/var/hosts:/etc/hosts:ro \

