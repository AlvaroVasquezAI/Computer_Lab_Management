import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.core.config import settings

def send_password_reset_email(recipient_email: str, new_password: str):
    """
    Sends an email to a user with their new temporary password.
    """
    if not all([settings.SMTP_SERVER, settings.EMAIL_ADDRESS, settings.EMAIL_PASSWORD]):
        print("EMAIL SERVICE ERROR: SMTP settings are not configured.")
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Password Has Been Reset"
    message["From"] = settings.EMAIL_ADDRESS
    message["To"] = recipient_email

    # Create the plain-text and HTML version of your message
    text = f"""
    Hi,
    Your password for the Computer Laboratory system has been reset.
    Your new temporary password is: {new_password}
    Please log in and change it as soon as possible.
    """
    html = f"""
    <html>
      <body>
        <h2>Password Reset</h2>
        <p>Hi,</p>
        <p>Your password for the Computer Laboratory system has been reset.</p>
        <p>Your new temporary password is: <strong>{new_password}</strong></p>
        <p>Please log in and change it as soon as possible.</p>
      </body>
    </html>
    """

    # Turn these into plain/html MIMEText objects
    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")

    # Add HTML/plain-text parts to MIMEMultipart message
    message.attach(part1)
    message.attach(part2)

    try:
        # Create secure connection with server and send email
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls() # Secure the connection
        server.login(settings.EMAIL_ADDRESS, settings.EMAIL_PASSWORD)
        server.sendmail(settings.EMAIL_ADDRESS, recipient_email, message.as_string())
        print(f"Password reset email sent successfully to {recipient_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")
    finally:
        server.quit()