const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');

const app = express();

app.use(favicon(__dirname + '/views/img/favicon.png'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

class User {
    constructor() {
        this.login = "";
        this.authenticated = false;
    }
    isAuthenticated() {
        return this.authenticated;
    }
    setAuthenticated(authenticated) {
        this.authenticated = authenticated;
    }
}

user = new User();

const organizer = require('./routes/organizer');
const raid = require('./routes/raid');
const misc = require('./routes/misc');

let authenticationMiddleware = function (req, res) {
    console.log(user.isAuthenticated());
    if (!user.isAuthenticated()) {
        user.setAuthenticated(true);
        res.redirect('/login');
    }
};

//routes dedicated to the organizers' pages
app.route('/')
    .get(organizer.displayHome);
app.route('/login')
    .get(organizer.displayLogScreen)
    .post(organizer.checkAuthentication);
app.route('/register')
    .get(organizer.displayRegister)
    .post(organizer.register);

//routes dedicated to the raids' pages
app.route('/createraid/start')
    .get(raid.displayStart);
app.route('/createraid/description')
    .get(raid.displayDescriptionForm);
app.route('/createraid/sports')
    .get(raid.displaySportsForm);
app.route('/createraid/summary')
    .get(raid.displaySummary)
    .post(raid.save);

app.route('/termsandpolicy')
    .get(misc.cgu);

app.use('/', authenticationMiddleware);
app.use('/createraid/start', authenticationMiddleware);
app.use('/createraid/description', authenticationMiddleware);
app.use('/createraid/sports', authenticationMiddleware);
app.use('/createraid/summary', authenticationMiddleware);

// view engine setup
app.use("/views", express.static(__dirname + '/views'));
app.set('view engine', 'ejs');

// catch 404 and forward to error handler
app.use(function (req, resp, next) {
    resp.render("pages/404.ejs", {
        "pageTitle": "Erreur 404"
    });
});

console.log('Listen on http://localhost:8080');
app.listen(8080);