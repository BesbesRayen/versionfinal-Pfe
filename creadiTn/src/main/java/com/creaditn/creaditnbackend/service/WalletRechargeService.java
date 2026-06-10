package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.WalletRechargeResult;
import com.creaditn.creaditnbackend.entity.UserWallet;
import com.creaditn.creaditnbackend.entity.WalletRecharge;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import com.creaditn.creaditnbackend.repository.WalletRechargeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletRechargeService {

    public static final BigDecimal MONTHLY_RECHARGE_AMOUNT = new BigDecimal("2000.00");

    private final UserWalletRepository userWalletRepository;
    private final WalletRechargeRepository walletRechargeRepository;
    private final TransactionService transactionService;
    private final SocketEventService socketEventService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public WalletRechargeResult rechargeThrough(Long userId, LocalDate asOfDate) {
        LocalDate processingDate = asOfDate == null ? LocalDate.now() : asOfDate;
        UserWallet wallet = userWalletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        YearMonth targetCycle = YearMonth.from(processingDate);
        YearMonth baselineCycle = walletRechargeRepository.findTopByUserIdOrderByBillingCycleDesc(userId)
                .map(recharge -> YearMonth.parse(recharge.getBillingCycle()))
                .orElseGet(() -> YearMonth.from(
                        wallet.getCreatedAt() == null ? processingDate : wallet.getCreatedAt()
                ));

        BigDecimal balance = wallet.getBalance() == null ? BigDecimal.ZERO : wallet.getBalance();
        BigDecimal creditedAmount = BigDecimal.ZERO;
        List<String> creditedCycles = new ArrayList<>();

        for (YearMonth cycle = baselineCycle.plusMonths(1);
             !cycle.isAfter(targetCycle);
             cycle = cycle.plusMonths(1)) {
            String cycleKey = cycle.toString();
            if (walletRechargeRepository.existsByUserIdAndBillingCycle(userId, cycleKey)) {
                continue;
            }

            BigDecimal before = balance;
            balance = balance.add(MONTHLY_RECHARGE_AMOUNT);
            walletRechargeRepository.save(WalletRecharge.builder()
                    .userId(userId)
                    .billingCycle(cycleKey)
                    .amount(MONTHLY_RECHARGE_AMOUNT)
                    .balanceBefore(before)
                    .balanceAfter(balance)
                    .build());

            String reference = "WALLET-RECHARGE-" + userId + "-" + cycleKey;
            transactionService.record(
                    userId,
                    MONTHLY_RECHARGE_AMOUNT,
                    "WALLET_RECHARGE",
                    "SUCCESS",
                    "Monthly wallet recharge for " + cycleKey,
                    reference
            );
            creditedAmount = creditedAmount.add(MONTHLY_RECHARGE_AMOUNT);
            creditedCycles.add(cycleKey);
            log.info("Monthly wallet recharge applied: user={}, cycle={}, before={}, after={}",
                    userId, cycleKey, before, balance);
        }

        if (!creditedCycles.isEmpty()) {
            wallet.setBalance(balance);
            userWalletRepository.save(wallet);
            socketEventService.emitUserEvent("credit-update", userId, Map.of(
                    "walletBalance", wallet.getBalance(),
                    "creditedAmount", creditedAmount,
                    "billingCycles", List.copyOf(creditedCycles)
            ));
        }

        return WalletRechargeResult.builder()
                .userId(userId)
                .processedThrough(processingDate)
                .creditedCycles(creditedCycles.size())
                .creditedAmount(creditedAmount)
                .balance(balance)
                .billingCycles(List.copyOf(creditedCycles))
                .build();
    }

    @Transactional
    public int rechargeAllThrough(LocalDate asOfDate) {
        int creditedCycles = 0;
        for (UserWallet wallet : userWalletRepository.findAll()) {
            creditedCycles += rechargeThrough(wallet.getUserId(), asOfDate).creditedCycles();
        }
        return creditedCycles;
    }
}
