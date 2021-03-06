const jdenticon = require('jdenticon');
const pages_path = __dirname+"/../views/pages/";
const models = require('../models');
const crypto = require('crypto');
const sender = require('./sender');
const Sequelize = require('sequelize');
const fs = require('fs');

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
    if (user) {
        return res.redirect("/dashboard");
    }
    if(req.query.new_password === '1') {
        return res.render(pages_path + "login.ejs", {
            pageTitle: "Connexion",
            new_password: "Votre mot de passe a bien été modifié."
        });
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
                raid_list: [],
                idCurrentRaid: -1
            };

            let team_model = models.team;
            let raid_model = models.raid;

            team_model.belongsTo(raid_model, {foreignKey: 'id_raid'});

            team_model.findAll({
                include: [{
                    model: raid_model
                }],
                where: {
                    id_organizer: user.login
                }
            }).then(function(raids_found){
                raids_found.map(tuple => {
                    let date = tuple.dataValues.raid.dataValues.date.split('-');
                    let local_date = date[2]+'/'+date[1]+'/'+date[0];
                    let in_future = false;
                    if(new Date(date) >= new Date()){
                        in_future = true;
                    }
                    user.raid_list.push({
                        id: tuple.dataValues.raid.dataValues.id,
                        name: tuple.dataValues.raid.dataValues.name,
                        edition: tuple.dataValues.raid.dataValues.edition,
                        date: local_date,
                        place: tuple.dataValues.raid.dataValues.place,
                        lat: tuple.dataValues.raid.dataValues.lat,
                        lng: tuple.dataValues.raid.dataValues.lng,
                        start_time: tuple.dataValues.raid.start_time,
                        allow_register: tuple.dataValues.raid.allow_register,
                        hashtag: tuple.dataValues.raid.dataValues.hashtag,
                        in_future: in_future
                    });
                });
                connected_users.push(user);
                return res.redirect('/dashboard');
            });
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
    const user = connected_users.find(function (user, index) {
        connected_user_index = index;
        return user.uuid === req.sessionID;
    });
    if (user) {
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
                active: false,
                picture: jdenticon.toPng(req.body.firstname.concat(req.body.lastname), 80).toString('base64')
            }).then(function () {
                internal_raids_tchat.push({
                    user_id: req.body.email,
                    user_type: 'organizer',
                    name: req.body.firstname + ' ' + req.body.lastname,
                    socket_id: '',
                    pending_messages: []
                });
                sender.sendMailToOrganizer(req.body.email, hash);
                res.send(JSON.stringify({msg: "ok"}));
            });
        }
    });
};

exports.validate = function (req, res) {
    models.organizer.findOne({
        where: {
            email: req.query.id,
            password: req.query.hash
        }
    }).then(function (organizer_found) {
        if (organizer_found === null) {
            console.log("Validating invalid user");
        } else {
            organizer_found.update({
                active: '1'
            });
        }
        res.render(pages_path + "login.ejs", {
            pageTitle: "Connexion",
            successMessage: "Votre adresse mail a bien été confirmée."
        });
    })
};

exports.shareRaidToOthersOrganizers = function(req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id === parseInt(req.params.raid_id)})){
        return res.redirect('/dashboard');
    }

    let invited_organizer = req.body.mail;
    if(invited_organizer !== user.login){
        models.team.findOne({
            where: {
                id_organizer: invited_organizer,
                id_raid: req.params.raid_id
            }
        }).then(function (organizer_found) {
            if(organizer_found){
                res.send(JSON.stringify({msg: "already-in-team"}));
            }else{
                models.organizer.findOne({
                    where: {email: invited_organizer}
                }).then(function (organizer) {
                    if(organizer){
                        models.team.create({
                            id_raid: req.params.raid_id,
                            id_organizer: invited_organizer
                        }).then(function (organizer_add_to_team) {
                            if(organizer_add_to_team){
                                // send mail
                                sender.inviteOrganizer({
                                    email: invited_organizer,
                                    organizer: user.first_name + " " + user.last_name,
                                    raid: req.body.raid
                                });
                                res.send(JSON.stringify({msg: "ok"}));
                            }else {
                                res.send(JSON.stringify({msg: "not-added"}));
                            }
                        });
                    }else{
                        res.send(JSON.stringify({msg: "no-account"}));
                    }
                });
            }
        });
    }else{
        res.send(JSON.stringify({msg: "mail-is-login"}));
    }
};

exports.assignHelper = function(req, res) {
    if(req.body.assignments_array !== undefined) {
        const assign_helper_actions = req.body.assignments_array.map(assignment => {
            return new Promise(resolve => {
                models.assignment.findOne({
                    where: {
                        id_helper: assignment.id_helper,
                        attributed: 1
                    }
                }).then(function (assignment_to_unattribute) {
                    if (assignment_to_unattribute !== null) { // Helper has already been assigned
                        assignment_to_unattribute.update({
                            attributed: 0
                        }).then(function () {
                            sendMailToHelperToNoticeHimHisAssignment(assignment);
                            return resolve();
                        });
                    } else { // Helper has never been assigned
                        sendMailToHelperToNoticeHimHisAssignment(assignment);
                        return resolve();
                    }
                });
            });
        });
        Promise.all(assign_helper_actions).then(result => {
            res.send(JSON.stringify({msg: "ok"}));
        });
    }
};

