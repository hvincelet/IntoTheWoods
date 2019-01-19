global.env = process.argv[2];
const https = require('https');
const fs = require('fs');
const express = require('express');
const vhost = require('vhost');
const favicon = require('serve-favicon');
const express_lib = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');
const session = require('express-session');
const config = require('./config/config')[global.env];

// IntoTheWoods app
const intothewoods = express();

intothewoods.use(favicon(__dirname + '/views/img/favicon.png'));
intothewoods.use(bodyParser.json());
intothewoods.use(bodyParser.urlencoded({extended: true}));
intothewoods.use("/views", express.static(__dirname + '/views'));
intothewoods.set('view engine', 'ejs');
intothewoods.use(session({
    genid: (req) => {
        return uuid();
    },
    secret: 'c97c3d803f65426e82f507ba3f84c725',
    resave: false,
    saveUninitialized: true
}));

global.connected_users = [];
if (config.no_login) {
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

global.connected_user = function (uuid) {
    if (config.no_login) {
        return connected_users[0];
    }
    return connected_users.find(function (user) {
        return user.uuid == uuid;
    });
};

let checkAuth = function (req, res, next) {
    if (!config.no_login) {
        const user = connected_users.find(function (user) {
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
const participant = require('./routes/participant');
const live = require('./routes/live');

/**********************************/
/*             Routes             */
/**********************************/

// Misc routes
intothewoods.route('/termsandpolicy')
    .get(misc.cgu);

intothewoods.route('/')
    .get(misc.displayHome);

// Routes dedicated to register and connection
intothewoods.route('/login')
    .get(organizer.displayLogScreen)
    .post(organizer.idVerification);

intothewoods.route('/logout')
    .get(organizer.logout);

intothewoods.route('/register')
    .get(organizer.displayRegister)
    .post(organizer.register);

intothewoods.route('/validate')
    .get(organizer.validate); // /validate?id={email}&hash={password_hash}

intothewoods.route('/resetpassword')
    .post(misc.forgotten_password)
    .get(misc.display_change_password);

intothewoods.route('/newpassword')
    .post(misc.register_new_password);

//routes dedicated to the raids' pages
intothewoods.route('/dashboard')
    .get(checkAuth, organizer.dashboard);

intothewoods.route('/createraid/start')
    .get(checkAuth, raid.init);

intothewoods.route('/createraid/from_exist')
    .get(checkAuth, raid.from_exist);

intothewoods.route('/createraid/description')
    .get(checkAuth, raid.displayDescriptionForm)
    .post(checkAuth, raid.createRaid);

intothewoods.route('/createraid/places')
    .post(checkAuth, raid.getGeocodedResults);

intothewoods.route('/createraid/sports')
    .get(checkAuth, raid.displaySportsTable)
    .post(checkAuth, raid.saveSportsRanking);

intothewoods.route('/editraid')
    .get(checkAuth, raid.displayAllRaids);

intothewoods.route('/editraid/:id')
    .get(checkAuth, raid.displayRaid);

intothewoods.route('/editraid/:id/map')
    .get(checkAuth, map.displayMap)
    .post(checkAuth, map.storeMapData);

intothewoods.route('/editraid/:id/allowregister')
    .post(checkAuth, raid.allowregister);

intothewoods.route('/editraid/:id/starttime')
    .post(checkAuth, raid.starttime);

intothewoods.route('/editraid/:id/sendMessage')
    .post(checkAuth, organizer.sendMail);

intothewoods.route('/editraid/:id/updatepoi')
    .post(checkAuth, raid.savePoi);

intothewoods.route('/editraid/:id/removeOrganizer')
    .post(checkAuth, organizer.remove);

intothewoods.route('/editraid/:id/removeHelper')
    .post(checkAuth, helper.remove);

intothewoods.route('/team/:raid_id/inviteorganizers')
    .post(checkAuth, organizer.shareRaidToOthersOrganizers);

//intothewoods.route('/editraid/setStartTime')
//    .post(checkAuth, raid.setStartTime);

intothewoods.route('/editraid/:id/generateQRCode')
    .post(checkAuth, raid.generateQRCode);

intothewoods.route('/editraid/:id/allowqrcodereader')
        .post(checkAuth, raid.allowqrcodereader);

//routes dedicated to the helpers
intothewoods.route('/team/:raid_id/invitehelpers')
    .post(checkAuth, helper.inviteHelper);

intothewoods.route('/helper/register')
    .get(helper.displayRegister) // /helper/register?raid={raid_id}
    .post(helper.register);

intothewoods.route('/helper/assign')
    .post(checkAuth, organizer.assignHelper);

intothewoods.route('/helper/:id/home')
    .get(helper.displayHome);

intothewoods.route('/helper/check_in')
    .post(helper.performCheckin);
intothewoods.route('/helper/participantPassage')
    .post(helper.participantPassage); //TODO : Décommenter la ligne une fois le dev terminé

intothewoods.route('/helper/qrcodereader')
    .get(helper.qrcodeReader);

intothewoods.route('/helper/registerrunner')
    .post(helper.registerRunner);

// Routes dedicated to participant
intothewoods.route('/participant/register')
    .get(participant.displayRegister)
    .post(participant.register);

//Routes dedicated to the Live
intothewoods.route('/live/:id')
    .get(live.displayLive)
    .post(live.getData);

// Routes dedicated to participant
intothewoods.route('/participant/register')
    .get(participant.displayRegister)
    .post(participant.register);


// routes dedicated to the team' pages
//intothewoods.route('/manageteam') // manage helper and organizer of raid
//    .get(organizer.manageTeam);
//intothewoods.route('/manageteam/helper') // manage helper of raid
//    .get(organizer.manageHelper)
//    .post(organizer.assignHelper);
//intothewoods.route('/manageteam/organizer') // manage organizer of raid
//    .get(organizer.manageOrganizer);

//bad url route
intothewoods.use(function (req, resp, next) {
    resp.render(__dirname + "/views/pages/404.ejs", {
        "pageTitle": "Erreur 404"
    });
});

// NOT MODIFY AFTER THIS LINE !
if(env === "production"){
    const credentials = {
        key: fs.readFileSync('/etc/letsencrypt/live/runtonic.ovh/privkey.pem', 'utf8'),
        cert: fs.readFileSync('/etc/letsencrypt/live/runtonic.ovh/cert.pem', 'utf8'),
        ca: fs.readFileSync('/etc/letsencrypt/live/runtonic.ovh/chain.pem', 'utf8')
    };

    let app = module.exports = express();

    //app.use(vhost('runtonic.ovh', runtonic)); // Serves top level doruntonic via Main server app
    //app.use(vhost('www.runtonic.ovh', runtonic)); // Serves top level doruntonic via Main server app
    app.use(vhost(config.server_host, intothewoods)); // Serves top level runtonic via Main server app

    const httpServer = express_lib();
    const httpsServer = https.createServer(credentials, app);

    httpServer.get('*', function(req, res){
        res.redirect('https://' + req.headers.host + req.url);
    });

    httpServer.listen(config.server_port_http);
    console.log('HTTP Server running on '+config.server_host+':'+config.server_port_http);

    httpsServer.listen(config.server_port_https, () => {
        console.log('HTTPS Server running on '+config.server_host+':'+config.server_port_https);
    });
}else{
    intothewoods.listen(config.server_port_http);
    console.log('HTTP Server running on '+config.server_host+':'+config.server_port_http);
}
