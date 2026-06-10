package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.UserWallet;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private UserWalletRepository userWalletRepository;

    @Test
    void debitSubtractsTheChargeWithoutRenewingTheBalance() {
        UserWallet wallet = wallet("200.00");
        when(userWalletRepository.findByUserIdForUpdate(7L)).thenReturn(Optional.of(wallet));
        when(userWalletRepository.save(wallet)).thenReturn(wallet);

        new WalletService(userWalletRepository).debit(7L, new BigDecimal("75.50"));

        assertThat(wallet.getBalance()).isEqualByComparingTo("124.50");
        verify(userWalletRepository).save(wallet);
    }

    @Test
    void debitRejectsZeroBalanceAndDoesNotCreateOrTopUpFunds() {
        UserWallet wallet = wallet("0.00");
        when(userWalletRepository.findByUserIdForUpdate(7L)).thenReturn(Optional.of(wallet));

        assertThatThrownBy(() -> new WalletService(userWalletRepository)
                .debit(7L, new BigDecimal("50.00")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient wallet balance")
                .hasMessageContaining("Available: 0.00 TND");

        assertThat(wallet.getBalance()).isEqualByComparingTo("0.00");
        verify(userWalletRepository, never()).save(wallet);
    }

    private UserWallet wallet(String balance) {
        return UserWallet.builder()
                .id(3L)
                .userId(7L)
                .balance(new BigDecimal(balance))
                .build();
    }
}
