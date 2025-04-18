'use strict';
const nodemailer = require("nodemailer");
const fs = require('fs');
const {MailtrapClient} = require("mailtrap");
let request = require('request').defaults({encoding: null});

class MailTemple {
    btnUrl = "https://rydlearning.com";
    btnText = "-";
    replyEmail = "ameh.friday@gmail.com"
    isBulk = false

    constructor(to) {
        this.to = to;
    }

    to(to) {
        this.to = to;
        return this;
    }

    bulkEmailObj(emailObj) {
        this.bulkEmail = emailObj;
        return this;
    }

    setIsBulk(allowIt) {
        this.isBulk = allowIt
        return this;
    }

    setAttachmentLink(linkUrl) {
        //check if url is valid

        this.attachmentLink = linkUrl
        return this;
    }

    who(name) {
        this.name = name;
        return this;
    }

    btnText(text) {
        this.btnText = text;
        return this;
    }

    btnUrl(url) {
        this.btnUrl = url;
        return this;
    }

    subject(sub) {
        this.subject = sub;
        return this;
    }

    body(body) {
        this.body = body;
        return this;
    }

    async send() {
        //return false
        //compute email sending template here...
        const rd = fs.readFileSync(__dirname + '/template/template.mt');
        const rawTmpl = rd.toString('utf-8');
        const compile = render(rawTmpl, {body: this.body, name: this.name, btnText: this.btnText, btnUrl: this.btnUrl});
        return await transporter(compile, this.to, this.subject, this.attachmentLink, this.isBulk, this.bulkEmail);
    }
}

// async..await is not allowed in global scope, must use a wrapper
async function transporter(html, to, sub, attachmentLink=null,isBulk=null, bulkEmail=null) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: process.env.D_EMAIL_HOST,
        port: 2525,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.D_EMAIL_USER, // generated ethereal user
            pass: process.env.D_EMAIL_PASS, // generated ethereal password
        },
        logger: false,
        tls: {
            ciphers: 'SSLv3'
        }
    });

    //pick .env mode
    const MODE =  true

    //api sender
    if (MODE) {
        const {MailtrapClient} = require("mailtrap");

        const TOKEN = MODE ? process.env.EMAIL_PASS : process.env.D_EMAIL_PASS;
        const ENDPOINT = MODE ? process.env.EMAIL_API : process.env.D_EMAIL_API;

        const client = new MailtrapClient({endpoint: ENDPOINT, token: TOKEN});

        const sender = {
            email: "learning@m.rydlearning.com",
            name: "RYD Learning",
        };
        const recipients = [
            {
                email: to,
                name: "RYD Learning Parent"
            }
        ];

        const bulkRecipients = bulkEmail

        const reply_to = {
                email: 'learning@rydlearning.com',
                name: 'RYD Learning'
        }

        //send bulk emails
        if (isBulk) {
            return client.send({
                from: sender,
                to: [bulkRecipients[0]],
                bcc: bulkRecipients.slice(1),
                subject: sub,
                html: html,
                category: "RYD Email",
                reply_to
            }).then(console.log, console.error);
        } else {
            //is attachment added ?
            if (attachmentLink) {
                const __fileExt = attachmentLink.split(".").pop();
                request.get(attachmentLink, function (error, response, body) {
                    if (!error && Number(response.statusCode) === 200) {
                        const data = Buffer.from(body).toString('base64');
                        //attachment here
                        return client.send({
                            from: sender,
                            to: recipients,
                            subject: sub,
                            html: html,
                            attachments: [{
                                content: data,
                                filename: "RYD Attachment." + __fileExt
                            }],
                            category: "RYD Email",
                            reply_to
                        }).then(console.log, console.error);
                    }
                });
            } else {
                //no attachment
                return client.send({
                    from: sender,
                    to: recipients,
                    subject: sub,
                    html: html,
                    category: "RYD Email",
                    reply_to
                }).then(console.log, console.error);
            }
        }
    } else {

        // send mail with defined transport object

        return transporter.sendMail({
            from: `${sub} <${process.env.D_EMAIL_USER}>`, // sender address
            to: to, // list of receivers
            subject: sub, // Subject line
            html: html, // html body
        });
        //console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    }
}

let render = (template, data) => {
    return template.replace(/{{(.*?)}}/g, (match) => {
        let mkd = match.split(/{{|}}/).filter(Boolean)[0];
        let a = data[mkd];
        if (a instanceof Array)
            return a.join('\n');
        return data[mkd];
    })
}
module.exports = MailTemple;
