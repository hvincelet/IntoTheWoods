const pages_path = __dirname+"/../views/pages/visitors/";
const models = require('../models');
const sender = require('./sender');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const date = require('date-and-time');

exports.displayRegister = function(req, res) {
    let raid_id = req.query.raid;
    if (raid_id !== undefined) {
        let get_post_clean = [];

        let raid_model = models.raid;


        raid_model.findOne({
            attributes: ['id', 'name', 'edition'],
            where: {
                id: raid_id
            }
        }).then(function (raid_found) {
            if (raid_found !== null) {
                res.render(pages_path + "participant_register.ejs", {
                    pageTitle: "Inscription courses",
                    raid: {
                        id: raid_id,
                        name: raid_found.name,
                        edition: raid_found.edition
                    }
                });
            } else {
                return res.redirect('/participant/register');
            }
        });
    }else{
        let raid_model = models.raid;

        let today = new Date();
        let in_two_months = date.addMonths(today, 2);
        raid_model.findAll({
            attributes: ['id', 'name', 'edition', 'date', 'place'],
            where: {
                date: {
                    [Op.gte]: today.toISOString().split('T')[0],
                    [Op.lte]: in_two_months.toISOString().split('T')[0]
                }
            }, order: ['name']
        }).then(function (raids_found) {
            let raids = [];
            if(raids_found !== null){
                raids_found.map(raid =>{
                    raids.push({id: raid.id, name: raid.name, edition: raid.edition, date: raid.date, place: raid.place});
                });
            }

            res.render(pages_path + "../visitors/register_runner.ejs", {
                pageTitle: "Inscription courses",
                raid_list: raids
            });
        });
    }
};

exports.register = function (req, res) {

    // TODO
};