import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.core.config import settings
from datetime import date

def send_password_reset_email(recipient_email: str, new_password: str, lang: str = 'en'):
    """
    Sends a branded, bilingual, text-and-icon-based HTML email to a user.
    """
    if not all([settings.SMTP_SERVER, settings.EMAIL_ADDRESS, settings.EMAIL_PASSWORD]):
        print("EMAIL SERVICE ERROR: SMTP settings are not configured. Cannot send email.")
        return

    templates = {
        'en': {
            'subject': "🔑 Ctrl+LAB - Password Reset",
            'header': "Password Reset",
            'greeting': "Hello,",
            'body_1': "Your password for the <strong>Ctrl+LAB</strong> computer laboratory system has been reset as requested.",
            'body_2': "Your new temporary password is:",
            'body_3': "Please log in with this password and consider changing it to something memorable as soon as possible for your security.",
            'body_4': "If you did not request this change, please contact an administrator.",
            'footer': "Ctrl+LAB - UPIIT-IPN"
        },
        'es': {
            'subject': "🔑 Ctrl+LAB - Restablecimiento de Contraseña",
            'header': "Restablecimiento de Contraseña",
            'greeting': "Hola,",
            'body_1': "Tu contraseña para el sistema de laboratorio de cómputo <strong>Ctrl+LAB</strong> ha sido restablecida como solicitaste.",
            'body_2': "Tu nueva contraseña temporal es:",
            'body_3': "Por favor, inicia sesión con esta contraseña y considera cambiarla a algo memorable tan pronto como sea posible por tu seguridad.",
            'body_4': "Si no solicitaste este cambio, por favor, contacta a un administrador.",
            'footer': "Ctrl+LAB - UPIIT-IPN"
        }
    }

    t = templates.get(lang, templates['en'])

    message = MIMEMultipart("alternative")
    message["Subject"] = t['subject']
    message["From"] = f"Ctrl+LAB System <{settings.EMAIL_ADDRESS}>"
    message["To"] = recipient_email

    text = f"""
    {t['greeting']}

    {t['body_1'].replace('<strong>', '').replace('</strong>', '')}
    {t['body_2']} {new_password}
    {t['body_3']}
    {t['body_4']}

    - {t['footer']}
    """

    html = f"""
    <!DOCTYPE html>
    <html lang="{lang}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f7; }}
            .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); border-top: 5px solid #831843; }}
            .content {{ padding: 30px; color: #333333; line-height: 1.6; }}
            .content h2 {{ color: #111827; margin-top: 0; font-size: 1.8em; }}
            .password-box {{ background-color: #f3f4f6; border-radius: 4px; padding: 15px; text-align: center; margin: 20px 0; }}
            .password-text {{ font-size: 1.3em; font-weight: bold; color: #831843; letter-spacing: 2px; font-family: 'Courier New', Courier, monospace; }}
            .footer {{ text-align: center; padding: 20px; font-size: 0.8em; color: #9ca3af; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                <h2>✔️ {t['header']}</h2>
                <p>{t['greeting']}</p>
                <p>{t['body_1']}</p>
                <p>{t['body_2']}</p>
                <div class="password-box">
                    <span class="password-text">{new_password}</span>
                </div>
                <p>{t['body_3']}</p>
                <p>⚠️ {t['body_4']}</p>
            </div>
            <div class="footer">
                &copy; {date.today().year} {t['footer']}
            </div>
        </div>
    </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")

    message.attach(part1)
    message.attach(part2)

    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.EMAIL_ADDRESS, settings.EMAIL_PASSWORD)
        server.sendmail(settings.EMAIL_ADDRESS, recipient_email, message.as_string())
        print(f"Password reset email sent successfully to {recipient_email} in language: {lang}")
    except Exception as e:
        print(f"Failed to send email: {e}")
    finally:
        if 'server' in locals() and server:
            server.quit()