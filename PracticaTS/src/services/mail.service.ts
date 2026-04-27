// Este archivo es un SERVICIO y no lo hemos dado en clase
// Contiene el código que se ejecutará cuando haya que mandar un correo
// El que decide cuándo ocurrirá eso es el escuchador y también el controlador
import nodemailer from 'nodemailer';

// Timeout en ms para la llamada a sendMail — evita que se quede colgada indefinidamente
const SEND_MAIL_TIMEOUT_MS = 30_000;

// Esto es un usuario de prueba que crea Ethereal Email para mandar correos
// Luego en el codigo real deberemos usar GMAIL, etc.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,          // true sólo para puerto 465; 587 usa STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: SEND_MAIL_TIMEOUT_MS,
    greetingTimeout: SEND_MAIL_TIMEOUT_MS,
    socketTimeout: SEND_MAIL_TIMEOUT_MS,
});

// Envuelve sendMail en una Promise.race con un timeout explícito para que
// nunca se quede colgada más de SEND_MAIL_TIMEOUT_MS milisegundos.
const sendMailWithTimeout = (options: nodemailer.SendMailOptions): Promise<nodemailer.SentMessageInfo> => {
    const sendPromise = transporter.sendMail(options);

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
            () => reject(new Error(`sendMail timeout after ${SEND_MAIL_TIMEOUT_MS}ms — el servidor SMTP no respondió`)),
            SEND_MAIL_TIMEOUT_MS
        )
    );

    return Promise.race([sendPromise, timeoutPromise]);
};

// Esta es la función que manda el correo
export const sendVerificationEmail = async (email: string, code: string) => {
    console.log(`[MAIL] sendVerificationEmail called for: ${email}`);
    console.log(
        `[MAIL] SMTP config — Host: ${process.env.SMTP_HOST}, ` +
        `Port: ${process.env.SMTP_PORT}, ` +
        `User: ${process.env.SMTP_USER}, ` +
        `Pass set: ${process.env.SMTP_PASS ? 'YES (' + process.env.SMTP_PASS + ')' : 'NO'}`
    );

    try {
        console.log(`[MAIL] Calling transporter.sendMail() for ${email}...`);

        const info = await sendMailWithTimeout({
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

        console.log(`[MAIL] transporter.sendMail() completed for ${email}`);
        console.log("✉️ Email enviado: %s", info.messageId);

        // Si usamos ethereal.email, nos da una URL para ver el correo
        // La comprobación correcta es sobre el host configurado, no sobre info.envelope.from
        if (process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST) {
            console.log("🔗 Ver email en: %s", nodemailer.getTestMessageUrl(info));
        }
    } catch (error: any) {
        const errCode: string = error?.code ?? '';
        const responseCode: number | undefined = error?.responseCode;

        if (errCode === 'ECONNREFUSED') {
            console.error(
                `❌ [MAIL] ECONNREFUSED — No se pudo conectar a ` +
                `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}. Verifica host y puerto.`
            );
        }
        if (errCode === 'ENOTFOUND') {
            console.error(
                `❌ [MAIL] ENOTFOUND — No se resolvió el host "${process.env.SMTP_HOST}". ` +
                `Verifica la variable SMTP_HOST y la conectividad DNS.`
            );
        }
        if (responseCode === 535 || errCode === 'EAUTH') {
            console.error(
                `❌ [MAIL] AUTENTICACIÓN FALLIDA (535/EAUTH) — Credenciales rechazadas.` +
                `Verifica que los datos sean correctos.`
            );
        }
        if (responseCode !== undefined && responseCode >= 500) {
            console.error(
                `❌ [MAIL] Error SMTP ${responseCode} — Respuesta del servidor: ` +
                `${error?.response ?? '(sin respuesta)'}`
            );
        }
        if (error?.message?.includes('timeout')) {
            console.error(
                `❌ [MAIL] TIMEOUT — sendMail no completó en ${SEND_MAIL_TIMEOUT_MS}ms.` +
                `Posibles causas: firewall bloqueando puerto ${process.env.SMTP_PORT}, SMTP_HOST incorrecto, o el servidor no responde.`
            );
        }
        else {
            console.error("❌ [MAIL] Error enviando email:", error instanceof Error ? error.stack : error);
        }
    }
};
