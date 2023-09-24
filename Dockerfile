FROM docker.maple.maceroc.com:5000/millegrilles_web_python:2023.9.0

ENV CA_PEM=/var/opt/millegrilles/configuration/pki.millegrille.cert \
    CERT_PEM=/var/opt/millegrilles/secrets/pki.coupdoeil.cert \
    KEY_PEM=/var/opt/millegrilles/secrets/pki.coupdoeil.cle \
    MQ_HOSTNAME=mq \
    MQ_PORT=5673 \
    REDIS_HOSTNAME=redis \
    REDIS_PASSWORD_PATH=/var/run/secrets/passwd.redis.txt \
    WEB_PORT=1443

EXPOSE 80 443

# Creer repertoire app, copier fichiers
# WORKDIR $APP_FOLDER

RUN python3 ./setup.py install

CMD ["-m", "server", "--verbose"]
