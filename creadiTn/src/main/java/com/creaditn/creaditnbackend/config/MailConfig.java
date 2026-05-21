package com.creaditn.creaditnbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Bean
    public JavaMailSender javaMailSender(
            @Value("${spring.mail.host:smtp.gmail.com}") String host,
            @Value("${spring.mail.port:587}") int port,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password,
            @Value("${spring.mail.properties.mail.smtp.auth:true}") String smtpAuth,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") String startTls,
            @Value("${spring.mail.properties.mail.smtp.starttls.required:true}") String startTlsRequired,
            @Value("${spring.mail.properties.mail.smtp.connectiontimeout:5000}") String connectionTimeout,
            @Value("${spring.mail.properties.mail.smtp.timeout:5000}") String timeout,
            @Value("${spring.mail.properties.mail.smtp.writetimeout:5000}") String writeTimeout,
            @Value("${spring.mail.properties.mail.smtp.ssl.trust:smtp.gmail.com}") String sslTrust
    ) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username == null ? "" : username.trim());
        sender.setPassword(normalizePassword(host, password));

        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", smtpAuth);
        props.put("mail.smtp.starttls.enable", startTls);
        props.put("mail.smtp.starttls.required", startTlsRequired);
        props.put("mail.smtp.connectiontimeout", connectionTimeout);
        props.put("mail.smtp.timeout", timeout);
        props.put("mail.smtp.writetimeout", writeTimeout);
        props.put("mail.smtp.ssl.trust", sslTrust);

        return sender;
    }

    private String normalizePassword(String host, String password) {
        if (password == null) {
            return "";
        }
        if (host != null && host.toLowerCase().contains("gmail.com")) {
            return password.replaceAll("\\s+", "");
        }
        return password;
    }
}
