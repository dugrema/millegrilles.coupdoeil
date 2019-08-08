FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Volume pour le staging des fichiers uploades via coupdoeil
VOLUME /tmp/coupdoeilStaging

ENV MG_CONSIGNATION_HTTP=https://consignationfichiers

EXPOSE 443

CMD [ "npm", "start" ]

COPY api/package*.json ./
RUN npm install

# Bundle app source
# Api est l'application node back-end et front-end est l'application react
COPY api/ ./
COPY react_build/build/ ./public/
