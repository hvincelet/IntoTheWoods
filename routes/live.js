const pages_path = __dirname+"/../views/pages/live/";
const models = require('../models');
const Sequelize = require('sequelize');

exports.home = function (req, res) {
    res.render(pages_path + "public.ejs", {
        pageTitle: "Live!"
    });
};