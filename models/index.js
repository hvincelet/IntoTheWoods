const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const env = 'development';
const config = require(__dirname + '/../config/config.js')[env];
const credentials = require(__dirname + '/../' + config.credentials)[env];

global.sequelize = new Sequelize(credentials.database, credentials.username, credentials.password, credentials);
let basename = path.basename(__filename);
let db = {};

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        var model = sequelize['import'](path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;