const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');
const crypto = require('crypto');
const sender = require('./sender');
const Sequelize = require('sequelize');

exports.displayHome = function(req, res) {
    models.raid.findAll({
        attributes: ['id', 'name', 'date', 'edition', 'place']
    }).then(function (raids_found){
        let raids = [];
        raids_found.forEach(function(raid){
            raids.push({
                id: raid.dataValues.id,
                name: raid.dataValues.name,
                date: raid.dataValues.date,
                edition: raid.dataValues.edition,
                place: raid.dataValues.place
            });
        });
        const user = connected_user(req.sessionID);
        res.render(pages_path + "contents/homepage.ejs", {
            pageTitle: "Accueil",
            page: "homepage",
            raids: raids,
            user: user
        });
    });
};

exports.dashboard = function (req, res) {
    const user = connected_user(req.sessionID);
    res.render(pages_path + "template.ejs", {
        pageTitle: "Tableau de bord",
        page: "dashboard",
        user: user
    });
};

exports.displayLogScreen = function (req, res) {
    const user = connected_user(req.sessionID);
    if(user) {
        return res.redirect("/");
    }
    res.render(pages_path + "login.ejs", {
        pageTitle: "Connexion"
    });
};

exports.idVerification = function (req, res) {
    let id = req.body.loginUsername;
    let hash = crypto.createHmac('sha256', req.body.loginPassword).digest('hex');
    models.organizer.findOne({
        where: {
            email: id,
            password: hash,
            active: '1'
        }
    }).then(function (organizer_found) {
        if (organizer_found !== null) { // the (email,password) couple exists => the organizer is authenticated
            let user = {
                uuid: req.sessionID,
                login: organizer_found.dataValues.email,
                first_name: organizer_found.dataValues.first_name,
                last_name: organizer_found.dataValues.last_name,
                initials: organizer_found.dataValues.first_name.charAt(0).concat(organizer_found.dataValues.last_name.charAt(0)).toUpperCase(),
                picture: organizer_found.dataValues.picture,
                raid_list: [], // {id, name, edition}
                idCurrentRaid: -1
            };

            let team_model = models.team;
            let raid_model = models.raid;

            raid_model.belongsTo(team_model, {foreignKey: 'id'});

            raid_model.findAll({
                include: [{
                    model: team_model,
                    where: {
                        id_raid: Sequelize.col('raid.id'),
                        id_organizer: user.login
                        //date > date_of_the_day - one_month
                    }
                }],
                attributes: ['id', 'name', 'edition', 'date', 'place']
            }).then(function(raids_found){
                if(raids_found){
                    raids_found.forEach(function(tuple){
                        user.raid_list.push({
                            id: tuple.dataValues.id,
                            name: tuple.dataValues.name,
                            edition: tuple.dataValues.edition,
                            date: tuple.dataValues.date,
                            place: tuple.dataValues.place
                        });
                    });
                }
                connected_users.push(user);
            });
            return res.redirect('/dashboard');
        } else {
            res.render(pages_path + "login.ejs", {
                pageTitle: "Connexion",
                errorMessage: "Identifiants incorrects ou confirmation par mail requise."
            });
        }
    });
};

exports.logout = function (req, res) {
    let connected_user_index;
    const user = connected_users.find(function(user, index){
        connected_user_index = index;
        return user.uuid === req.sessionID;
    });
    if(user){
        connected_users.splice(connected_user_index, 1);
    }
    res.redirect('/');
};

exports.displayRegister = function (req, res) {
    res.render(pages_path + "register.ejs", {
        pageTitle: "Inscription"
    });
};

exports.register = function (req, res) {

    let hash = crypto.createHmac('sha256', req.body.password).digest('hex');

    models.organizer.findOne({
        where: {
            email: req.body.email
        }
    }).then(function (organizer_found) {
        if (organizer_found !== null) {
            res.send(JSON.stringify({msg: "already-exist"}));
        } else {
            models.organizer.create({
                email: req.body.email,
                first_name: req.body.firstname,
                last_name: req.body.lastname,
                password: hash,
                picture: jdenticon.toPng(req.body.firstname.concat(req.body.lastname), 80).toString('base64')
            }).then(function () {
                sender.sendMail(req.body.email, hash);
                res.send(JSON.stringify({msg: "ok"}));
            });
        }
    });

};

exports.validate = function(req, res) {
    models.organizer.findOne({
        where: {
            email: req.query.id,
            password: req.query.hash
        }
    }).then(function (organizer_found) {
        if (organizer_found === null) {
            console.log("Validating invalid user");
        } else {
            organizer_found.updateAttributes({
                active: '1'
            });
        }
        res.render(pages_path + "login.ejs", {
            pageTitle: "Connexion",
            successMessage: "Votre adresse mail a bien été confirmée."
        });
    })
};

