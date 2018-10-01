var Sequelize = require('sequelize');
var env       = 'development';
var config    = require(__dirname + '/../config/config.js')[env];
var db        = {};

var sequelize = new Sequelize(config.database, config.username, config.password, config);

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
