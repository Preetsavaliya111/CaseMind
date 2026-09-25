import smtplib
import logging
from email.message import EmailMessage

from app.core.config import settings


logger = logging.getLogger(__name__)


def email_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)


def send_email(recipient: str, subject: str, body: str) -> bool:
    if not email_configured():
        return False
    message = EmailMessage()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as client:
            if settings.SMTP_USE_TLS:
                client.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                client.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            client.send_message(message)
        return True
    except (OSError, smtplib.SMTPException):
        logger.exception("Unable to deliver transactional email to %s", recipient)
        return False
