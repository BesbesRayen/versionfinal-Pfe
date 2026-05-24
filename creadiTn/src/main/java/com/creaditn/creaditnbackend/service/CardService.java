package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.CardCreateRequest;
import com.creaditn.creaditnbackend.dto.CardDeleteResponse;
import com.creaditn.creaditnbackend.dto.CardDto;
import com.creaditn.creaditnbackend.dto.CardReplaceRequest;
import com.creaditn.creaditnbackend.dto.CardVerificationRequest;
import com.creaditn.creaditnbackend.entity.Card;
import com.creaditn.creaditnbackend.entity.CardStatus;
import com.creaditn.creaditnbackend.entity.CardType;
import com.creaditn.creaditnbackend.entity.CreditRequestStatus;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.NotificationType;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.entity.UserWallet;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.CardRepository;
import com.creaditn.creaditnbackend.repository.CreditRequestRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.TransactionRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import com.creaditn.creaditnbackend.util.CardCryptoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final UserWalletRepository userWalletRepository;
    private final InstallmentRepository installmentRepository;
    private final CreditRequestRepository creditRequestRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public CardDto addCard(Long userId, CardCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Card card = createCard(user, request.getCardNumber(), request.getExpiryDate(), request.getCardholderName(), request.getType(),
                Boolean.TRUE.equals(request.getDefaultCard()) || !cardRepository.existsByUserId(userId));

        ensureWalletExists(userId);

        notificationService.sendNotification(
                userId,
                "Payment method added",
                "Your card " + card.getLast4() + " has been linked successfully.",
                NotificationType.PAYMENT_CONFIRMED
        );

        return toDto(card);
    }

    @Transactional
    public CardDto replaceCard(Long userId, Long oldCardId, CardReplaceRequest request) {
        User user = ensureVerifiedUser(userId, request);
        Card oldCard = findUserCard(userId, oldCardId);
        enforceCardChangeRules(userId);

        Card replacement = createCard(user, request.getCardNumber(), request.getExpiryDate(), request.getCardholderName(), request.getType(), true);
        cardRepository.delete(oldCard);

        notificationService.sendNotification(
                userId,
                "Payment method replaced",
                "Your default payment card has been updated.",
                NotificationType.PAYMENT_CONFIRMED
        );

        return toDto(replacement);
    }

    @Transactional
    public CardDeleteResponse deleteCard(Long userId, Long cardId, CardVerificationRequest request) {
        ensureVerifiedUser(userId, request);
        Card card = findUserCard(userId, cardId);
        enforceCardDeletionRules(userId);

        cardRepository.delete(card);
        cardRepository.flush();

        cardRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(c -> c.getStatus() == CardStatus.ACTIVE)
                .findFirst()
                .ifPresent(activeCard -> {
                    activeCard.setIsDefault(true);
                    cardRepository.save(activeCard);
                });

        notificationService.sendNotification(
                userId,
                "Payment method removed",
                "Your card ending in " + card.getLast4() + " has been removed.",
                NotificationType.PAYMENT_CONFIRMED
        );

        return CardDeleteResponse.builder()
                .success(true)
                .message("Card removed successfully.")
                .build();
    }

    private Card createCard(User user, String cardNumber, String expiryDate, String cardholderName,
                            CardType type, boolean shouldBeDefault) {
        Long userId = user.getId();
        String sanitizedNumber = cardNumber.replaceAll("\\s+", "");
        if (!sanitizedNumber.matches("^\\d{13,19}$")) {
            throw new BadRequestException("Card number must contain 13 to 19 digits");
        }
        if (!isValidLuhn(sanitizedNumber)) {
            throw new BadRequestException("Card number is invalid");
        }
        validateExpiryDate(expiryDate);

        String encryptedNumber = CardCryptoUtil.encrypt(sanitizedNumber);
        String last4 = sanitizedNumber.substring(Math.max(0, sanitizedNumber.length() - 4));

        if (shouldBeDefault) {
            unsetCurrentDefault(userId);
        }

        Card card = Card.builder()
                .user(user)
                .cardNumber(encryptedNumber)
                .last4(last4)
                .expiryDate(expiryDate)
                .cardholderName(cardholderName)
                .type(type)
                .isDefault(shouldBeDefault)
                .status(CardStatus.ACTIVE)
                .build();

        return cardRepository.save(card);
    }

    private void ensureWalletExists(Long userId) {
        if (!userWalletRepository.findByUserId(userId).isPresent()) {
            UserWallet wallet = UserWallet.builder()
                    .userId(userId)
                    .balance(new BigDecimal("2000.00"))
                    .build();
            userWalletRepository.save(wallet);
        }
    }

    private void validateExpiryDate(String expiryDate) {
        try {
            YearMonth expiry = YearMonth.parse(expiryDate, DateTimeFormatter.ofPattern("MM/yy"));
            if (expiry.isBefore(YearMonth.now())) {
                throw new BadRequestException("Card expiry date must be in the future");
            }
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("Expiry date must follow MM/YY");
        }
    }

    public List<CardDto> getCards(Long userId) {
        ensureUserExists(userId);
        return cardRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CardDto setDefaultCard(Long userId, Long cardId) {
        Card card = findUserCard(userId, cardId);
        if (card.getStatus() != CardStatus.ACTIVE) {
            throw new BadRequestException("Only active cards can be set as default");
        }

        unsetCurrentDefault(userId);
        card.setIsDefault(true);
        cardRepository.save(card);

        return toDto(card);
    }

    @Transactional
    public CardDto blockCard(Long userId, Long cardId) {
        Card card = findUserCard(userId, cardId);
        card.setStatus(CardStatus.BLOCKED);
        card.setIsDefault(false);
        cardRepository.save(card);

        // Ensure the user still has one default card when possible
        cardRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(c -> c.getStatus() == CardStatus.ACTIVE)
                .findFirst()
                .ifPresent(activeCard -> {
                    activeCard.setIsDefault(true);
                    cardRepository.save(activeCard);
                });

        return toDto(card);
    }

    public Card getDefaultActiveCard(Long userId) {
        Card defaultCard = cardRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new BadRequestException("Add a payment method"));

        if (defaultCard.getStatus() != CardStatus.ACTIVE) {
            throw new BadRequestException("Your default payment method is blocked. Please add a new active card");
        }

        return defaultCard;
    }

    public boolean hasActiveCard(Long userId) {
        return cardRepository.existsByUserIdAndStatus(userId, CardStatus.ACTIVE);
    }

    public CardDto getDefaultCard(Long userId) {
        return toDto(getDefaultActiveCard(userId));
    }

    private void unsetCurrentDefault(Long userId) {
        cardRepository.findByUserIdAndIsDefaultTrue(userId).ifPresent(existingDefault -> {
            existingDefault.setIsDefault(false);
            cardRepository.save(existingDefault);
        });
    }

    private Card findUserCard(Long userId, Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        if (!card.getUser().getId().equals(userId)) {
            throw new BadRequestException("Card does not belong to user");
        }
        return card;
    }

    private User ensureVerifiedUser(Long userId, CardVerificationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Boolean.TRUE.equals(request.getBiometricVerified())) {
            return user;
        }

        String rawPassword = request.getPassword() == null ? "" : request.getPassword();
        String storedPassword = user.getPassword();
        boolean validPassword = storedPassword != null && (
                (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$"))
                        ? passwordEncoder.matches(rawPassword, storedPassword)
                        : storedPassword.equals(rawPassword)
        );

        if (!validPassword) {
            throw new BadRequestException("Secure verification failed. Please confirm your password.");
        }

        return user;
    }

    private void enforceCardDeletionRules(Long userId) {
        enforceCardChangeRules(userId);
    }

    private void enforceCardChangeRules(Long userId) {
        boolean hasUnpaidInstallments = installmentRepository.existsByCreditRequestUserIdAndStatusIn(
                userId,
                EnumSet.of(InstallmentStatus.PENDING, InstallmentStatus.OVERDUE)
        );
        if (hasUnpaidInstallments) {
            throw new BadRequestException("You must complete all remaining payments before removing this card.");
        }

        boolean hasPendingCredit = creditRequestRepository.existsByUserIdAndStatusIn(
                userId,
                Set.of(CreditRequestStatus.PENDING)
        );
        if (hasPendingCredit) {
            throw new BadRequestException("You cannot change this card while a BNPL or credit request is still active.");
        }

        boolean hasProcessingTransaction = transactionRepository.existsByUserIdAndStatusIn(
                userId,
                Set.of("PENDING", "PROCESSING")
        );
        if (hasProcessingTransaction) {
            throw new BadRequestException("You cannot change this card while a transaction is processing.");
        }
    }

    private boolean isValidLuhn(String cardNumber) {
        int sum = 0;
        boolean doubleDigit = false;
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int digit = Character.digit(cardNumber.charAt(i), 10);
            if (doubleDigit) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            doubleDigit = !doubleDigit;
        }
        return sum % 10 == 0;
    }

    private void ensureUserExists(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private CardDto toDto(Card card) {
        String decryptedNumber = CardCryptoUtil.decrypt(card.getCardNumber());
        String last4 = card.getLast4() != null ? card.getLast4()
                : decryptedNumber.substring(Math.max(0, decryptedNumber.length() - 4));

        return CardDto.builder()
                .id(card.getId())
                .userId(card.getUser().getId())
                .maskedNumber(CardCryptoUtil.maskCardNumber(decryptedNumber))
                .last4(last4)
                .expiryDate(card.getExpiryDate())
                .cardholderName(card.getCardholderName())
                .type(card.getType())
                .defaultCard(card.getIsDefault())
                .status(card.getStatus())
                .createdAt(card.getCreatedAt())
                .build();
    }
}
