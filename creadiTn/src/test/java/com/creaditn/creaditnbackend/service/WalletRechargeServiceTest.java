package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.WalletRechargeResult;
import com.creaditn.creaditnbackend.entity.UserWallet;
import com.creaditn.creaditnbackend.entity.WalletRecharge;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import com.creaditn.creaditnbackend.repository.WalletRechargeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletRechargeServiceTest {

    @Mock private UserWalletRepository userWalletRepository;
    @Mock private WalletRechargeRepository walletRechargeRepository;
    @Mock private TransactionService transactionService;
    @Mock private SocketEventService socketEventService;

    @Test
    void nextBillingCycleAddsTwoThousandToExistingBalance() {
        UserWallet wallet = wallet("500.00", LocalDateTime.of(2026, 6, 10, 9, 0));
        mockWalletWithoutRechargeHistory(wallet);
        when(walletRechargeRepository.existsByUserIdAndBillingCycle(7L, "2026-07")).thenReturn(false);

        WalletRechargeResult result = service().rechargeThrough(7L, LocalDate.of(2026, 7, 1));

        assertThat(wallet.getBalance()).isEqualByComparingTo("2500.00");
        assertThat(result.creditedCycles()).isEqualTo(1);
        assertThat(result.creditedAmount()).isEqualByComparingTo("2000.00");
        verify(walletRechargeRepository).save(argThat(recharge ->
                recharge.getBalanceBefore().compareTo(new BigDecimal("500.00")) == 0
                        && recharge.getBalanceAfter().compareTo(new BigDecimal("2500.00")) == 0));
        verify(transactionService).record(
                7L,
                new BigDecimal("2000.00"),
                "WALLET_RECHARGE",
                "SUCCESS",
                "Monthly wallet recharge for 2026-07",
                "WALLET-RECHARGE-7-2026-07"
        );
    }

    @Test
    void zeroBalanceIsRecharged() {
        UserWallet wallet = wallet("0.00", LocalDateTime.of(2026, 6, 1, 0, 0));
        mockWalletWithoutRechargeHistory(wallet);
        when(walletRechargeRepository.existsByUserIdAndBillingCycle(7L, "2026-07")).thenReturn(false);

        service().rechargeThrough(7L, LocalDate.of(2026, 7, 20));

        assertThat(wallet.getBalance()).isEqualByComparingTo("2000.00");
    }

    @Test
    void jumpingAcrossMonthsCatchesUpOnceAndMovingBackwardDoesNothing() {
        UserWallet wallet = wallet("1500.00", LocalDateTime.of(2026, 6, 1, 0, 0));
        when(userWalletRepository.findByUserIdForUpdate(7L)).thenReturn(Optional.of(wallet));
        when(walletRechargeRepository.findTopByUserIdOrderByBillingCycleDesc(7L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(WalletRecharge.builder()
                        .billingCycle("2026-09")
                        .build()));
        when(walletRechargeRepository.existsByUserIdAndBillingCycle(eq(7L), anyString())).thenReturn(false);

        WalletRechargeResult forward = service().rechargeThrough(7L, LocalDate.of(2026, 9, 15));
        WalletRechargeResult backward = service().rechargeThrough(7L, LocalDate.of(2026, 7, 1));

        assertThat(forward.creditedCycles()).isEqualTo(3);
        assertThat(wallet.getBalance()).isEqualByComparingTo("7500.00");
        assertThat(backward.creditedCycles()).isZero();
        assertThat(backward.balance()).isEqualByComparingTo("7500.00");
        verify(walletRechargeRepository, times(3)).save(any(WalletRecharge.class));
    }

    @Test
    void alreadyProcessedCycleIsIdempotent() {
        UserWallet wallet = wallet("2500.00", LocalDateTime.of(2026, 6, 1, 0, 0));
        when(userWalletRepository.findByUserIdForUpdate(7L)).thenReturn(Optional.of(wallet));
        when(walletRechargeRepository.findTopByUserIdOrderByBillingCycleDesc(7L))
                .thenReturn(Optional.of(WalletRecharge.builder().billingCycle("2026-07").build()));

        WalletRechargeResult result = service().rechargeThrough(7L, LocalDate.of(2026, 7, 31));

        assertThat(result.creditedCycles()).isZero();
        assertThat(wallet.getBalance()).isEqualByComparingTo("2500.00");
        verify(walletRechargeRepository, never()).save(any());
        verify(userWalletRepository, never()).save(any());
        verifyNoInteractions(transactionService);
    }

    private void mockWalletWithoutRechargeHistory(UserWallet wallet) {
        when(userWalletRepository.findByUserIdForUpdate(7L)).thenReturn(Optional.of(wallet));
        when(walletRechargeRepository.findTopByUserIdOrderByBillingCycleDesc(7L)).thenReturn(Optional.empty());
    }

    private WalletRechargeService service() {
        return new WalletRechargeService(
                userWalletRepository,
                walletRechargeRepository,
                transactionService,
                socketEventService
        );
    }

    private UserWallet wallet(String balance, LocalDateTime createdAt) {
        return UserWallet.builder()
                .id(3L)
                .userId(7L)
                .balance(new BigDecimal(balance))
                .createdAt(createdAt)
                .build();
    }
}