exports.displayRaid = function(req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id == req.params.id})){
        return res.redirect('/dashboard');
    }

    let organizers_linked_with_the_current_raid = [];

    let team_model = models.team;
    let organizer_model = models.organizer;

    organizer_model.belongsTo(team_model, {foreignKey: 'email'});

    organizer_model.findAll({ // Get all organizers assigned to the current raid
        attributes: ['email', 'last_name', 'first_name'],
        include: [{
            model: team_model,
            where: {
                id_organizer: Sequelize.col('organizer.email'),
                id_raid: req.params.raid_id
            }
        }]
    }).then(function(organizers_found){

        organizers_found.forEach(function(organizer){
            organizers_linked_with_the_current_raid.push({
                email: organizer.dataValues.email,
                first_name: organizer.dataValues.firstname,
                last_name: organizer.dataValues.last_name
            });
        });

        let raid_model = models.raid;
        let course_model = models.course;
        let point_of_interest_model = models.point_of_interest;
        let helper_post_model = models.helper_post;
        let assignment_model = models.assignment;
        let helper_model = models.helper;

        raid_model.belongsTo(course_model, {foreignKey: 'id'});
        course_model.belongsTo(point_of_interest_model, {foreignKey: 'id'});
        point_of_interest_model.belongsTo(helper_post_model, {foreignKey: 'id'});
        helper_post_model.belongsTo(assignment_model, {foreignKey: 'id'});
        //helper_model.belongsTo(assignment_model, {foreignKey: 'login'});
        //assignment_model.belongsTo(helper_model, {foreignKey: 'id_helper'});

        raid_model.findAll({ // Get all helpers assigned to the current raid
            where: {
                id: req.params.raid_id
            },
            include: [{
                model: course_model,
                where: {
                    id_raid: Sequelize.col('raid.id')
                },
                include: [{
                    model: point_of_interest_model,
                    where: {
                        id_track: Sequelize.col('course.id')
                    }/*,
                    include: [{
                        model: helper_post_model,
                        attributes: ['id', 'description'],
                        where: {
                            id_point_of_interest: Sequelize.col('point_of_interest.id')
                        },
                        include: [{
                            model: assignment_model,
                            attributes: ['attributed'],
                            where: {
                                id_helper_post: Sequelize.col('helper_post.id')
                            },
                            include: [{
                                model: helper_model,
                                attributes: ['email', 'last_name', 'first_name'],
                                where: {
                                    login: Sequelize.col('id_helper')
                                }
                            }]
                        }]
                    }]*/
                }]
            }]
        }).then(function(assignments_found){
            let helpers_linked_with_the_current_raid = [];
            /*helper_model.findAll({
                attributes: ['login', 'last_name', 'first_name']
            }).then(function(all_helpers){
                assignments_found.forEach(function(assignment){
                    all_helpers.forEach(function(helper){
                        if(helper.dataValues.login == assignment.dataValues.id_helper){

                        }
                    });
                });
            });*/

            let courses_linked_with_the_current_raid = [];

            let course_model = models.course;
            let sport_model = models.sport;

            sport_model.belongsTo(course_model, {foreignKey: 'id'});
            sport_model.findAll({
                attributes: ['name'],
                include: [{
                    model: course_model,
                    attributes: ['order_num'],
                    where: {
                        id_sport: Sequelize.col('sport.id'),
                        id_raid: req.params.id
                    }
                }]
            }).then(function(course_name_and_order_found){
                course_name_and_order_found.forEach(function(course){
                    courses_linked_with_the_current_raid.push({
                        order: course.dataValues.course.order_num,
                        name: course.dataValues.name
                    });
                });
                /*res.render(pages_path + "template.ejs", {
                    pageTitle: "Équipe et organisateurs",
                    page: "",
                    user: user,
                    organizers: organizers_linked_with_the_current_raid, // [{email, first_name, last_name}]
                    helpers: helpers_linked_with_the_current_raid, // [{email, first_name, last_name, posts_asked:[{helper_post_id, description}]}]
                    courses: courses_linked_with_the_current_raid,
                    raid_id: req.params.raid_id
                });*/
            })

        });

    });
};

exports.shareRaidToOthersOrganizers = function(req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id == req.params.raid_id})){
        return res.redirect('/dashboard');
    }

    let organizer_list_to_invite = ["hvincele@enssat.fr", "someone@domain-name.com"];
    organizer_list_to_invite.foreach(function(organizer_email){
        if(organizer_email != user.login){
            models.organizer.findOne({
                where: {email: organizer_email}
            }).then(function(organizer){
                if(organizer){
                    //sender.sendMail(organizer_email, );
                }else{
                    //sender.senMail(organizer_email, ); // Also invite to register in the app
                }
            });
        }
    });
};

exports.inviteHelper = function(req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id == req.params.raid_id})){
        return res.redirect('/dashboard');
    }

    let helper_list_to_invite = ["hvincele@enssat.fr", "someone@domain-name.com"];
    const current_user_email = connected_user(req.sessionID).login;
    helper_list_to_invite.foreach(function(helper_email){
        if(helper_email != user.login){
            //sender.sendMail(helper_email, );
        }
    });
};