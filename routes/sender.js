process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let nodemailer = require('nodemailer');
let ejs = require('ejs-html');
let fs = require('fs');
const config = require(__dirname + '/../config/config.js')['mail'];

exports.sendMail = function(email, password_hash, ejs_file, subject){

  let transporter = nodemailer.createTransport({
    service: config.service,
    auth: {
      user: config.login,
      pass: config.password
    }
  });

  let ejsTemplate = fs.readFileSync(__dirname + ejs_file,'utf-8');
  let content = ejs.render(ejsTemplate,
    {email: email, password: password_hash},
    {vars: ["email", "password"]});

  let mailOptions = {
    from: "Into the Woods",
    to: email,
    subject: subject,
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
