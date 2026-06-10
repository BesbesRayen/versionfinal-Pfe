package com.creaditn.creaditnbackend.scheduler;

import com.creaditn.creaditnbackend.service.WalletRechargeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class WalletRechargeScheduler {

    private final WalletRechargeService walletRechargeService;

    @Scheduled(cron = "0 5 0 * * *")
    public void processMonthlyRecharges() {
        int creditedCycles = walletRechargeService.rechargeAllThrough(LocalDate.now());
        log.info("Wallet recharge job completed: creditedCycles={}", creditedCycles);
    }
}
