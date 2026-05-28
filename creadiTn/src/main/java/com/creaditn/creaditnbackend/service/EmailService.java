package com.creaditn.creaditnbackend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@creaditn.tn}")
    private String from;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    public boolean send(String to, String subject, String htmlBody) {
        if (to == null || to.isBlank()) {
            return false;
        }
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            log.warn("Email not sent to {} because SMTP credentials are not configured", to);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFromAddress());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
            return true;
        } catch (Exception ex) {
            log.warn("Could not send email to {}: {}", to, ex.getMessage());
            return false;
        }
    }

    private String resolveFromAddress() {
        if (from != null && !from.isBlank()) {
            return from.trim();
        }
        return username.trim();
    }

    public void sendWelcome(String to, String firstName) {
        String body = html(
                "Bienvenue, " + escape(displayName(firstName)) + " !",
                "Votre compte <strong>CreadiTN</strong> a ete cree avec succes.",
                "Vous pouvez maintenant demander du credit, suivre vos echeances et gerer vos paiements facilement.",
                null,
                null
        );
        send(to, "Bienvenue sur CreadiTN", body);
    }

    public void sendOtp(String to, String firstName, String code) {
        String body = html(
                "Reinitialisation du mot de passe",
                "Bonjour <strong>" + escape(displayName(firstName)) + "</strong>,",
                "Utilisez le code ci-dessous pour reinitialiser votre mot de passe. Ce code est valide pendant <strong>10 minutes</strong>.",
                code,
                "Si vous n'etes pas a l'origine de cette demande, ignorez cet email."
        );
        send(to, "Votre code de verification CreadiTN", body);
    }

    public boolean sendPasswordResetLink(String to, String firstName, String resetLink, String token, long validMinutes) {
        String body = html(
                "Reset Your Password",
                "Bonjour <strong>" + escape(displayName(firstName)) + "</strong>,",
                "Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe. Ce lien est valide pendant <strong>" + validMinutes + " minutes</strong>.",
                escapeLink(resetLink),
                "Si vous utilisez l'application mobile, copiez ce jeton de reinitialisation: <strong>" + escape(token) + "</strong>. Si vous n'etes pas a l'origine de cette demande, ignorez cet email."
        );
        return send(to, "Reset Your Password", body);
    }

    public void sendPasswordChanged(String to, String firstName) {
        String body = html(
                "Mot de passe mis a jour",
                "Bonjour <strong>" + escape(displayName(firstName)) + "</strong>,",
                "Votre mot de passe CreadiTN a ete modifie avec succes.",
                null,
                "Si vous n'avez pas effectue cette modification, contactez notre support immediatement."
        );
        send(to, "Mot de passe modifie - CreadiTN", body);
    }

    public void sendEmailVerificationOtp(String to, String firstName, String otp) {
        String body = html(
                "Verification de votre email",
                "Bonjour <strong>" + escape(displayName(firstName)) + "</strong>,",
                "Entrez le code ci-dessous pour activer votre compte. Il est valide pendant 5 minutes.",
                otp,
                "Si vous n'avez pas cree de compte CreadiTN, ignorez cet email."
        );
        send(to, "Verifiez votre adresse email - CreadiTN", body);
    }

    public void sendPaymentConfirmation(String to, String firstName, String ref, String amount) {
        String body = html(
                "Paiement confirme",
                "Bonjour <strong>" + escape(displayName(firstName)) + "</strong>,",
                "Votre paiement de <strong>" + escape(amount) + " DT</strong> a ete traite avec succes.",
                ref,
                "Reference de transaction affichee ci-dessus."
        );
        send(to, "Paiement confirme - CreadiTN", body);
    }

    private String html(String title, String line1, String line2, String highlight, String footer) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='")
                .append("margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;'>");
        sb.append("<div style='max-width:520px;margin:40px auto;background:#ffffff;")
                .append("border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);'>");

        sb.append("<div style='background:#1a1aff;padding:28px 32px;text-align:center;'>");
        sb.append("<h1 style='color:#ffffff;margin:0;font-size:24px;letter-spacing:1px;'>CreadiTN</h1>");
        sb.append("<p style='color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;'>BNPL Tunisia</p>");
        sb.append("</div>");

        sb.append("<div style='padding:32px;'>");
        sb.append("<h2 style='color:#1a1a2e;font-size:20px;margin:0 0 16px;'>").append(title).append("</h2>");
        sb.append("<p style='color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;'>").append(line1).append("</p>");
        sb.append("<p style='color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;'>").append(line2).append("</p>");

        if (highlight != null) {
            sb.append("<div style='background:#f0f0ff;border:2px solid #1a1aff;border-radius:10px;")
                    .append("padding:20px;text-align:center;margin:20px 0;'>");
            if (highlight.startsWith("http://") || highlight.startsWith("https://")) {
                sb.append("<a href='").append(escape(highlight)).append("' style='")
                        .append("display:inline-block;background:#1a1aff;color:#ffffff;text-decoration:none;")
                        .append("font-size:15px;font-weight:800;border-radius:8px;padding:14px 22px;'>")
                        .append("Reinitialiser mon mot de passe</a>");
                sb.append("<p style='color:#666;font-size:12px;line-height:1.5;margin:14px 0 0;word-break:break-all;'>")
                        .append(escape(highlight))
                        .append("</p>");
            } else {
                sb.append("<span style='font-size:32px;font-weight:900;color:#1a1aff;letter-spacing:6px;'>")
                        .append(escape(highlight))
                        .append("</span>");
            }
            sb.append("</div>");
        }

        if (footer != null) {
            sb.append("<p style='color:#888;font-size:13px;margin:20px 0 0;border-top:1px solid #eee;")
                    .append("padding-top:16px;'>")
                    .append(footer)
                    .append("</p>");
        }

        sb.append("</div>");
        sb.append("<div style='background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #eee;'>");
        sb.append("<p style='color:#aaa;font-size:12px;margin:0;'>&copy; 2026 CreadiTN &middot; BNPL Tunisia &middot; ")
                .append("<a href='mailto:support@creaditn.tn' style='color:#1a1aff;'>support@creaditn.tn</a></p>");
        sb.append("</div>");

        sb.append("</div></body></html>");
        return sb.toString();
    }

    private String displayName(String firstName) {
        return firstName == null || firstName.isBlank() ? "client" : firstName.trim();
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String escapeLink(String value) {
        return value == null ? "" : value.trim();
    }
}
