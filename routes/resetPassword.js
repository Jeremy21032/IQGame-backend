require("dotenv").config();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Función para generar un código de confirmación
function generateConfirmationCode(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}

const sendResetEmail = async (email, confirmationCode) => {
  const msg = {
    to: email, // El correo del destinatario proporcionado en la función
    from: "jeremy.leon.g@outlook.com", // El remitente verificado
    subject: "Código de Confirmación para Reseteo de Contraseña",
    text:
      `Haz recibido este email porque tú (o alguien más) ha solicitado el reseteo de la contraseña para tu cuenta.\n\n` +
      `Tu código de confirmación es: ${confirmationCode}\n\n` +
      `Por favor, ingresa este código en la página de reseteo de contraseña para completar el proceso dentro de los próximos 15 minutos.\n\n` +
      `Si no solicitaste esto, por favor ignora este email y tu contraseña permanecerá sin cambios.\n`,
    html:
      `<strong>Haz recibido este email porque tú (o alguien más) ha solicitado el reseteo de la contraseña para tu cuenta.</strong><br><br>` +
      `<strong>Tu código de confirmación es:</strong> <code>${confirmationCode}</code><br><br>` +
      `<strong>Por favor, ingresa este código en la página de reseteo de contraseña para completar el proceso dentro de los próximos 15 minutos.</strong><br><br>` +
      `<strong>Si no solicitaste esto, por favor ignora este email y tu contraseña permanecerá sin cambios.</strong>`,
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent");
    return confirmationCode; // Devuelve el código de confirmación para almacenarlo o verificarlo más tarde
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send confirmation email");
  }
};

module.exports = sendResetEmail;
