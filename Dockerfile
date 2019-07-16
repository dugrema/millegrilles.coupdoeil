FROM node:10

# Create app directory
WORKDIR /usr/src/app

COPY api/package*.json ./
RUN npm install

# Bundle app source
COPY api/ ./
COPY front-end/build/ ./public/

EXPOSE 3001
VOLUME /home/mathieu/certificates

CMD [ "npm", "start" ]
