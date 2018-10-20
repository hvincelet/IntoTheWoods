const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');
const crypto = require('crypto');
const sender = require('./sender');
const Sequelize = require('sequelize');

exports.displayHome = function (req, res) {
    const user = connected_user(req.sessionID);
    if(!user){
        res.redirect('/login');
    }else{
        res.render(pages_path + "template.ejs", {
            pageTitle: "Accueil",
            page: "accueil",
            userName_fn: user.first_name,
            userName_ln: user.last_name,
            userName_initials: user.initials,
            userPicture: user.picture
        });
    }
};

exports.displayLogScreen = function (req, res) {
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
                initials: "",
                picture: organizer_found.dataValues.picture,
                raid_list: [],
                idCurrentRaid: 0
            }
            user.initials = user.first_name.charAt(0).concat(user.last_name.charAt(0)).toUpperCase();

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
                connected_users.push(user);
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

exports.logout = function (req, res) {
    let connected_user_index;
    const user = connected_users.find(function(user, index){
        connected_user_index = index;
        return user.uuid == req.sessionID;
    });
    if(user){
        connected_users.splice(connected_user_index, 1);
    }
    res.redirect('/');
}

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
                //picture: jdenticon.toPng(req.body.firstname.concat(req.body.lastname), 80).toString('base64')
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