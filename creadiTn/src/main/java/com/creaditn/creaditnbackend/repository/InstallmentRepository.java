package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface InstallmentRepository extends JpaRepository<Installment, Long> {
    List<Installment> findByCreditRequestId(Long creditRequestId);
    List<Installment> findByCreditRequestUserIdAndStatus(Long userId, InstallmentStatus status);
    List<Installment> findByCreditRequestUserId(Long userId);
    List<Installment> findByStatusAndDueDateBefore(InstallmentStatus status, LocalDate date);
    List<Installment> findByStatusInAndDueDateLessThanEqual(List<InstallmentStatus> statuses, LocalDate date);
    List<Installment> findByStatusAndDueDate(InstallmentStatus status, LocalDate date);
    boolean existsByCreditRequestId(Long creditRequestId);
    boolean existsByCreditRequestUserIdAndStatusIn(Long userId, Collection<InstallmentStatus> statuses);
}
