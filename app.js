const express = require('express');
const favicon = require('serve-favicon');

require('./models/init');

const app = express();

app.use(favicon(__dirname + '/views/img/favicon.png'));

var organizer = require('./controllers/organizer');

app.route('/')
    .get(organizer.displayHome)
    .post(organizer.checkAuthentification);

app.route('/login')
    .get(organizer.displayLogScreen);



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