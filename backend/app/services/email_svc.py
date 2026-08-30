import os
import tempfile
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from app.config import settings

def send_certificate_email(
    email: str,
    user_name: str,
    subject: str,
    score: float,
    correct_answers: int,
    total_questions: int,
    verification_id: str
) -> bool:
    """
    Generates a premium HTML certificate of completion and emails it to the user.
    If SMTP settings are not configured, it writes the HTML content to a local scratch file
    for manual review and testing.
    """
    current_date = datetime.utcnow().strftime("%B %d, %Y")
    
    # Elegant HTML design for the certificate
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificate of Achievement</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
          <!-- Top Accent Bar -->
          <tr>
            <td height="8" style="background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%);"></td>
          </tr>
          
          <!-- Content Padding -->
          <tr>
            <td style="padding: 50px 40px; text-align: center;">
              
              <!-- Logo / Brand -->
              <div style="font-weight: 800; font-size: 20px; color: #1f2937; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 30px;">
                PathCompanion <span style="color: #4f46e5;">AI</span>
              </div>
              
              <!-- Title -->
              <h1 style="font-family: Georgia, serif; font-size: 32px; color: #111827; font-weight: normal; margin: 0 0 10px 0; letter-spacing: 0.02em;">
                Certificate of Achievement
              </h1>
              
              <div style="width: 80px; height: 2px; background-color: #e5e7eb; margin: 20px auto 30px auto;"></div>
              
              <p style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 15px 0;">
                This is proudly presented to
              </p>
              
              <!-- User Name -->
              <h2 style="font-family: Georgia, serif; font-size: 28px; color: #4f46e5; font-weight: bold; margin: 0 0 25px 0;">
                {user_name}
              </h2>
              
              <!-- Description -->
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 25px 0;">
                for successfully completing the skill assessment for the target role:
                <br>
                <strong style="color: #111827; font-size: 18px; display: inline-block; margin-top: 8px;">{subject}</strong>
              </p>
              
              <!-- Score Badge -->
              <table align="center" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
                <tr>
                  <td align="center" style="background-color: #f3e8ff; border: 1px solid #c084fc; border-radius: 30px; padding: 8px 24px;">
                    <span style="font-size: 20px; font-weight: bold; color: #7c3aed;">
                      Score: {score}%
                    </span>
                  </td>
                </tr>
              </table>
              
              <div style="font-size: 13px; color: #9ca3af; margin-bottom: 30px;">
                Correct Answers: {correct_answers} / {total_questions}
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; margin-top: 10px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left" style="font-size: 12px; color: #9ca3af;">
                      Date: {current_date}
                    </td>
                    <td align="right" style="font-size: 12px; color: #9ca3af; font-weight: bold;">
                      Verification ID: {verification_id}
                    </td>
                  </tr>
                </table>
              </div>
              
            </td>
          </tr>
          
          <!-- Bottom Border Accent -->
          <tr>
            <td height="4" style="background-color: #f3f4f6;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    if not settings.smtp_host:
        # SMTP not configured: save a local preview for debugging, then fail loudly
        # so the frontend does NOT show a false "Sent" success.
        file_path = _save_preview(html_content)
        print(f"[Email Service] SMTP_HOST not configured. Preview saved to: {file_path}")
        raise RuntimeError(
            "Email not sent: SMTP is not configured. "
            "Set SMTP_HOST, SMTP_USERNAME and SMTP_PASSWORD in the .env file."
        )

    # Real SMTP Sending logic
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your PathCompanion AI Certificate: {subject}"
        msg["From"] = settings.smtp_sender
        msg["To"] = email
        
        part_html = MIMEText(html_content, "html")
        msg.attach(part_html)
        
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
        server.ehlo()
        if settings.smtp_port == 587:
            server.starttls()
            server.ehlo()
        
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
            
        server.sendmail(settings.smtp_sender, [email], msg.as_string())
        server.quit()
        print(f"[Email Service] Certificate email sent successfully to {email}")
        return True
    except Exception as e:
        print(f"[Email Service] Failed to send email via SMTP: {str(e)}")
        # If real sending fails, save a local preview so the certificate is not lost
        try:
            _save_preview(html_content)
        except Exception:
            pass
        raise e


def _save_preview(html_content: str) -> str:
    """Write the certificate HTML to a temp file for debugging and return its path."""
    scratch_dir = os.path.join(tempfile.gettempdir(), "pathcompanion_emails")
    os.makedirs(scratch_dir, exist_ok=True)
    file_path = os.path.join(scratch_dir, "last_certificate.html")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    return file_path
