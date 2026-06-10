package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.UserWallet;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserWalletRepository userWalletRepository;

    @Transactional
    public UserWallet debit(Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero");
        }

        UserWallet wallet = userWalletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> insufficientBalance(BigDecimal.ZERO, amount));
        BigDecimal balance = wallet.getBalance() == null ? BigDecimal.ZERO : wallet.getBalance();

        if (balance.compareTo(amount) < 0) {
            throw insufficientBalance(balance, amount);
        }

        wallet.setBalance(balance.subtract(amount));
        return userWalletRepository.save(wallet);
    }

    private BadRequestException insufficientBalance(BigDecimal available, BigDecimal required) {
        return new BadRequestException(
                "Insufficient wallet balance. Available: " + available.toPlainString()
                        + " TND, required: " + required.toPlainString() + " TND"
        );
    }
}
