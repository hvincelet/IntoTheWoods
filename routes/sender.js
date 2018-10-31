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
        description: data.description,
        name: data.name,
        date: data.date,
        edition: data.edition,
        place: data.place
    },{
        vars: ["id_helper","id_helper_post","description","name","date","edition","place"]
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
