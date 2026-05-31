package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @EntityGraph(attributePaths = {"user", "installment", "installment.creditRequest"})
    List<Payment> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "installment", "installment.creditRequest"})
    List<Payment> findByUserIdOrderByPaidAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user", "installment", "installment.creditRequest"})
    Optional<Payment> findByTransactionReference(String transactionReference);

    @EntityGraph(attributePaths = {"user", "installment", "installment.creditRequest"})
    List<Payment> findByInstallmentId(Long installmentId);
}
