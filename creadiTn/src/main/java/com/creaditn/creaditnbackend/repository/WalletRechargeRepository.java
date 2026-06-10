package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.WalletRecharge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WalletRechargeRepository extends JpaRepository<WalletRecharge, Long> {
    boolean existsByUserIdAndBillingCycle(Long userId, String billingCycle);
    Optional<WalletRecharge> findTopByUserIdOrderByBillingCycleDesc(Long userId);
    List<WalletRecharge> findByUserIdOrderByBillingCycleDesc(Long userId);
}
