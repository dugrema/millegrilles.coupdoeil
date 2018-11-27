FROM debian:9.6

EXPOSE 3000/tcp

#ENV MAIL_URL smtp://user:password@mailhost:port/
ENV SRC_FOLDER=/opt/meteor/src \
    DIST_FOLDER=/opt/meteor/dist \
    ROOT_URL=http://dev2.maple.mdugre.info \
    METEOR_SETTINGS={} \
    PORT=3000 \
    MONGO_URL=mongodb://coupdoeil:p1234@192.168.1.110/mg-sansnom \
    MONGO_OPLOG_URL=mongodb://root:example@192.168.1.110/mg-sansnom \
    HOME=/ \
    LOG_TO_STDOUT=0

VOLUME /var/log/meteor

COPY scripts/ $SRC_FOLDER/scripts/

RUN $SRC_FOLDER/scripts/setup.sh

ONBUILD COPY . /source
ONBUILD RUN $SRC_FOLDER/onbuild_setup.sh
