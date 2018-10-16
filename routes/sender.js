process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let nodemailer = require('nodemailer');
let ejs = require('ejs-html');
let fs = require('fs');
//const config = require(__dirname + '/../config/config.js')['mail'];

exports.sendMail = function(email, password){

  require.extensions['.html'] = function(module, filename){
    module.exports = fs.readFileSync(filename, 'utf-8');
  };

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "intothewoods.app@gmail.com",
      pass: "jdburdrqdlqcocrh"
    }
  });

  let ejsTemplate = fs.readFileSync(__dirname + '/../views/pages/contents/email/content.ejs','utf-8');
  let content = ejs.render(ejsTemplate, 
    {email: email, password: password},
    {vars: ["email", "password"]});
  
  let mailOptions = {
    from: "intothewoods.app@gmail.com",
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
}