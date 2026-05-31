package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface InstallmentRepository extends JpaRepository<Installment, Long> {
    @Override
    @EntityGraph(attributePaths = {"creditRequest", "creditRequest.user"})
    List<Installment> findAll();

    @EntityGraph(attributePaths = {"creditRequest", "creditRequest.user"})
    List<Installment> findByCreditRequestId(Long creditRequestId);

    @EntityGraph(attributePaths = {"creditRequest", "creditRequest.user"})
    List<Installment> findByCreditRequestUserIdAndStatus(Long userId, InstallmentStatus status);

    @EntityGraph(attributePaths = {"creditRequest", "creditRequest.user"})
    List<Installment> findByCreditRequestUserId(Long userId);

    @EntityGraph(attributePaths = {"creditRequest", "creditRequest.user"})
    List<Installment> findByStatusAndDueDateBefore(InstallmentStatus status, LocalDate date);

    @EntityGraph(attributePaths = {"creditRequest", "creditRequest.user"})
    List<Installment> findByStatusInAndDueDateLessThanEqual(List<InstallmentStatus> statuses, LocalDate date);

    @EntityGraph(attributePaths = {"creditRequest", "creditRequest.user"})
    List<Installment> findByStatusAndDueDate(InstallmentStatus status, LocalDate date);

    boolean existsByCreditRequestId(Long creditRequestId);

    boolean existsByCreditRequestUserIdAndStatusIn(Long userId, Collection<InstallmentStatus> statuses);
}
