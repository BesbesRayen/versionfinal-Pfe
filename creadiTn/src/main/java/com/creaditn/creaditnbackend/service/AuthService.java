package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.*;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.entity.UserWallet;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import com.creaditn.creaditnbackend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final int MAX_VERIFY_ATTEMPTS  = 5;
    private static final int RESEND_COOLDOWN_SECS = 60;
    private static final int OTP_EXPIRY_MINUTES   = 5;
    private static final int RESET_TOKEN_BYTES    = 32;

    private final UserRepository userRepository;
    private final UserWalletRepository userWalletRepository;
    private final CreadiScoreService creadiScoreService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final Map<String, RecoveryAttempt> emailRecoveryAttempts = new ConcurrentHashMap<>();
    private final Map<String, EmailRevealSession> emailRevealSessions = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.password-reset.base-url:http://localhost:3000/forgot-password}")
    private String passwordResetBaseUrl;

    @Value("${app.password-reset.expiry-minutes:30}")
    private long passwordResetExpiryMinutes;

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.trim();
    }

    private String normalizeIdentifier(String identifier) {
        if (identifier == null) return "";
        String value = identifier.trim();
        return value.contains("@") ? normalizeEmail(value) : normalizePhone(value);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (normalizedEmail.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("Email already registered");
        }
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .address(request.getAddress())
                .profession(request.getProfession())
                .build();

        userRepository.save(user);

        // Create initial wallet with simulation balance
        userWalletRepository.save(UserWallet.builder()
                .userId(user.getId())
                .balance(new BigDecimal("2000.00"))
                .build());

        // Auto-calculate initial Creadi Score
        try {
            creadiScoreService.calculateScore(user.getId());
        } catch (Exception ignored) {
            // Score can be recalculated lazily; registration must not fail because of this.
        }

        // Generate and send email verification OTP — DO NOT issue JWT yet
        String otp = generateOtp();
        user.setEmailVerificationOtp(otp);
        user.setEmailVerificationOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        user.setEmailVerificationAttempts(0);
        user.setEmailVerificationSentAt(LocalDateTime.now());
        userRepository.save(user);
        try {
            emailService.sendEmailVerificationOtp(user.getEmail(), user.getFirstName(), otp);
        } catch (Exception ignored) {}

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .emailVerified(false)
                .message("Compte cree. Veuillez verifier votre adresse email avec le code envoye.")
                .token(null)
                .build();
    }

    /** Verify email with 6-digit OTP. Returns JWT on success. */
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Utilisateur introuvable."));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            String token = jwtUtil.generateToken(user.getId(), user.getEmail());
            return AuthResponse.builder()
                    .userId(user.getId()).email(user.getEmail())
                    .firstName(user.getFirstName()).lastName(user.getLastName())
                    .emailVerified(true).message("Email deja verifie.")
                    .token(token).build();
        }

        int attempts = user.getEmailVerificationAttempts() == null ? 0 : user.getEmailVerificationAttempts();
        if (attempts >= MAX_VERIFY_ATTEMPTS) {
            throw new BadRequestException(
                    "Trop de tentatives incorrectes. Veuillez demander un nouveau code.");
        }

        if (user.getEmailVerificationOtpExpiry() == null ||
                LocalDateTime.now().isAfter(user.getEmailVerificationOtpExpiry())) {
            throw new BadRequestException(
                    "Le code de verification a expire. Veuillez en demander un nouveau.");
        }

        if (!request.getCode().trim().equals(user.getEmailVerificationOtp())) {
            user.setEmailVerificationAttempts(attempts + 1);
            userRepository.save(user);
            int remaining = MAX_VERIFY_ATTEMPTS - (attempts + 1);
            throw new BadRequestException(
                    "Code incorrect. " + (remaining > 0 ? remaining + " tentative(s) restante(s)." : "Limite atteinte."));
        }

        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        user.setEmailVerificationOtp(null);
        user.setEmailVerificationOtpExpiry(null);
        user.setEmailVerificationAttempts(0);
        userRepository.save(user);

        try { emailService.sendWelcome(user.getEmail(), user.getFirstName()); } catch (Exception ignored) {}

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .userId(user.getId()).email(user.getEmail())
                .firstName(user.getFirstName()).lastName(user.getLastName())
                .emailVerified(true)
                .message("Email verifie. Bienvenue sur CreadiTN !")
                .token(token).build();
    }

    /** Resend verification OTP with 60-second cooldown. */
    public ApiResponse resendVerification(ResendVerificationRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Utilisateur introuvable."));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Cet email est deja verifie.");
        }

        if (user.getEmailVerificationSentAt() != null &&
                LocalDateTime.now().isBefore(user.getEmailVerificationSentAt().plusSeconds(RESEND_COOLDOWN_SECS))) {
            long secondsLeft = java.time.Duration.between(
                    LocalDateTime.now(), user.getEmailVerificationSentAt().plusSeconds(RESEND_COOLDOWN_SECS))
                    .getSeconds();
            throw new BadRequestException(
                    "Veuillez patienter " + secondsLeft + " seconde(s) avant de renvoyer le code.");
        }

        String otp = generateOtp();
        user.setEmailVerificationOtp(otp);
        user.setEmailVerificationOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        user.setEmailVerificationAttempts(0);
        user.setEmailVerificationSentAt(LocalDateTime.now());
        userRepository.save(user);

        try {
            emailService.sendEmailVerificationOtp(user.getEmail(), user.getFirstName(), otp);
        } catch (Exception ignored) {}

        return ApiResponse.success("Nouveau code de verification envoye a votre adresse email.");
    }

    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Email ou mot de passe incorrect"));

        boolean valid;
        if (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$")) {
            valid = passwordEncoder.matches(request.getPassword(), user.getPassword());
        } else {
            valid = user.getPassword().equals(request.getPassword());
            if (valid) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            }
        }

        if (!valid) {
            throw new BadRequestException("Email ou mot de passe incorrect");
        }

        if (Boolean.TRUE.equals(user.getAccountDeleted())) {
            throw new BadRequestException("Ce compte a ete supprime. Contactez le support.");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException(
                    "EMAIL_NOT_VERIFIED: Veuillez verifier votre adresse email avant de vous connecter.");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .emailVerified(true)
                .message("Connexion reussie")
                .token(token)
                .build();
    }

    @Transactional
    public ApiResponse requestPasswordReset(ForgotPasswordRequest request) {
        String identifier = normalizeIdentifier(request.getIdentifier());
        if (identifier.isBlank()) {
            throw new BadRequestException("Email ou numero de telephone requis");
        }

        User user = findByIdentifier(identifier);
        String token = generateResetToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(passwordResetExpiryMinutes);
        user.setPasswordResetTokenHash(hashResetToken(token));
        user.setPasswordResetTokenExpiry(expiresAt);
        user.setPasswordResetRequestedAt(LocalDateTime.now());
        userRepository.save(user);

        String resetLink = buildPasswordResetLink(user.getEmail(), token);
        boolean sent = emailService.sendPasswordResetLink(
                user.getEmail(),
                user.getFirstName(),
                resetLink,
                token,
                passwordResetExpiryMinutes
        );
        if (!sent) {
            clearPasswordResetToken(user);
            userRepository.save(user);
            throw new BadRequestException("Service email indisponible. Verifiez la configuration SMTP.");
        }

        return ApiResponse.success("Un lien de reinitialisation a ete envoye a votre email.");
    }

    @Transactional
    public ApiResponse validatePasswordReset(ForgotPasswordValidateRequest request) {
        User user = findByIdentifier(normalizeIdentifier(request.getIdentifier()));
        validateStoredResetToken(user, request.getToken());
        Duration remaining = Duration.between(LocalDateTime.now(), user.getPasswordResetTokenExpiry());
        return ApiResponse.success("Lien de reinitialisation valide.", Map.of(
                "expiresInSeconds", Math.max(0, remaining.toSeconds())
        ));
    }

    @Transactional
    public ApiResponse confirmPasswordReset(ForgotPasswordConfirmRequest request) {
        String identifier = normalizeIdentifier(request.getIdentifier());
        if (identifier.isBlank()) {
            throw new BadRequestException("Email ou numero de telephone requis");
        }
        User user = findByIdentifier(identifier);
        validateStoredResetToken(user, request.resolveToken());

        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new BadRequestException("Le nouveau mot de passe doit contenir au moins 8 caracteres.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        clearPasswordResetToken(user);
        userRepository.save(user);

        try { emailService.sendPasswordChanged(user.getEmail(), user.getFirstName()); } catch (Exception ignored) {}

        return ApiResponse.success("Mot de passe reinitialise avec succes.");
    }

    public ApiResponse recoverEmail(ForgotEmailRequest request) {
        String identifier = normalizeIdentifier(request.getIdentifier());
        String password = request.getPassword() == null ? "" : request.getPassword();
        if (identifier.isBlank() || password.isBlank()) {
            throw new BadRequestException("Identifiant et mot de passe requis.");
        }

        enforceEmailRecoveryRateLimit(identifier);

        Optional<User> userOpt = findEmailRecoveryCandidates(identifier).stream()
                .filter(user -> passwordEncoder.matches(password, user.getPassword()))
                .findFirst();

        if (userOpt.isEmpty()) {
            recordFailedEmailRecovery(identifier);
            log.warn("Forgot-email recovery failed for identifier={}", safeLogIdentifier(identifier));
            throw new BadRequestException("Identifiant ou mot de passe incorrect.");
        }

        User user = userOpt.get();
        emailRecoveryAttempts.remove(identifier);
        String token = UUID.randomUUID().toString();
        emailRevealSessions.put(token, new EmailRevealSession(user.getId(), user.getEmail(), LocalDateTime.now().plusMinutes(3)));
        log.info("Forgot-email recovery verified for userId={}", user.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("maskedEmail", maskEmail(user.getEmail()));
        data.put("recoveryToken", token);
        return ApiResponse.success("Email verifie.", data);
    }

    public ApiResponse revealRecoveredEmail(RevealEmailRequest request) {
        EmailRevealSession session = emailRevealSessions.get(request.getRecoveryToken());
        if (session == null) {
            throw new BadRequestException("Session de recuperation introuvable. Recommencez.");
        }
        if (LocalDateTime.now().isAfter(session.expiresAt())) {
            emailRevealSessions.remove(request.getRecoveryToken());
            throw new BadRequestException("Session de recuperation expiree. Recommencez.");
        }

        emailRevealSessions.remove(request.getRecoveryToken());
        return ApiResponse.success("Email revele.", Map.of("email", session.email()));
    }

    @Transactional
    public ApiResponse updateRecoveredEmail(UpdateRecoveredEmailRequest request) {
        EmailRevealSession session = emailRevealSessions.get(request.getRecoveryToken());
        if (session == null) {
            throw new BadRequestException("Session de recuperation introuvable. Recommencez.");
        }
        if (LocalDateTime.now().isAfter(session.expiresAt())) {
            emailRevealSessions.remove(request.getRecoveryToken());
            throw new BadRequestException("Session de recuperation expiree. Recommencez.");
        }

        String newEmail = normalizeEmail(request.getNewEmail());
        if (newEmail.isBlank()) {
            throw new BadRequestException("Nouvel email requis.");
        }

        User user = userRepository.findById(session.userId())
                .orElseThrow(() -> new BadRequestException("Utilisateur introuvable."));
        if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new BadRequestException("Cet email est deja utilise par un autre compte.");
        }

        String otp = generateOtp();
        user.setEmail(newEmail);
        user.setEmailVerified(false);
        user.setEmailVerifiedAt(null);
        user.setEmailVerificationOtp(otp);
        user.setEmailVerificationOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        user.setEmailVerificationAttempts(0);
        user.setEmailVerificationSentAt(LocalDateTime.now());
        userRepository.save(user);
        emailRevealSessions.remove(request.getRecoveryToken());

        try {
            emailService.sendEmailVerificationOtp(user.getEmail(), user.getFirstName(), otp);
        } catch (Exception ignored) {}

        log.info("Recovered email updated for userId={}", user.getId());
        return ApiResponse.success("Email modifie. Un code de verification a ete envoye.", Map.of("email", newEmail));
    }

    private User findByIdentifier(String identifier) {
        if (identifier.contains("@")) {
            return userRepository.findByEmailIgnoreCase(identifier)
                    .orElseThrow(() -> new BadRequestException("Aucun compte trouve avec cet email."));
        }
        return userRepository.findByPhone(identifier)
                .orElseThrow(() -> new BadRequestException("Aucun compte trouve avec ce numero."));
    }

    public void clearPasswordResetSessions() {
        List<User> users = userRepository.findAll();
        users.forEach(this::clearPasswordResetToken);
        userRepository.saveAll(users);
    }

    private record RecoveryAttempt(int count, LocalDateTime lockedUntil) {}

    private record EmailRevealSession(Long userId, String email, LocalDateTime expiresAt) {}

    private String generateOtp() {
        return String.valueOf(100000 + secureRandom.nextInt(900000));
    }

    private String generateResetToken() {
        byte[] bytes = new byte[RESET_TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashResetToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash password reset token", ex);
        }
    }

    private String buildPasswordResetLink(String email, String token) {
        return UriComponentsBuilder.fromUriString(passwordResetBaseUrl)
                .queryParam("email", email)
                .queryParam("token", token)
                .build()
                .toUriString();
    }

    private void validateStoredResetToken(User user, String token) {
        if (token == null || token.isBlank()
                || user.getPasswordResetTokenHash() == null
                || user.getPasswordResetTokenExpiry() == null) {
            throw new BadRequestException("Lien de reinitialisation introuvable. Recommencez.");
        }
        if (LocalDateTime.now().isAfter(user.getPasswordResetTokenExpiry())) {
            clearPasswordResetToken(user);
            userRepository.save(user);
            throw new BadRequestException("Lien de reinitialisation expire. Veuillez demander un nouveau lien.");
        }
        String candidateHash = hashResetToken(token.trim());
        boolean matches = MessageDigest.isEqual(
                user.getPasswordResetTokenHash().getBytes(StandardCharsets.UTF_8),
                candidateHash.getBytes(StandardCharsets.UTF_8)
        );
        if (!matches) {
            throw new BadRequestException("Lien de reinitialisation invalide.");
        }
    }

    private void clearPasswordResetToken(User user) {
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetTokenExpiry(null);
        user.setPasswordResetRequestedAt(null);
    }

    private List<User> findEmailRecoveryCandidates(String identifier) {
        if (identifier.contains("@")) {
            return userRepository.findByEmailIgnoreCase(identifier)
                    .filter(user -> !Boolean.TRUE.equals(user.getAccountDeleted()))
                    .map(List::of)
                    .orElse(List.of());
        }

        Optional<User> byPhone = userRepository.findByPhone(identifier)
                .filter(user -> !Boolean.TRUE.equals(user.getAccountDeleted()));
        if (byPhone.isPresent()) {
            return List.of(byPhone.get());
        }

        String normalizedUsername = normalizeUsername(identifier);
        return userRepository.findAll().stream()
                .filter(user -> !Boolean.TRUE.equals(user.getAccountDeleted()))
                .filter(user -> {
                    String localPart = user.getEmail() == null ? "" : user.getEmail().split("@")[0];
                    String fullName = (user.getFirstName() == null ? "" : user.getFirstName())
                            + (user.getLastName() == null ? "" : user.getLastName());
                    return normalizeUsername(localPart).equals(normalizedUsername)
                            || normalizeUsername(fullName).equals(normalizedUsername);
                })
                .toList();
    }

    private void enforceEmailRecoveryRateLimit(String identifier) {
        RecoveryAttempt attempt = emailRecoveryAttempts.get(identifier);
        if (attempt != null && attempt.lockedUntil() != null && LocalDateTime.now().isBefore(attempt.lockedUntil())) {
            throw new BadRequestException("Trop de tentatives. Reessayez dans quelques minutes.");
        }
    }

    private void recordFailedEmailRecovery(String identifier) {
        RecoveryAttempt current = emailRecoveryAttempts.get(identifier);
        int nextCount = current == null ? 1 : current.count() + 1;
        LocalDateTime lockUntil = nextCount >= 5 ? LocalDateTime.now().plusMinutes(10) : null;
        emailRecoveryAttempts.put(identifier, new RecoveryAttempt(nextCount, lockUntil));
    }

    private String normalizeUsername(String value) {
        return value == null ? "" : value.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "";
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String domain = parts[1];
        String visible = local.length() <= 2 ? local.substring(0, 1) : local.substring(0, Math.min(2, local.length()));
        return visible + "***@" + domain;
    }

    private String safeLogIdentifier(String identifier) {
        if (identifier == null || identifier.length() <= 3) return "***";
        return identifier.substring(0, 2) + "***" + identifier.substring(identifier.length() - 1);
    }
}
