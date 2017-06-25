'use strict';

const router = require('express').Router();

// Setup Email
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASS
  }
});


/**
 * Backup the sessions json object via email attachment.
 */
router.get('/backup/:secret', (req, res) => {
  if (req.params.secret === process.env.CRON_SECRET) {
    // const mailOptions = {
    //   attachments: [{
    //     filename: (new Date()).toDateString().split(' ').join('_') + '.json',
    //     content: JSON.stringify(Bot.sessions),
    //     contentType: 'application/json'
    //   }],

    //   from: process.env.EMAIL_ID,
    //   to: process.env.EMAIL_ID,
    //   subject: 'BACKUP', // Subject line
    //   text: (new Date()).toLocaleString() + '\nChatbot backup of ' + Object.keys(Bot.sessions).length + ' users.\n\n' + JSON.stringify(Bot.sessions)
    // };

    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.log(error);
    //     console.log(error.message);
    //     res.json({response: error, message: error.message});
    //   } else {
    //     console.log('Message sent: ' + info.response);
    //     res.json({response: info.response});
    //   }
    // });
  }
  res.json({response: 'Not created'});
});

module.exports = router;
