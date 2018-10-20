const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');
const session = require('express-session')

const app = express();

app.use(favicon(__dirname + '/views/img/favicon.png'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// view engine setup
app.use("/views", express.static(__dirname + '/views'));
app.set('view engine', 'ejs');

app.use(session({
  genid: (req) => {
    console.log("uuid = "+req.sessionID);
    return uuid();
  },
  secret: 'c97c3d803f65426e82f507ba3f84c725',
  resave: false,
  saveUninitialized: true
}));


global.connected_users = [];

global.connected_user = function(uuid){
    return connected_users.find(function(user){
        return user.uuid == uuid;
    });
};

/*{
    login: "",
    first_name: "",
    last_name: "",
    initials: "",
    picture: first_name[0]+last_name[0],
    idCurrentRaid: 1 //for tests
    raid_list: [] // {id, name, edition}
}*/

const organizer = require('./routes/organizer');
const raid = require('./routes/raid');
const map = require('./routes/map');
const misc = require('./routes/misc');

/**********************************/
/*             Routes             */
/**********************************/

//routes dedicated to register and connection
app.route('/')
    .get(organizer.displayHome);

app.route('/login')
    .get(organizer.displayLogScreen)
    .post(organizer.idVerification);

app.route('/logout')
    .get(organizer.logout);

app.route('/register')
    .get(organizer.displayRegister)
    .post(organizer.register);

app.route('/validate')
    .get(organizer.validate);

//routes dedicated to the raids' pages
app.route('/createraid/start')
    .get(raid.init);

app.route('/createraid/description')
    .get(raid.displayDescriptionForm)
    .post(raid.createRaid);

app.route('/createraid/places')
    .post(raid.getGeocodedResults);

app.route('/createraid/sports')
    .get(raid.displaySportsTable)
    .post(raid.saveSportsRanking);

//routes dedicated to the map
app.route('/editraid/map')
    .get(checkAuth, map.displayMap)
    .post(checkAuth, map.storeMapDatas);

app.route('/termsandpolicy')
    .get(misc.cgu);

//bad url route
app.use(function (req, resp, next) {
    resp.render("pages/404.ejs", {
        "pageTitle": "Erreur 404"
    });
});

console.log('Listen on http://localhost:8080');
app.listen(8080);
