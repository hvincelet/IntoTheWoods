const pages_path = __dirname+"/../views/pages/helpers/";
const models = require('../models');
const sender = require('./sender');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const moment = require('moment');

const helpers = models.helper;

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
                        include: [{
                            model: point_of_interest_model,
                            where: {
                                id_raid: req.params.id
                            }
                        }]
                    }]
                }]
            }).then(function (helper_found) {
                if (!helper_found) {
                    sender.inviteHelper({
                        email: helper_email,
                        raid: req.body.raid
                    });
                    helper_invite_status.push({
                        id: helper_email,
                        status: "ok"
                    });
                }
                if (index === helper_emails.length - 1) {
                    return res.send(JSON.stringify({status: helper_invite_status}));
                }
            });
        } else {
            helper_invite_status.push({
                id: helper_email,
                status: "mail-is-login"
            });
        }
    });

    return res.send(JSON.stringify({status: helper_invite_status}));
};

exports.displayRegister = function (req, res) {
    let raid_id = req.query.raid;
    if (raid_id !== undefined) {
        let get_post_clean = [];

        let point_of_interest_model = models.point_of_interest;
        let helper_post_model = models.helper_post;

        helper_post_model.belongsTo(point_of_interest_model, {foreignKey: 'id_point_of_interest'});

        models.raid.findByPk(raid_id).then(function(raid_found){
            if(raid_found.allow_register !== 1){
                return res.redirect('/helper/register');
            }else{
                helper_post_model.findAll({
                    include: [{
                        model: point_of_interest_model,
                        where: {
                            id_raid: raid_id
                        }
                    }],attributes: ['id', 'title', 'nb_helper']
                }).then(function(helper_posts_found){
                    if(helper_posts_found !== null && helper_posts_found.length > 0){
                        const get_all_helper_posts = helper_posts_found.map(helper_post => {
                            return new Promise(resolve => {
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
                                    return resolve();
                                });
                            });
                        });
                        Promise.all(get_all_helper_posts).then(function(result){
                            res.render(pages_path + "helper_register.ejs", {
                                pageTitle: "Inscription Bénévole",
                                activity: get_post_clean,
                                raid: {
                                    id: raid_found.id,
                                    name: raid_found.name,
                                    edition: raid_found.edition
                                }
                            });
                        });
                    }else{
                        return res.redirect('/helper/register');
                    }
                });
            }
        });
    }else{
        let point_of_interest_model = models.point_of_interest;
        let helper_post_model = models.helper_post;
        let raid_model = models.raid;

        point_of_interest_model.belongsTo(raid_model, {foreignKey: 'id_raid'});
        helper_post_model.belongsTo(point_of_interest_model, {foreignKey: 'id_point_of_interest'});

        let today = new Date();
        //let in_two_months = date.addMonths(today, 2);
        raid_model.findAll({
            attributes: ['id', 'name', 'edition', 'date', 'place'],
            where: {
                date: {
                    [Op.gte]: today.toISOString().split('T')[0]
                },
                allow_register: 1
            }, order: ['name']
        }).then(function (raids_found) {
            if(raids_found){
                let raids = [];
                raids_found.map(raid => {
                    raids.push({id: raid.id, name: raid.name, edition: raid.edition, date: raid.date, place: raid.place});
                });

                res.render(pages_path + "../visitors/register_helper.ejs", {
                    pageTitle: "Inscription bénévoles",
                    raid_list: raids
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
    const registerEmail = req.body.registerEmail;
    const registerUserLn = req.body.registerUserLn;
    const registerUserFn = req.body.registerUserFn;
    const id_raid = req.body.idRaid;
    const helperPostsWished = req.body.whishes;

    const helpers = models.helper;
    const assignments = models.assignment;
    const hp = models.helper_post;
    const poi = models.point_of_interest;

    assignments.belongsTo(hp, {foreignKey: 'id_helper_post'});
    hp.belongsTo(poi, {foreignKey: 'id_point_of_interest'});


    helpers.findOne({
        where: {email: registerEmail}
    }).then(function (helper_found) {
        if(helper_found !== null){
            assignments.findOne({
                include: [{
                    model: hp,
                    attributes: ['id_point_of_interest'],
                    include: [{
                        model:poi,
                        attributes: ['id_raid'],
                        where: { id_raid: id_raid}
                    }]
                }],
                attributes: ['id_helper'],
                where: {id_helper: helper_found.login}
            }).then(function (assignment_for_this_raid_found) {
                if(assignment_for_this_raid_found.helper_post !== null){
                    return res.send(JSON.stringify({msg: "already_register"}));
                }else{
                    create_helper();
                }
            });
        }else{
            create_helper();
        }
    });


    function create_helper() {
        let id_helper = Math.random().toString(36).substr(2, 7);
        helpers.findOne({ where: {login: id_helper } }).then(function (helper_exist) {
            while (helper_exist !== null){
                id_helper = Math.random().toString(36).substr(2, 7);
                helpers.findOne({ where: {login: id_helper }}).then(function (test_helper) {
                    helper_found = test_helper;
                });
            }

            helpers.create({
                login: id_helper,
                email: registerEmail,
                last_name: registerUserLn,
                first_name: registerUserFn
            }).then(function () {

                let create_assignment_actions = helperPostsWished.map(wish => {
                    return new Promise(resolve => {
                        assignments.create({
                            id_helper: id_helper,
                            id_helper_post: wish.id,
                            order_num: wish.order
                        }).then(function () { return resolve(); });
                    });
                });

                Promise.all(create_assignment_actions).then(result => {
                    return res.send(JSON.stringify({msg: "ok"}));
                });
            });
        });
    }
};

exports.displayHome = function (req, res) {

    models.assignment.findAll({
        where: {
            id_helper: req.params.id
        }
    }).then(function (assignments_found) {
        if (assignments_found !== null) {
            const assignment_found = assignments_found.find(function (assignment) {
                return parseInt(assignment.attributed) === 1;
            });
            if (assignment_found === undefined) {
                res.render(pages_path + "helper_home.ejs", {
                    pageTitle: "Inscription Bénévole",
                    errorMessage: "Vous n'avez pas encore été attribué à un poste."
                });
            } else {

                models.helper.findOne({
                    where: {
                        login: assignment_found.id_helper
                    }
                }).then(function (helper_found) {
                    if (helper_found !== null) {
                        models.helper_post.findOne({
                            where: {
                                id: assignment_found.id_helper_post
                            }
                        }).then(function (helper_post_found) {
                            if (helper_post_found !== null) {
                                models.point_of_interest.findOne({
                                    where: {
                                        id: helper_post_found.id_point_of_interest
                                    }
                                }).then(function (point_of_interest_found) {
                                    if (point_of_interest_found !== null) {
                                        models.raid.findOne({
                                            where: point_of_interest_found.id_raid
                                        }).then(function (raid_found) {
                                            res.render(pages_path + "helper_home.ejs", {
                                                pageTitle: "Parcours Bénévole",
                                                assignment: assignment_found,
                                                helper: helper_found,
                                                helper_post: helper_post_found,
                                                point_of_interest: point_of_interest_found,
                                                raid: raid_found
                                            });
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

exports.performCheckin = function (req, res) {
    helpers.findByPk(req.body.helper_login)
        .then(helper_found => {
            helper_found.update({
                check_in: JSON.parse(req.body.check_in) ? 1 : 0
            }).then(function () {
                res.send(JSON.stringify({msg: req.body.check_in}));
            });

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

exports.participantPassage = function(req, res){
    let idParticipant = req.body.idParticipant;
    let idRaid = req.body.idRaid;

    let dateLastStage = 0;

    let orderRun;

    models.stage.findAll({
        where: {
            id_participant: idParticipant
        }
    }).then(function (stages_found) {
        if (stages_found !== null && stages_found.length >= 1) {
            orderRun = stages_found.length + 1;

            dateLastStage = new Date(stages_found[stages_found.length-1].timeEntered+"UTC");

            let dateTime = new Date();

            let time = new Date(dateTime - dateLastStage);

            insertStage(orderRun, time, idParticipant, idRaid);
        }
        else{
            orderRun = 1;
            models.raid.findOne({
                attributes: ['start_time', 'date'],
                where: {
                    id: idRaid
                }
            }).then(function (raid_found) {
                if (raid_found !== null) {
                    let dateRaid = raid_found.date.split("-")
                    let timeRaid = raid_found.start_time.split(":")

                    dateLastStage = new Date(dateRaid[0], dateRaid[1]-1, dateRaid[2], timeRaid[0], timeRaid[1], timeRaid[2]);

                    let dateTime = new Date();
                    let time = new Date(dateTime - dateLastStage);

                    insertStage(orderRun, time, idParticipant, idRaid);
                }
                else{
                    console.log("erreur");
                }
            });
        }
    });
};

insertStage = function(orderRun, time, idParticipant, idRaid){

    models.course.findOne({
        attributes: ['id'],
        where: {
            id_raid: idRaid,
            order_num: orderRun
        }
    }).then(function (course_found) {
        if(course_found !== null){
            models.stage.create({
                id_participant: idParticipant,
                id_course: course_found.id,
                time: time.getUTCHours()+":"+time.getUTCMinutes()+":"+time.getUTCSeconds(),
                timeEntered: new Date()
            });
        }
        else{
            console.log("erreur");
            //TODO : renvoyer un message d'erreur
        }
    });
}

exports.qrcodeReader = function(req, res){
  res.render(pages_path + "qrcodeReader.ejs", {
      pageTitle: "Lecteur de QRCode pour participant",
  });
}

exports.registerRunner = function(req, res){
    var participant = {};
    participant.id = req.body.id;
    participant.time = req.body.time;
    // TODO : register participant and time
    return res.send(participant);
};
