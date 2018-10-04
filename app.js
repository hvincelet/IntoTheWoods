const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');

const app = express();

app.use(favicon(__dirname + '/views/img/favicon.png'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

global.user = {
    login:"",
    first_name:"",
    last_name:"",
    initials:"",
    authenticated:false
};


const organizer = require('./routes/organizer');
const raid = require('./routes/raid');
const misc = require('./routes/misc');

let authenticationMiddleware = function (req, res) {
    if(!user.authenticated){
        user.authenticated = true;
        res.redirect('/login');
    }
};



/**********************************/
/*                                */
/*             Routes             */
/*                                */
/**********************************/

//routes dedicated to register and connection
app.get('/', authenticationMiddleware, organizer.displayHome);
app.route('/login')
    .get(organizer.displayLogScreen)
    .post(organizer.checkAuthentication);
app.route('/register')
    .get(organizer.displayRegister)
    .post(organizer.register);
app.get('/termsandpolicy', misc.cgu);

//routes dedicated to the raids' pages
app.get('/createraid/start', authenticationMiddleware, raid.displayStart);
app.get('/createraid/description', authenticationMiddleware, raid.displayDescriptionForm);
app.get('/createraid/sports', authenticationMiddleware, raid.displaySportsForm);
app.get('/createraid/summary', authenticationMiddleware, raid.displaySummary);
app.post('/createraid/summary', authenticationMiddleware, raid.save);

//bad url route
app.use(function (req, resp, next) {
    resp.render("pages/404.ejs", {
        "pageTitle": "Erreur 404"
    });
});





// view engine setup
app.use("/views", express.static(__dirname + '/views'));
app.set('view engine', 'ejs');

console.log('Listen on http://localhost:8080');
app.listen(8080);