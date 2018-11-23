const pages_path = __dirname+"/../views/pages/helpers/";
const models = require('../models');
const sender = require('./sender');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const date = require('date-and-time');

exports.inviteHelper = function (req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id === parseInt(req.params.raid_id);})){
        return res.redirect('/dashboard');
    }
    const helper_emails = req.body.mails;
    let helper_invite_status = [];
    helper_emails.forEach(function(helper_email, index){
        if(helper_email !== user.login){
            let assignment_model = models.assignment;
            let helper_model = models.helper;
            let helper_post_model = models.helper_post;
            let point_of_interest_model = models.point_of_interest;

            helper_model.belongsTo(assignment_model, {foreignKey: 'login'});
            assignment_model.belongsTo(helper_post_model, {foreignKey: 'id_helper_post'});
            helper_post_model.belongsTo(point_of_interest_model, {foreignKey: 'id_point_of_interest'});

            helper_model.findOne({
                where: {
                    email: helper_email
                },
                include: [{
                    model: assignment_model,
                    include: [{
                        model: helper_post_model,
                        include:[{
                            model: point_of_interest_model,
                            where: {
                                id_raid: req.params.id
                            }
                        }]
                    }]
                }]
            }).then(function(helper_found){
                if(!helper_found){
                    sender.inviteHelper({
                        email: helper_email,
                        raid: req.body.raid
                    });
                    helper_invite_status.push({
                        id: helper_email,
                        status: "ok"
                    });
                }
                if(index === helper_emails.length - 1) {
                    res.send(JSON.stringify({status: helper_invite_status}));
                }
            });
        }else{
            helper_invite_status.push({
                id: helper_email,
                status: "mail-is-login"
            });
        }
    });

    res.send(JSON.stringify({status: helper_invite_status}));
};

exports.displayRegister = function(req, res) {
    let raid_id = req.query.raid;
    if (raid_id !== undefined) {
        let get_post_clean = [];

        let point_of_interest_model = models.point_of_interest;
        let helper_post_model = models.helper_post;

        helper_post_model.belongsTo(point_of_interest_model, {foreignKey: 'id_point_of_interest'});

        models.raid.findById(raid_id, {attributes:['id', 'name', 'edition']}).then(function(raid_found){
            helper_post_model.findAll({
                include: [{
                    model: point_of_interest_model,
                    where: {
                        id_raid: raid_id
                    }
                }],attributes: ['id', 'title', 'nb_helper']
            }).then(function(helper_posts_found){
                if(helper_posts_found !== null && helper_posts_found.length > 0){
                    helper_posts_found.map(helper_post => {
                        models.assignment.findAndCountAll({
                            where: {
                                id_helper_post: helper_post.id,
                                attributed: 1
                            }
                        }).then(function(all_assignement){
                            if(helper_post.point_of_interest !== null && helper_post.nb_helper - all_assignement.count > 0){
                                get_post_clean.push({
                                    'id':helper_post.id,
                                    'title':helper_post.title
                                });
                            }
                        });
                    });

                    res.render(pages_path + "helper_register.ejs", {
                        pageTitle: "Inscription Bénévole",
                        activity: get_post_clean,
                        raid: {
                            id: raid_found.id,
                            name: raid_found.name,
                            edition: raid_found.edition
                        }
                    });
                }else{
                    return res.redirect('/helper/register');
                }
            });
        });
    }else{
        let point_of_interest_model = models.point_of_interest;
        let helper_post_model = models.helper_post;
        let raid_model = models.raid;

        point_of_interest_model.belongsTo(raid_model, {foreignKey: 'id_raid'});
        helper_post_model.belongsTo(point_of_interest_model, {foreignKey: 'id_point_of_interest'});

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
            if(raids_found){
                let raids = [];
                let get_poi_actions = raids_found.map(raid => {
                    return new Promise(resolve => {
                        helper_post_model.findAll({
                            include: [{
                                model: point_of_interest_model,
                                include: [{
                                    model: raid_model,
                                    where: {
                                        id: raid.id
                                    },
                                    attributes: ['name', 'edition']
                                }]
                            }], attributes: ['id', 'title', 'nb_helper']
                        }).then(function (helper_post_found) {
                            if(helper_post_found !== null){
                                if(helper_post_found[0].point_of_interest !== null){
                                    raids.push({id: raid.id, name: raid.name, edition: raid.edition, date: raid.date, place: raid.place});
                                }
                            }
                            return resolve();
                        });
                    });
                });

                Promise.all(get_poi_actions).then(result => {
                    res.render(pages_path + "../visitors/register_helper.ejs", {
                        pageTitle: "Inscription bénévoles",
                        raid_list: raids
                    });
                });
            }else{
                res.render(pages_path + "../visitors/register_helper.ejs", {
                    pageTitle: "Inscription bénévoles",
                    raid_list: []
                });
            }
        });
    }
};