function sendMailToHelperToNoticeHimHisAssignment(assignment){
    models.assignment.findOne({
        where: {
            id_helper: assignment.id_helper,
            id_helper_post: assignment.id_helper_post
        }
    }).then(function(assignment_to_attribute) {
        if(assignment_to_attribute !== null) {
            assignment_to_attribute.update({
                attributed: 1
            }).then(function () {
                models.helper.findOne({
                    where: {
                        login: assignment.id_helper
                    },
                    attributes: ['email']
                }).then(function (helper_found) {
                    if (helper_found !== null) {
                        let local_email = helper_found.dataValues.email;
                        models.helper_post.findOne({
                            where: {
                                id: assignment.id_helper_post
                            },
                            attributes: ['id_point_of_interest', 'description', 'title']
                        }).then(function (helper_post_found) {
                            if (helper_post_found !== null) {
                                models.point_of_interest.findOne({
                                    where: {
                                        id: helper_post_found.dataValues.id_point_of_interest
                                    },
                                    attributes: ['id_raid']
                                }).then(function (point_of_interest_found) {
                                    if (point_of_interest_found !== null) {
                                        models.raid.findOne({
                                            where: {
                                                id: point_of_interest_found.dataValues.id_raid
                                            }
                                        }).then(function (raid_found) {
                                            if (raid_found !== null) {
                                                let local_name = raid_found.name;
                                                let date = raid_found.date.split('-');
                                                let local_date = date[2]+'/'+date[1]+'/'+date[0];
                                                let local_edition = raid_found.edition;
                                                let local_place = raid_found.place;
                                                let local_time = "";
                                                if(raid_found.start_time !== null){
                                                    let time = raid_found.start_time.split(':');
                                                    local_time = time[0]+'h'+time[1];
                                                }
                                                sender.sendMailToHelper({
                                                    email: local_email,
                                                    id_helper: assignment.id_helper,
                                                    id_helper_post: assignment.id_helper_post,
                                                    title: helper_post_found.title,
                                                    description: helper_post_found.description,
                                                    name: local_name,
                                                    date: local_date,
                                                    time: local_time,
                                                    edition: local_edition,
                                                    place: local_place
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }
    });
}

exports.sendMail = function (req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id === parseInt(req.params.id)})){
        return res.redirect('/dashboard');
    }

    let mails = req.body.mails;
    mails.map(mail =>{
        if(mail !== ""){
            sender.sendMail({
                email: mail,
                organizer: req.body.organizer,
                message: req.body.message,
                subject: req.body.subject,
                raid_name: req.body.raid_name
            });
        }
    });
    res.send(JSON.stringify({msg: "ok"}));
};

exports.remove = function (req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id === parseInt(req.params.id)})){
        return res.redirect('/dashboard');
    }

    let organizer_id = req.body.organizer_id;
    let raid_id = req.params.id;

    models.team.findAll({
        where: {
            id_raid: raid_id
        }
    }).then(function (organizers_in_team) {
        if(organizers_in_team.length > 1){
            models.team.destroy({
                where: {
                    id_raid: raid_id,
                    id_organizer: organizer_id
                }
            }).then(function () {
                res.send(JSON.stringify({msg: "ok"}));
            });
        }else{
            res.send(JSON.stringify({msg: "only_one_organizer"}));
        }
    });
};

exports.profile = function (req, res) {
    const user = connected_user(req.sessionID);
    res.render(pages_path + "template.ejs", {
        pageTitle: "Gestion du profil",
        page: "profile",
        user: user
    });
};

exports.saveProfile = function (req, res) {
    const user = connected_user(req.sessionID);

    let photo = req.body.photo.split(',')[1];

    models.organizer.update({
        picture: photo
    },{where: {email: user.login}}).then(function () {
        user.picture = photo;

        res.send(JSON.stringify({msg: "ok"}));
    });
};

exports.displayMessenger = function (req, res){
    const raid = req.params.raid_id;
    const organizer_array = [];
    const helper_array = [];
    models.team.findAll({
        where: {
            id_raid: raid
        },
        attributes: ['id_organizer']
    }).then(function(organizer_found){
        if(organizer_found !== null){
            cpt=0;
            organizer_found.forEach(function(current_organizer){
                models.organizer.findOne({
                    where:{
                        email: current_organizer.id_organizer
                    },
                    attributes: ['email','last_name','first_name']
                }).then(function(current_organizer_found){
                    if(current_organizer_found !== null){
                        organizer_array.push(current_organizer_found);
                    }
                });
                cpt=cpt+1;
                if(cpt==organizer_found.length){
                    models.point_of_interest.findAll({
                        where:{
                            id_raid: raid
                        },
                        attributes: ['id']
                    }).then(function(point_of_interest_found){
                        if(point_of_interest_found !== null){
                            cpt2=0;
                            point_of_interest_found.forEach(function(poi){
                                models.helper_post.findOne({
                                    where:{
                                        id_point_of_interest: poi.id
                                    },
                                    attributes: ['id','allow_qrcodereader']
                                }).then(function(helper_post_found){
                                    if(helper_post_found !== null){
                                        models.assignment.findOne({
                                            where:{
                                                id_helper_post: helper_post_found.id
                                            },
                                            attributes: ['id_helper']
                                        }).then(function(assignment_found){
                                            if(assignment_found !== null){
                                                models.helper.findOne({
                                                    where:{
                                                        login: assignment_found.id_helper
                                                    },
                                                    attributes: ['login','last_name','first_name']
                                                }).then(function(helper_found){
                                                    if(helper_found !== null){
                                                        helper_found.allow_qrcodereader = helper_post_found.allow_qrcodereader;
                                                        helper_array.push(helper_found);
                                                        if(cpt2==point_of_interest_found.length){
                                                            res.render(pages_path + "/live/organizer_live.ejs", {
                                                                pageTitle: "Messagerie",
                                                                page: "live/organizer_live",
                                                                organizer: organizer_array,
                                                                helper: helper_array
                                                            });
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                                cpt2=cpt2+1;
                            });
                        }
                    });
                }
            });
        }
    });
};