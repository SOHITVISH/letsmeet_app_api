import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars"

const MailSendCustomer = (sendingmail) => {
    console.log(process.env.EMAIL_PASSWORD,"----",process.env.EMAIL_USERNAME);
    const transporter = nodemailer.createTransport({
       host:"email-smtp.us-east-1.amazonaws.com",
       port:465,
        secure:true,
    // service:"Gmail",
    // greetingTimeout:60000,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const handlebaroption = {
        viewEngine: {
            partialsDir: "./view/partials",
            layoutsDir: "./view/layouts",
        },
        viewPath: "view"
    };

    transporter.use("compile", hbs(handlebaroption));
    transporter.use('compile', hbs({
        viewEngine: 'express-handlebars',
        viewPath: "./view"
    }))

    transporter.sendMail(sendingmail, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });


}
export default MailSendCustomer
