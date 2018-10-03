const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');

const app = express();

app.use(favicon(__dirname + '/views/img/favicon.png'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const organizer = require('./routes/organizer');
const misc = require('./routes/misc');

app.route('/')
    .get(organizer.displayHome);

app.route('/login')
    .get(organizer.displayLogScreen)
    .post(organizer.checkAuthentication);

app.route('/register')
    .get(organizer.displayRegister)
    .post(organizer.register);

app.route('/termsandpolicy')
    .get(misc.cgu);

// view engine setup
app.use("/views", express.static(__dirname + '/views'));
app.set('view engine', 'ejs');

// catch 404 and forward to error handler
app.use(function(req, resp, next) {
    resp.render("pages/404.ejs", {
        "pageTitle" : "Erreur 404"
    });
});

console.log('Listen on http://localhost:8080');
app.listen(8080);