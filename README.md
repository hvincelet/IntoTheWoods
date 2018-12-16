# Into The Woods

Into The Woods est un logiciel de gestion de raid automatisée. Il permet à un utilisateur de :
 * créer un raid,
 * tracer les parcours associées,
 * ajouter des points d'intérêts,
 * ajouter d'autres organisateurs,
 * ajouter et gérer des bénévoles en les associant aux points d'intérêts,
 * contacter les bénévoles et organisateurs de son raid.

Ce logiciel a été réalisé dans le cadre du projet Génie Logiciel de la troisième année de la formation Informatique Multimédia et Réseaux (IMR)
de l'École nationale supérieur de sciences appliquées et de technologie ([Enssat](http://www.enssat.fr)) de Lannion.

## Démarrage

Ces instructions vont vous aider à mettre en place une copie de ce logiciel et à le lancer sur votre machine locale à des fins de développements et de tests.
Pour des informations concernant le déploiement sur un serveur de production, consultez la rubrique Déploiement.

### Prérequis

La liste de logiciels suivante est nécessaire afin de faire fonctionner ce logiciel.\
Merci de les installer avant de continuer.

```
nodeJS v.11.3.0 : https://nodejs.org/en/
mysql 5.7.24 : https://dev.mysql.com/downloads/mysql/
```
> Attention : Ne pas prendre la version 8 de mysql, des problèmes connus empêchent le déploiement de notre base de données.

### Installation

La suite d'instruction suivante, prévue pour un environnement Linux/Debian va vous guider afin d'installer le logiciel. \
Si vous êtes sur un environnement différent, adaptez les commandes en fonction.

Pour commencer, ouvrez un terminal et rendez vous dans votre espace personnel via la commande suivante :
```Shell
cd ~
```

Puis, téléchargez le code du logiciel en utilisant cette comande :
```Shell
git clone https://github.com/hvincelet/IntoTheWoods.git
```

Rendez vous dans le dossier téléchargé :
```Shell
cd IntoTheWoods/
```

Téléchargez les modules nécessaires :
```Shell
npm install --save
```

Configurez le serveur comme souhaité dans le fichier **config/config.js**.

Importez le script pour initialiser la base de données :
```Shell
mysql -u root -p
source /home/user/IntoTheWoods/models/DBGenerationScript.sql;
quit;
```

Désormais le logiciel est installé. Pour vérifier que l'installation s'est déroulée sans soucis, utilisez la commande suivante :
```Shell
npm test
```

Si tout s'est bien déroulé, vous devriez voir une ligne, semblable à la suivante, apparaître :
```
HTTP Server running on localhost:8080
```

Vous n'avez plus qu'à vous rendre sur l'adresse [http://localhost:8080](http://localhost:8080) pour commencer à utiliser le logiciel.

## Déploiement

Afin de déployer le service sur un serveur de production, il y a quelques étapes supplémentaires.

La première consiste à récupérer un certificat SSL pour le nom de domaine de votre choix.
> Vous pouvez en obtenir un gratuitement grâce à [Let's Encrypt](https://letsencrypt.org).

Une fois que vous avez vos certificats, indiquez le chemin absolu de ceux-ci sur les lignes **194 à 196** du fichier **app.js** :
```javascript
const credentials = {
    key: fs.readFileSync('/etc/letsencrypt/live/mydomain.com/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/mydomain.com/cert.pem', 'utf8'),
    ca: fs.readFileSync('/etc/letsencrypt/live/mydomain.com/chain.pem', 'utf8')
};
```

Modifiez le fichier **config/config.js** afin d'indiquer votre nom de domaine à la ligne 17 :
```javascript
production: {
    server_host: 'mysubdomaine.mydomain.com',
    ...
}
```

Lancez le serveur via la commande suivante :
```Shell
sudo npm start
```
> Il est nécessaire de lancer le serveur avec les droits superutilisateur afin de pouvoir utiliser les ports 80 et 443 du serveur.

Si tout s'est bien déroulé, vous devriez voir deux lignes, semblables aux suivantes, apparaître :
```
HTTP Server running on mysubdomain.mydomaine.com:80
HTTPS Server running on mysubdomain.mydomaine.com:443
```

Vous devriez désormais être capable d'accéder au service à l'adresse de votre serveur.

## Développé avec

* [NodeJS](https://nodejs.org/en/) - Logiciel permettant la création du service web
* [MySQL](https://www.mysql.com) - Système de gestion de bases de données
* [Sequelize](http://docs.sequelizejs.com) - ORM pour NodeJS
* [Bootstrap](https://getbootstrap.com) - Framework de vue
* [OpenLayers](https://openlayers.org) - Bibliothèque de fonctions pour les cartes Open Street Map

## Auteurs

* **Julien Deroux** - *Travail initial* - [derouxj](https://github.com/derouxj)
* **Gwendal Raballand** - *Travail initial* - [Gwendal-R](https://github.com/Gwendal-R)
* **Hugo Vincelet** - *Travail initial* - [hvincelet](https://github.com/hvincelet)
* **Guillaume Sicard** - *Travail initial* - [GuillaumeSICARD](https://github.com/GuillaumeSICARD)
* **Simon Bonnaud** - *Travail initial* - [Torblad](https://github.com/Torblad)

## Licence

Ce logiciel est sous licence GPL-3.0 - Regardez le fichier [LICENSE.md](LICENSE.md) pour plus de détails.
