const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');
const crypto = require('crypto');
const sender = require('./sender');
const Sequelize = require('sequelize');

exports.displayHome = function (req, res) {
    console.log(user.picture);
    res.render(pages_path + "template.ejs", {
        pageTitle: "Accueil",
        page: "accueil",
        userName_fn: user.first_name,
        userName_ln: user.last_name,
        userName_initials: user.initials,
        userPicture: user.picture
    });
};

exports.displayLogScreen = function (req, res) {
    user.authenticated = false;
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
            user.authenticated = true;
            user.login = organizer_found.dataValues.email;
            user.first_name = organizer_found.dataValues.first_name;
            user.last_name = organizer_found.dataValues.last_name;
            user.initials = user.first_name.charAt(0).concat(user.last_name.charAt(0)).toUpperCase();
            user.picture = organizer_found.dataValues.picture;

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
                attributes: ['id', 'name', 'edition'],
            }).then(function(raids_found){
                if(raids_found){
                    raids_found.forEach(function(tuple){
                        user.raid_list.push({
                            id: tuple.dataValues.id,
                            name: tuple.dataValues.name,
                            edition: tuple.dataValues.edition
                        });
                    });
                }
            });
            return res.redirect('/');
        } else {
            res.render(pages_path + "login.ejs", {
                pageTitle: "Connexion",
                errorMessage: "Identifiants incorrects ou confirmation par mail requise."
            });
        }
    });
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
            console.log(jdenticon.toPng(req.body.firstname.concat(req.body.lastname), 80).toString('base64'));
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
}

exports.manageTeam = function(req, res) {

  res.render(pages_path + "template.ejs", {
      pageTitle: "Equipe et organisateurs",
      page: "manage_team/team",
      userName_fn: user.first_name,
      userName_ln: user.last_name,
      userName_initials: user.initials,
      userPicture: user.picture
  });

}

exports.manageHelper = function(req, res) {

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
                data_helper.push(
                    {
                        'login':tuple.dataValues.login,
                        'email':tuple.dataValues.email,
                        'last_name':tuple.dataValues.last_name,
                        'first_name':tuple.dataValues.first_name,
                        'id_helper':tuple.dataValues.assignment.dataValues.id_helper,
                        'id_helper_post':tuple.dataValues.assignment.dataValues.id_helper_post,
                        'attributed':tuple.dataValues.assignment.dataValues.attributed,
                        'id':tuple.dataValues.assignment.dataValues.helper_post.dataValues.id,
                        'description':tuple.dataValues.assignment.dataValues.helper_post.dataValues.description
                    }
                );
            });
            res.render(pages_path + "template.ejs", {
                pageTitle: "Gérer les bénévoles",
                page: "manage_team/helper",
                userName_fn: user.first_name,
                userName_ln: user.last_name,
                userName_initials: user.initials,
                userPicture: user.picture,
                data: data_helper
            });
        }
    });

};

exports.assignHelper = function(req, res) {

    let id_helper = req.body.registerIdHelper;
    let id_helper_post = req.body.registerIdHelperPost;

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
                res.redirect('/manageteam/helper');
            });
        }
    });
};
