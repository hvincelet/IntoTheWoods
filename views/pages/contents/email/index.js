process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let nodemailer = require('nodemailer');
let fs = require('fs');
require.extensions['.html'] = function(module, filename){
  module.exports = fs.readFileSync(filename, 'utf-8');
};

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'intothewoods.app@gmail.com',
    pass: 'jdburdrqdlqcocrh'
  }
});

let content = require("./content.html");

let mailOptions = {
  from: 'intothewoods.app@gmail.com',
  to: 'graballa@enssat.fr',
  subject: 'Sending Email using Node.js',
  html: content
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});