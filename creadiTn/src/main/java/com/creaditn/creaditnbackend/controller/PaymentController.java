package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.ApiResponse;
import com.creaditn.creaditnbackend.dto.AutopaySettingsDto;
import com.creaditn.creaditnbackend.dto.CardDto;
import com.creaditn.creaditnbackend.dto.PaymentDto;
import com.creaditn.creaditnbackend.dto.PaymentMethodDto;
import com.creaditn.creaditnbackend.dto.PaymentAuthorizationRequest;
import com.creaditn.creaditnbackend.dto.PayAllResponse;
import com.creaditn.creaditnbackend.dto.PaymentRequest;
import com.creaditn.creaditnbackend.dto.WalletRechargeResult;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import com.creaditn.creaditnbackend.scheduler.AutopayScheduler;
import com.creaditn.creaditnbackend.scheduler.OverdueInstallmentScheduler;
import com.creaditn.creaditnbackend.service.CardService;
import com.creaditn.creaditnbackend.service.PaymentService;
import com.creaditn.creaditnbackend.service.PaymentAuthorizationService;
import com.creaditn.creaditnbackend.service.WalletRechargeService;
import com.creaditn.creaditnbackend.security.AuthenticatedUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final CardService cardService;
    private final UserRepository userRepository;
    private final UserWalletRepository userWalletRepository;
    private final AutopayScheduler autopayScheduler;
    private final WalletRechargeService walletRechargeService;
    private final PaymentAuthorizationService paymentAuthorizationService;
    private final OverdueInstallmentScheduler overdueInstallmentScheduler;
    private final AuthenticatedUserService authenticatedUserService;

    @PostMapping
    public ResponseEntity<PaymentDto> makePayment(
            @RequestParam Long userId,
            @Valid @RequestBody PaymentRequest request,
            Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        paymentAuthorizationService.verifyPassword(currentUserId, request.getPassword());
        return ResponseEntity.ok(paymentService.makePayment(currentUserId, request));
    }

    /** Alias for mobile spec — body is optional; installmentId and amount can come from the path/service */
    @PostMapping("/installments/{installmentId}/pay")
    public ResponseEntity<PaymentDto> payInstallmentAlias(
            @PathVariable Long installmentId,
            @RequestParam Long userId,
            @RequestBody(required = false) PaymentRequest request,
            Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        if (request == null) {
            request = new PaymentRequest();
        }
        request.setInstallmentId(installmentId);
        // amount will be resolved by the service if not provided
        if (request.getAmount() == null) {
            request.setAmount(java.math.BigDecimal.ZERO); // service will use real amount
        }
        paymentAuthorizationService.verifyPassword(currentUserId, request.getPassword());
        return ResponseEntity.ok(paymentService.makePayment(currentUserId, request));
    }

    @GetMapping("/my-payments")
    public ResponseEntity<List<PaymentDto>> getMyPayments(@RequestParam Long userId,
                                                          Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        return ResponseEntity.ok(paymentService.getUserPayments(currentUserId));
    }

    @GetMapping("/receipts")
    public ResponseEntity<List<PaymentDto>> getReceipts(@RequestParam Long userId,
                                                        Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        return ResponseEntity.ok(paymentService.getUserReceipts(currentUserId));
    }

    @PostMapping({"/payAll", "/pay-all"})
    public ResponseEntity<PayAllResponse> payAllInstallments(
            @RequestParam Long userId,
            @RequestBody PaymentAuthorizationRequest request,
            Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        paymentAuthorizationService.verifyPassword(currentUserId, request.getPassword());
        return ResponseEntity.ok(paymentService.payAllInstallments(currentUserId));
    }

    @PostMapping("/credits/{creditRequestId}/pay")
    public ResponseEntity<PayAllResponse> payCreditInstallments(
            @PathVariable Long creditRequestId,
            @RequestParam Long userId,
            @RequestBody PaymentAuthorizationRequest request,
            Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        paymentAuthorizationService.verifyPassword(currentUserId, request.getPassword());
        return ResponseEntity.ok(paymentService.payCreditInstallments(currentUserId, creditRequestId));
    }

    @GetMapping("/reference/{ref}")
    public ResponseEntity<PaymentDto> getByReference(@PathVariable String ref,
                                                     Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireUserId(authentication);
        return ResponseEntity.ok(paymentService.getPaymentByReference(ref, currentUserId));
    }

    @GetMapping("/methods")
    public ResponseEntity<List<PaymentMethodDto>> getMethods(@RequestParam Long userId,
                                                             Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        List<PaymentMethodDto> methods = cardService.getCards(currentUserId).stream()
            .map(this::mapCardToMethod)
            .toList();

        return ResponseEntity.ok(methods);
    }

    @PutMapping("/autopay")
    public ResponseEntity<ApiResponse> setAutopay(
            @RequestParam Long userId,
            @RequestBody AutopaySettingsDto body,
            Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (body.isEnabled()) {
            paymentAuthorizationService.verifyPassword(currentUserId, body.getPassword());
        }
        user.setAutopay(body.isEnabled());
        userRepository.save(user);
        int paidCount = body.isEnabled() ? autopayScheduler.processAutopaymentsForUser(currentUserId) : 0;
        String message = body.isEnabled() ? "Auto-payment is now active." : "Auto-payment is now inactive.";
        return ResponseEntity.ok(ApiResponse.success(message, Map.of(
                "enabled", body.isEnabled(),
                "paidInstallments", paidCount
        )));
    }

    @GetMapping("/autopay")
    public ResponseEntity<Map<String, Object>> getAutopayStatus(@RequestParam Long userId,
                                                               Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(Map.of("enabled", Boolean.TRUE.equals(user.getAutopay())));
    }

    @PostMapping("/autopay/process-due")
    public ResponseEntity<ApiResponse> processDueAutopayments(
            @RequestParam Long userId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        int paidCount = autopayScheduler.processAutopaymentsForUser(
                currentUserId,
                asOfDate == null ? LocalDate.now() : asOfDate
        );
        return ResponseEntity.ok(ApiResponse.success(
                paidCount == 1 ? "1 installment auto-paid" : paidCount + " installments auto-paid",
                Map.of("paidInstallments", paidCount)
        ));
    }

    @PostMapping("/wallet/recharge/process")
    public ResponseEntity<WalletRechargeResult> processWalletRecharge(
            @RequestParam Long userId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        return ResponseEntity.ok(walletRechargeService.rechargeThrough(
                currentUserId,
                asOfDate == null ? LocalDate.now() : asOfDate
        ));
    }

    @PostMapping("/overdue/process")
    public ResponseEntity<Map<String, Object>> processOverdueInstallments(
            @RequestParam Long userId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        int overdueCount = overdueInstallmentScheduler.processOverdueInstallments(
                currentUserId,
                asOfDate == null ? LocalDate.now() : asOfDate
        );
        return ResponseEntity.ok(Map.of("overdueInstallments", overdueCount));
    }

    @GetMapping("/wallet-balance")
    public ResponseEntity<Map<String, Object>> getWalletBalance(@RequestParam Long userId,
                                                               Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        return userWalletRepository.findByUserId(currentUserId)
                .map(w -> ResponseEntity.ok(Map.<String, Object>of("balance", w.getBalance())))
                .orElse(ResponseEntity.ok(Map.of("balance", java.math.BigDecimal.ZERO)));
    }

    private PaymentMethodDto mapCardToMethod(CardDto card) {
        String masked = card.getMaskedNumber() == null ? "****" : card.getMaskedNumber();
        String last4 = masked.length() >= 4 ? masked.substring(masked.length() - 4) : masked;

        return PaymentMethodDto.builder()
                .id(card.getId())
                .type(card.getType().name())
                .last4(last4)
                .label(masked)
                .defaultMethod(Boolean.TRUE.equals(card.getDefaultCard()))
                .build();
    }
}
