process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const nodemailer = require('nodemailer');
const ejs = require('ejs-html');
const fs = require('fs');

exports.sendMail = function(email, first_name, last_name, password) {

    const userMail = ''; // user gmail
    const passMail = ''; // password gmail

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: userMail,
            pass: passMail
        }
    });

    let ejsTemplate = fs.readFileSync('./views/pages/contents/email/content.ejs','utf-8');

    let content = ejs.render(ejsTemplate, { // convert ejs to html
        registerEmail: email,
        registerUserFn: first_name,
        registerUserLn: last_name,
        registerPassword: password
    }, {
        vars: ['registerEmail','registerUserFn','registerUserLn','registerPassword']
    });

    let mailOptions = {
        from: userMail,
        to: email,
        subject: "[IntoTheWoods] - Confirmation d'inscription",
        html: content
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};
