const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');
const crypto = require('crypto');
const sender = require('./sender');
const Sequelize = require('sequelize');

exports.displayHome = function (req, res) {
    models.raid.findAll({
        attributes: ['id', 'name', 'date', 'edition', 'place']
    }).then(function (raids_found) {
        let raids = [];
        raids_found.forEach(function (raid) {
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
    if (user) {
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
                raid_list: [],
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
                attributes: ['id', 'name', 'edition', 'date', 'place', 'lat', 'lng']
            }).then(function(raids_found){
                if(raids_found){
                    raids_found.forEach(function(tuple){
                        user.raid_list.push({
                            id: tuple.dataValues.id,
                            name: tuple.dataValues.name,
                            edition: tuple.dataValues.edition,
                            date: tuple.dataValues.date,
                            place: tuple.dataValues.place,
                            lat: tuple.dataValues.lat,
                            lng: tuple.dataValues.lng
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
            organizer_found.updateAttributes({
                active: '1'
            });
        }
        res.render(pages_path + "login.ejs", {
            pageTitle: "Connexion",
            successMessage: "Votre adresse mail a bien été confirmée."
        });
    })
}

exports.shareRaidToOthersOrganizers = function(req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id == req.params.raid_id})){
        return res.redirect('/dashboard');
    }

    if(req.body.mail != user.login){
        models.organizer.findOne({
            where: {email: req.body.mail}
        }).then(function(organizer){
            if(organizer){
                models.team.findOne({
                    where: {
                        id_raid: req.params.raid_id,
                        id_organizer: req.body.mail
                    }
                }).then(function(organizer_in_team){
                    if(!organizer_in_team){
                        models.team.create({
                            id_raid: req.params.raid_id,
                            id_organizer: req.body.mail
                        }).then(function(orga_inserted_in_team){
                            // sender.sendMailToNoticeNewOrganizer(req.body.mail, );
                        });
                    }else{
                        // Organizer already in team
                    }
                })
            }else{
                // sender.sendMailToInviteNewOrganizerToRegister(req.body.mail, );
            }
        });
    }
};


exports.assignHelper = function(req, res) {

    req.body.assignments_array.forEach(function(assignment){
        models.assignment.findOne({
            where: {
                id_helper: assignment.id_helper,
                id_helper_post: assignment.id_helper_post
            }
        }).then(function(assignment_found){
            if(assignment_found !== null){
                // Step 1 : update attributed value in assignment for pair (id_helper,id_helper_post)
                assignment_found.update({
                    attributed: 1
                }).then(function(){
                    // Step 2 : delete tuple in assignment where id_helper = id_helper of req
                    models.assignment.destroy({
                        where:{
                            id_helper: assignment.id_helper,
                            attributed: 0
                        }
                    }).then(function(){
                        // Step 3 : find helper in helper table with id_helper
                        models.helper.findOne({
                            where: {
                                login: assignment.id_helper
                            },
                            attributes: ['email']
                        }).then(function(helper_found){
                            if(helper_found !== null){
                                // Step 4 : get email of helper in helper_found
                                let local_email = helper_found.dataValues.email;
                                // Step 5 : get id_point_of_interest from helper_post
                                models.helper_post.findOne({
                                    where:{
                                        id:assignment.id_helper_post
                                    },
                                    attributes:['id_point_of_interest','description']
                                }).then(function(helper_post_found){
                                    if(helper_post_found !== null){
                                        let description = helper_post_found.dataValues.description;
                                        // Step 6 : get id_raid from point_of_interest
                                        models.point_of_interest.findOne({
                                            where:{
                                                id: helper_post_found.dataValues.id_point_of_interest
                                            },
                                            attributes:['id_raid']
                                        }).then(function(point_of_interest_found){
                                            if(point_of_interest_found !== null){
                                                // Step 7 : get informations from raid
                                                models.raid.findOne({
                                                      where:{
                                                          id:point_of_interest_found.dataValues.id_raid
                                                      },
                                                      attributes:['name','date','edition','place']
                                                }).then(function(raid_found){
                                                    if(raid_found !== null){
                                                        // Step 8 : get informations from raid
                                                        let local_name = raid_found.dataValues.name;
                                                        let local_date = raid_found.dataValues.date;
                                                        let local_edition = raid_found.dataValues.edition;
                                                        let local_place = raid_found.dataValues.place;
                                                        // Step 9 : send mail to helper
                                                        sender.sendMailToHelper(assignment.id_helper,assignment.id_helper_post,description,local_email,local_name,local_date,local_edition,local_place);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                });
            }
        });

    });
};