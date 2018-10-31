const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');
const session = require('express-session')
const config = require('./config/config').development;

const app = express();

app.use(favicon(__dirname + '/views/img/favicon.png'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// view engine setup
app.use("/views", express.static(__dirname + '/views'));
app.set('view engine', 'ejs');

app.use(session({
  genid: (req) => {
    return uuid();
  },
  secret: 'c97c3d803f65426e82f507ba3f84c725',
  resave: false,
  saveUninitialized: true
}));


global.connected_users = [];
if(config.no_login) {
    connected_users.push({
        login: "hugo.vincelet@gmail.com",
        first_name: "Hugo",
        last_name: "Vincelet",
        initials: "HV",
        picture: null,
        idCurrentRaid: -1,
        raid_list: [{id:1}, {id:2}, {id:3},{id:4},{id:5}]
    });
}
global.connected_user = function(uuid){
    if(config.no_login) {
        return connected_users[0];
    }
    return connected_users.find(function(user){
        return user.uuid == uuid;
    });
};

global.raid = {
    idCurrentRaid: 1 //for tests
}

let checkAuth = function (req, res, next) {
    if(!config.no_login) {
        const user = connected_users.find(function(user){
            return user.uuid == req.sessionID;
        });
        if (!user) {
            return res.redirect('/login');
        }
    }
    next();
};

const organizer = require('./routes/organizer');
const raid = require('./routes/raid');
const map = require('./routes/map');
const misc = require('./routes/misc');
const helper = require('./routes/helper');

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

app.route('/helper')
    .post(helper.register);

app.route('/helper/:id')
    .get(helper.displayHome);

//routes dedicated to the raids' pages
app.route('/dashboard')
    .get(checkAuth, organizer.dashboard);

app.route('/createraid/start')
    .get(checkAuth, raid.init);

app.route('/createraid/description')
    .get(checkAuth, raid.displayDescriptionForm)
    .post(checkAuth, raid.createRaid);

app.route('/createraid/places')
    .post(checkAuth, raid.getGeocodedResults);

app.route('/createraid/sports')
    .get(checkAuth, raid.displaySportsTable)
    .post(checkAuth, raid.saveSportsRanking);

app.route('/editraid')
    .get(checkAuth, raid.displayAllRaids);

app.route('/editraid/:id')
    .get(checkAuth, raid.displayRaid);

app.route('/editraid/:id/map')
    .get(checkAuth, map.displayMap)
    .post(checkAuth, map.storeMapData);

app.route('/team/:raid_id/inviteorganizers')
    .post(checkAuth, organizer.shareRaidToOthersOrganizers);

app.route('/team/:raid_id/invitehelpers')
    .post(checkAuth, organizer.inviteHelper);

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
