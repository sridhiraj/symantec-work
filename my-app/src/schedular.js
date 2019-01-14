

'use strict';
const nodemailer = require('nodemailer');
var schedule = require('node-schedule');
var stompit = require('stompit');

console.log('### SCHEDULER TO SEND LOOKUP IN ACTIVE-MQ AND SEND EMAIL :: EVERY 1 MIN ###');

var j = schedule.scheduleJob('*/1 * * * *', function(){
  
    var connectParams = {
        host: 'localhost',
        port: 61613,
        connectHeaders:{
            host: 'localhost',
            login: 'admin',
            passcode: 'password'
        }
    };

    stompit.connect(connectParams, function(error, client){
        
        console.log('### CONNECTED WITH ACTIVE MQ ##');

        if(error){
            console.log('Unable to connect: ' + error.message);
            return;
        }

        var subscribeParams = {
           'destination': '/queue/test',
           'ack': 'client-individual'
        };

        var consuming = false;

        client.subscribe(subscribeParams, function(error, message){

            // Don't consume more than one message
            if(consuming){
                return;
            }

            consuming = true;

            var read = function(){
                var chunk;
                while(null !== (chunk = message.read())){
                    process.stdout.write(chunk);
                }
            };

            message.on('readable', read);

            message.on('end', function(){
                client.ack(message);
                client.disconnect();
            });
            
            
            //Connect to SMTP
            
            // Generate test SMTP service account from ethereal.email
            // Only needed if you don't have a real mail account for testing
            nodemailer.createTestAccount((err, account) => {
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                    host: 'localhost',
                    port: 25,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: account.user, // generated ethereal user
                        pass: account.pass // generated ethereal password
                    }
                });
                
                console.log('### Sending email ##');

                // setup email data with unicode symbols
                let mailOptions = {
                    from: '"Fred Foo 👻" <foo@example.com>', // sender address
                    to: 'bar@example.com, baz@example.com', // list of receivers
                    subject: 'Hello ✔', // Subject line
                    text: 'Hello world?', // plain text body
                    html: '<b>Hello world?</b>' // html body
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    // Preview only available when sending through an Ethereal account
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

                    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
                });
            });
          
        });
    });    
    
});



