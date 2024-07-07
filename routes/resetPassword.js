require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:"smtp.gmail.com",
  port:465,
  secure:true,
  auth:{
    user:"jeremisma2001@gmail.com",
    pass:process.env.MAIL_PASS
  }
});

const sendResetEmail = async (email, token) => {
  const mailOptions = {
    from: "jeremisma2001@gmail.com",
    to: email,
    subject: 'Link de Reseteo de Contraseña',
    text: `Haz recibido este email porque tú (o alguien más) ha solicitado el reseteo de la contraseña para tu cuenta.\n\n` +
          `Por favor haz click en el siguiente link, o pégalo en tu navegador para completar el proceso dentro de los próximos 15 minutos:\n\n` +
          `http://localhost:3000/reset/${token}\n\n` +
          `Si no solicitaste esto, por favor ignora este email y tu contraseña permanecerá sin cambios   DDDD.\n`
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

module.exports = sendResetEmail;
