const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const env = 'development';
const config = require(__dirname + '/../config/config.js')[env];

let sequelize = new Sequelize(config.database, config.username, config.password, config);
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