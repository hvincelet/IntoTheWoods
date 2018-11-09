const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');
const session = require('express-session');
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
        login: "derouxjulien@gmail.com",
        first_name: "Julien",
        last_name: "Deroux",
        initials: "JD",
        picture: null,
        idCurrentRaid: -1, //for tests
        raid_list: [{
            id: 1,
            place: "Pleumeur-Bodou, Lannion, Côtes-d'Armor, Bretagne, France métropolitaine, 22560, France",
            lat: 48.7732657,
            lng: -3.5187179

        }]
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
    .get(organizer.validate); // /validate?id={email}&hash={password_hash}

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

app.route('/editraid/:id/sendMessage')
    .post(checkAuth, organizer.sendMail);

app.route('/team/:raid_id/inviteorganizers')
    .post(checkAuth, organizer.shareRaidToOthersOrganizers);


//routes dedicated to the helpers
app.route('/team/:raid_id/invitehelpers')
    .post(checkAuth, helper.inviteHelper);

app.route('/helper/register')
    .get(helper.displayRegister) // /helper/register?raid={raid_id}
    .post(helper.register);

app.route('/helper/assign')
    .post(checkAuth, organizer.assignHelper);

app.route('/helper/:id/home')
    .get(helper.displayHome);



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
