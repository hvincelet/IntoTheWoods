process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let nodemailer = require('nodemailer');
let ejs = require('ejs-html');
let fs = require('fs');
const config = require(__dirname + '/../config/config.js')['mail'];

exports.sendMailToOrganizer = function(email, password_hash){

    let transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
          user: config.login,
          pass: config.password
        }
    });

    let ejsTemplate = fs.readFileSync(__dirname + '/../views/pages/contents/email/content.ejs','utf-8');
    let content = ejs.render(ejsTemplate, {
            email: email,
            password: password_hash
        },{
            vars: ["email", "password"]
    });

    let mailOptions = {
        from: "Into the Woods",
        to: email,
        subject: "Confirmation d'inscription",
        html: content
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Email sent: ' + info.response);
        }
    });
};

exports.sendResetPasswordMail = function(email, reset_password_session_id){
    let transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
            user: config.login,
            pass: config.password
        }
    });

    let ejsTemplate = fs.readFileSync(__dirname + '/../views/pages/contents/email/reset_password.ejs','utf-8');
    let content = ejs.render(ejsTemplate, {
        email: email,
        reset_password_session_id: reset_password_session_id
    },{
        vars: ["email", "reset_password_session_id"]
    });

    let mailOptions = {
        from: "Into the Woods",
        to: email,
        subject: "Création d'un nouveau mot de passe",
        html: content
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Email sent: ' + info.response);
        }
    });
};

exports.sendMailToHelper = function(data){

    let transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
          user: config.login,
          pass: config.password
        }
    });

    let email = data.email;
    let ejsTemplate = fs.readFileSync(__dirname + '/../views/pages/contents/email/mailing_helper.ejs','utf-8');
    let content = ejs.render(ejsTemplate, {
        id_helper: data.id_helper,
        id_helper_post: data.id_helper_post,
        title: data.title,
        description: data.description,
        name: data.name,
        date: data.date,
        edition: data.edition,
        place: data.place
    },{
        vars: ["id_helper","id_helper_post","title","description","name","date","edition","place"]
    });

    let mailOptions = {
        from: "Into the Woods",
        to: email,
        subject: "Validation de votre bénévolat",
        html: content
    };

    transporter.sendMail(mailOptions, function(error, info){
      if(error){
          console.log(error);
      }else{
          console.log('Email sent: ' + info.response);
      }
    });
};

exports.inviteOrganizer = function (data) {
    let transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
            user: config.login,
            pass: config.password
        }
    });

    let email = data.email;
    let mailOptions = {
        from: "Into the Woods",
        to: email,
        subject: "[Into The Woods] Invitation organisation " + data.raid.name,
        html: ""
    };

    let ejsTemplate = fs.readFileSync(__dirname + '/../views/pages/contents/email/inviteOrganizer.ejs','utf-8');
    let content = ejs.render(ejsTemplate, {
        organizer: data.organizer,
        name: data.raid.name,
        edition: data.raid.edition
    },{
        vars: ["organizer","name","edition"]
    });

    mailOptions['html'] = content;
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Email sent: ' + info.response);
        }
    });
};

exports.inviteHelper = function (data) {
    let transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
            user: config.login,
            pass: config.password
        }
    });

    let email = data.email;
    let mailOptions = {
        from: "Into the Woods",
        to: email,
        subject: "[Into The Woods] Invitation bénévolat " + data.raid.name,
        html: ""
    };

    let ejsTemplate = fs.readFileSync(__dirname + '/../views/pages/contents/email/inviteHelper.ejs','utf-8');
    let content = ejs.render(ejsTemplate, {
        id: data.raid.id,
        name: data.raid.name,
        edition: data.raid.edition
    },{
        vars: ["id","name","edition"]
    });

    mailOptions['html'] = content;
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Email sent: ' + info.response);
        }
    });
};

exports.sendMail = function (data) {
    let transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
            user: config.login,
            pass: config.password
        }
    });

    let email = data.email;
    let mailOptions = {
        from: "Into the Woods",
        to: email,
        subject: "[Into The Woods] Vous avez reçu un message de " + data.organizer + " à propos du raid " + data.raid_name,
        html: ""
    };

    let ejsTemplate = fs.readFileSync(__dirname + '/../views/pages/contents/email/sendMessage.ejs','utf-8');
    let content = ejs.render(ejsTemplate, {
        organizer: data.organizer,
        message: data.message,
        subject: data.subject
    },{
        vars: ["organizer", "message", "subject"]
    });

    mailOptions['html'] = content;
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
            return "nok";
        }else{
            console.log('Email sent: ' + info.response);
            return "ok";
        }
    });
};

exports.sendNewBackupDueToPoiDeletionMail = function(email, raid_name, raid_edition, helper_post_name){
    let transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
            user: config.login,
            pass: config.password
        }
    });

    let mailOptions = {
        from: "Into the Woods",
        to: email,
        subject: "Vous devenez un bénévole de renfort",
        html: ""
    };

    let ejsTemplate = fs.readFileSync(__dirname + '/../views/pages/contents/email/switchToBackup.ejs','utf-8');
    let content = ejs.render(ejsTemplate, {
        raid_name: raid_name,
        raid_edition: raid_edition,
        helper_post_name: helper_post_name
    },{
        vars: ["raid_name", "raid_edition", "helper_post_name"]
    });

    mailOptions['html'] = content;
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
            return "nok";
        }else{
            console.log('Email sent: ' + info.response);
            return "ok";
        }
    });
};