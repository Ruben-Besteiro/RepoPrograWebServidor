// Este archivo es un SERVICIO y no lo hemos dado en clase
// Contiene el código que se ejecutará cuando haya que mandar un correo
// El que decide cuándo ocurrirá eso es el escuchador y también el controlador
import nodemailer from 'nodemailer';

// Esto es un usuario de prueba que crea Ethereal Email para mandar correos
// Luego en el codigo real deberemos usar GMAIL, etc.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Esta es la función que manda el correo
export const sendVerificationEmail = async (email: string, code: string) => {
    console.log(`[MAIL] sendVerificationEmail called for: ${email}`);
    console.log(`[MAIL] SMTP config - Host: ${process.env.SMTP_HOST || '(not set, using smtp.ethereal.email)'}, Port: ${process.env.SMTP_PORT || '(not set, using 587)'}, User: ${process.env.SMTP_USER || '(not set)'}`);

    try {
        const info = await transporter.sendMail({
            from: '"Sistema de Verificación" <no-reply@miapi.com>',
            to: email,
            subject: "Código de verificación ✔",
            text: `Tu código de verificación es: ${code}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333;">Verificación de cuenta</h2>
                    <p>Gracias por registrarte. Para completar tu registro, utiliza el siguiente código:</p>
                    <div style="font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 10px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        ${code}
                    </div>
                    <p>Si no has solicitado este código, puedes ignorar este correo.</p>
                </div>
            `,
        });

        console.log("✉️ Email enviado: %s", info.messageId);

        // Si usamos ethereal.email, nos da una URL para ver el correo
        // La comprobación correcta es sobre el host configurado, no sobre info.envelope.from
        if (process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST) {
            console.log("🔗 Ver email en: %s", nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error("❌ Error enviando email:", error instanceof Error ? error.stack : error);
    }
};
