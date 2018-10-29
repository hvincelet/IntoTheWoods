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
                picture: jdenticon.toPng(req.body.firstname.concat(req.body.lastname), 80).toString('base64')
            }).then(function () {
                sender.sendMail(req.body.email, hash, '/../views/pages/contents/email/content.ejs',"Confirmation d'inscription");
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

exports.manageTeam = function(req, res) {
  const user = connected_user(req.sessionID);
  res.render(pages_path + "template.ejs", {
      pageTitle: "Equipe et organisateurs",
      page: "manage_team/team",
      user: user
  });

}

exports.manageHelper = function(req, res) {

    const user = connected_user(req.sessionID);

    let data_helper = [];

    let assignment_model = models.assignment;
    let helper_model = models.helper;
    let helper_post_model = models.helper_post;

    helper_model.belongsTo(assignment_model, {foreignKey: 'login'});
    assignment_model.belongsTo(helper_post_model, {foreignKey: 'id_helper_post'});

    helper_model.findAll({
        include: [{
            model: assignment_model,
            attributes: ['id_helper','id_helper_post','attributed'],
            include: [{
                model: helper_post_model,
                attributes: ['id','description']
            }],
        }],
        attributes: ['login','email','last_name','first_name']
    }).then(function(assignment_found){
        if(assignment_found !== null){
            assignment_found.forEach(function(tuple){
                let create_user = 0;
                data_helper.forEach(function(object){
                    if(object['user'] == tuple.dataValues.login){
                        create_user = 1;
                    }
                });
                if(create_user == 0){
                    data_helper.push(
                        {
                            'user':tuple.dataValues.login,
                            'data':{
                                'email':tuple.dataValues.email,
                                'last_name':tuple.dataValues.last_name,
                                'first_name':tuple.dataValues.first_name,
                                'assignment':[]
                            }
                        }
                    );
                }
                data_helper.forEach(function(object){
                    if(object['user'] == tuple.dataValues.login){
                        object['data']['assignment'].push(
                            {
                                'id':tuple.dataValues.assignment.dataValues.helper_post.dataValues.id,
                                'description':tuple.dataValues.assignment.dataValues.helper_post.dataValues.description,
                                'attributed':tuple.dataValues.assignment.dataValues.attributed
                            }
                        );
                    }
                });
            });
            res.render(pages_path + "template.ejs", {
                pageTitle: "Gérer les bénévoles",
                page: "manage_team/helper",
                user: user,
                data: data_helper
            });
        }
    });

};

exports.assignHelper = function(req, res) {

    let data_helper = req.body.registerHelper.split(':');
    let id_helper = data_helper[0];
    let id_helper_post = data_helper[1];

    models.assignment.findOne({
        where: {
            id_helper: id_helper,
            id_helper_post: id_helper_post
        }
    }).then(function(assignment_found){
        if(assignment_found !== null){
            assignment_found.update({
                attributed: 1
            }).then(function(){
                // TODO delete tuple in assignment where id_helper = id_helper of req
                models.assignment.findAll({
                    where:{
                        id_helper: id_helper,
                        attributed: 0
                    }
                }).then(function(){
                    
                });

                res.redirect('/manageteam/helper');
            });
        }
    });
};
