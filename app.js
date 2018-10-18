const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');

const app = express();

app.use(favicon(__dirname + '/views/img/favicon.png'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// view engine setup
app.use("/views", express.static(__dirname + '/views'));
app.set('view engine', 'ejs');

global.user = {
    login: "",
    first_name: "",
    last_name: "",
    initials: "",
    authenticated: false,
    raid_list: [] // {id, name, edition}
};

global.raid = {
    idCurrentRaid: 1 //for tests
}

let checkAuth = function (req, res, next) {
    if (!user.authenticated) {
        res.redirect('/login');
    }
    next();
};

const organizer = require('./routes/organizer');
const raid = require('./routes/raid');
const misc = require('./routes/misc');
const helper = require('./routes/helper');

/**********************************/
/*             Routes             */
/**********************************/

//routes dedicated to register and connection
app.route('/')
    .get(checkAuth, organizer.displayHome);

app.route('/login')
    .get(organizer.displayLogScreen)
    .post(organizer.idVerification);

app.route('/register')
    .get(organizer.displayRegister)
    .post(organizer.register);

// route dedicate to validate organizer inscription
app.route('/validate')
    .post(organizer.validate); // orhanizer method to send mail

// routes dedicated to helper
app.route('/helper')
    .get(helper.displayRegister) // register page for new helper
    .post(helper.register); // register request from helper page
app.route('/helper/:id')
    .get(helper.displayHome); // home default page for helper

//routes dedicated to the raids' pages
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

app.route('/editraid/map')
    .get(checkAuth, raid.displayMap)
    .post(checkAuth, raid.storeMapDatas);

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
