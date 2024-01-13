FROM docker.maple.maceroc.com:5000/millegrilles_web_python:2024.0.7

ENV CA_PEM=/var/opt/millegrilles/configuration/pki.millegrille.cert \
    CERT_PEM=/var/opt/millegrilles/secrets/pki.coupdoeil.cert \
    KEY_PEM=/var/opt/millegrilles/secrets/pki.coupdoeil.cle \
    MQ_HOSTNAME=mq \
    MQ_PORT=5673 \
    REDIS_HOSTNAME=redis \
    REDIS_PASSWORD_PATH=/var/run/secrets/passwd.redis.txt \
    WEB_PORT=1443

COPY static/ $BUNDLE_FOLDER/static

COPY . $BUILD_FOLDER

RUN cd $BUILD_FOLDER && \
    python3 ./setup.py install

# UID fichiers = 984
# GID millegrilles = 980
USER 984:980

CMD ["-m", "server_coupdoeil"]
# CMD ["-m", "server_coupdoeil", "--verbose"]
