Repository pour MilleGrilles - Coup D'Oeil.

# Développement

Installer une millegrille localement et configurer nginx pour rediriger vers les ports du serveur web et react 
de développement.

S'assurer d'avoir expose les ports du middleware (mq, mongo, redis) avec le script **instance**/bin/dev/publish_ports.sh.

## Web

Fichier /var/opt/millegrilles/nginx/modules/coupdoeil.location.

- Port web 4003
- Port react 3004

## Paramètres serveur

- CA_PEM=/var/opt/millegrilles/configuration/pki.millegrille.cert
- CERT_PEM=/var/opt/millegrilles/secrets/pki.coupdoeil.cert
- KEY_PEM=/var/opt/millegrilles/secrets/pki.coupdoeil.cle
- REDIS_PASSWORD_PATH=/var/opt/millegrilles/secrets/passwd.redis.txt
- WEB_PORT=4003
- MQ_HOSTNAME=localhost
- REDIS_HOSTNAME=localhost

Pour executer la partie serveur, démarrer millegrilles_instance/__main__.py. 

Utiliser : python3 -m server_coupdoeil

## Client react

Aller dans le repertoire client/ du projet.

- sudo apt install cmake build-essential
- Installer nvm et nodeJS 20 (e.g. nvm install 20 && nvm use 20)
- Installer react-app-rewired : npm i -g react-app-rewired
- Preparer les dépendances avec : export NODE_OPTIONS=--openssl-legacy-provider && npm i
- Activer parametre