exports.register = function (req, res) {

    let id_helper = Math.random().toString(36).substr(2, 7);
    const registerEmail = req.body.registerEmail;
    const registerUserLn = req.body.registerUserLn;
    const registerUserFn = req.body.registerUserFn;
    let backup = req.body.backup;
    if(backup === undefined) {
        backup = 0;
    }else{
        backup = 1;
    }
    const id_raid = req.body.idRaid;
    let helperPostsWished = req.body.whishes;

    models.helper.findOne({
        where: {
            login: id_helper
        }
    }).then(function (helper_found) {
        while(helper_found !== null) {
            id_helper = Math.random().toString(36).substr(2, 7);
            models.helper.findOne({
                where: {
                    login: id_helper
                }
            }).then(function(test_helper) {
                helper_found = test_helper;
            });
        }
        models.helper.create({
            login: id_helper,
            email: registerEmail,
            last_name: registerUserLn,
            first_name: registerUserFn,
            backup: backup
        }).then(function () {
            if (backup === 1) {
                let helper_post_model = models.helper_post;
                let poi_model = models.point_of_interest;
                helper_post_model.belongsTo(poi_model, {foreignKey: "id_point_of_interest"});
                helper_post_model.findAll({
                    include: {
                        model: poi_model,
                        where: {
                            id_raid: id_raid
                        }
                    }
                }).then(function(helper_posts_found){
                    let count = 1;
                    helper_posts_found.map(function(helper_post){
                        models.assignment.create({
                            id_helper: id_helper,
                            id_helper_post: helper_post.id,
                            order: count
                        });
                        count += 1;
                    });
                });
            }else{
                helperPostsWished.map(wish =>{
                    models.assignment.create({
                        id_helper: id_helper,
                        id_helper_post: wish.id,
                        order: wish.order
                    });
                });
            }
            res.redirect("/helper/" + id_helper + "/home");
        });
    });
};

exports.displayHome = function (req, res) {

    models.assignment.findAll({
        where: {
            id_helper: req.params.id
        }
    }).then(function (assignments_found) {
        if (assignments_found !== null) {
            const assignment_found = assignments_found.find(function(assignment){return parseInt(assignment.attributed) === 1;});
            if (assignment_found === undefined){
                res.render(pages_path + "helper_home.ejs", {
                    pageTitle: "Inscription Bénévole",
                    errorMessage: "Vous n'avez pas encore été attribué à un poste."
                });
            } else {

                models.helper.findOne({
                    where: {
                        login: assignment_found.id_helper
                    }
                }).then(function(helper_found){
                    if (helper_found !== null){
                        models.helper_post.findOne({
                            where: {
                                id: assignment_found.id_helper_post
                            }
                        }).then(function(helper_post_found){
                            if (helper_post_found !== null){
                                models.point_of_interest.findOne({
                                    where: {
                                        id: helper_post_found.id_point_of_interest
                                    }
                                }).then(function(point_of_interest_found){
                                    if (point_of_interest_found !== null){
                                        res.render(pages_path + "helper_home.ejs", {
                                            pageTitle: "Parcours Bénévole",
                                            assignment: assignment_found,
                                            helper: helper_found,
                                            helper_post: helper_post_found,
                                            point_of_interest: point_of_interest_found
                                        });
                                    }
                                });
                            }
                        })
                    }
                })
            }

        } else { // id of helper does not exist
            res.render(pages_path + "helper_register.ejs", {
                pageTitle: "Inscription Bénévole",
                errorMessage: "Cet identifiant n'existe pas."
            });
        }
    });
};

exports.remove = function (req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id === parseInt(req.params.id)})){
        return res.redirect('/dashboard');
    }

    let helper_id = req.body.helper_id;

    models.assignment.findAll({
        where: {
            id_helper: helper_id
        }
    }).then(function (assignments_found) {
        if(assignments_found){
            let delete_assignments_actions = assignments_found.map(assignment => {
                return new Promise(resolve => {
                    models.assignment.destroy({ where: {id_helper: helper_id} }).then(function () { return resolve(); });
                });
            });

            Promise.all(delete_assignments_actions).then(result => {
                models.helper.destroy({ where: {login: helper_id} }).then(function () {
                    res.send(JSON.stringify({msg: "ok"}));
                });
            });
        }
    });
};