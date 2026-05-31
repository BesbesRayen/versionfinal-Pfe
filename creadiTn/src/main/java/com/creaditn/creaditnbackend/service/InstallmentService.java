package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.InstallmentDto;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.FinancialProfileRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.util.CreditCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InstallmentService {

    private final InstallmentRepository installmentRepository;
    private final FinancialProfileRepository financialProfileRepository;

    @Transactional
    public void generateInstallments(CreditRequest creditRequest) {
        if (creditRequest.getId() != null && installmentRepository.existsByCreditRequestId(creditRequest.getId())) {
            return;
        }

        int count = creditRequest.getNumberOfInstallments();
        List<BigDecimal> schedule = CreditCalculator.calculateRepaymentSchedule(
                creditRequest.getTotalAmount(),
                creditRequest.getDownPayment(),
                count
        );
        Integer salaryDay = financialProfileRepository.findByUserId(creditRequest.getUser().getId())
                .map(FinancialProfile::getSalaryDay)
                .orElse(25);

        LocalDate firstDueDate = CreditCalculator.calculateFirstDueDate(salaryDay);

        List<Installment> installments = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            Installment installment = Installment.builder()
                    .creditRequest(creditRequest)
                    .dueDate(firstDueDate.plusMonths(i - 1L))
                    .amount(schedule.get(i - 1))
                    .status(InstallmentStatus.PENDING)
                    .penalty(BigDecimal.ZERO)
                    .build();
            installments.add(installment);
        }
        installmentRepository.saveAll(installments);
    }

    @Transactional(readOnly = true)
    public List<InstallmentDto> getInstallmentsForCredit(Long creditRequestId) {
        return installmentRepository.findByCreditRequestId(creditRequestId)
                .stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<InstallmentDto> getAllInstallments() {
        return installmentRepository.findAll()
                .stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<InstallmentDto> getUserInstallments(Long userId) {
        return installmentRepository.findByCreditRequestUserId(userId)
                .stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<InstallmentDto> getUserPendingInstallments(Long userId) {
        return installmentRepository.findByCreditRequestUserIdAndStatus(userId, InstallmentStatus.PENDING)
                .stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public Installment getInstallmentEntity(Long id) {
        return installmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Installment not found with id: " + id));
    }

    public void markAsPaid(Long installmentId) {
        Installment installment = getInstallmentEntity(installmentId);
        installment.setStatus(InstallmentStatus.PAID);
        installment.setPaidDate(LocalDateTime.now());
        installmentRepository.save(installment);
    }

    @Transactional(readOnly = true)
    public List<Installment> getUserUnpaidInstallments(Long userId) {
        List<Installment> pending = installmentRepository
                .findByCreditRequestUserIdAndStatus(userId, InstallmentStatus.PENDING);
        List<Installment> overdue = installmentRepository
                .findByCreditRequestUserIdAndStatus(userId, InstallmentStatus.OVERDUE);

        List<Installment> unpaid = new ArrayList<>(pending.size() + overdue.size());
        unpaid.addAll(pending);
        unpaid.addAll(overdue);
        return unpaid;
    }

    @Transactional
    public int markAllAsPaid(List<Installment> installments) {
        if (installments.isEmpty()) {
            return 0;
        }

        LocalDateTime paidAt = LocalDateTime.now();
        for (Installment installment : installments) {
            installment.setStatus(InstallmentStatus.PAID);
            installment.setPaidDate(paidAt);
        }

        installmentRepository.saveAll(installments);
        return installments.size();
    }

    public void markOverdueInstallments() {
        List<Installment> overdue = installmentRepository
                .findByStatusAndDueDateBefore(InstallmentStatus.PENDING, LocalDate.now());

        for (Installment inst : overdue) {
            inst.setStatus(InstallmentStatus.OVERDUE);
            inst.setPenalty(inst.getAmount().multiply(BigDecimal.valueOf(0.05)));
        }
        installmentRepository.saveAll(overdue);
    }

    private InstallmentDto mapToDto(Installment i) {
        CreditRequest cr = i.getCreditRequest();
        BigDecimal penalty = i.getPenalty() != null ? i.getPenalty() : BigDecimal.ZERO;
        BigDecimal remainingAmount = calculateRemainingPrincipal(cr);

        return InstallmentDto.builder()
                .id(i.getId())
                .creditRequestId(cr.getId())
            .userId(cr.getUser().getId())
                .productName(cr.getProductName())
                .totalAmount(cr.getTotalAmount())
                .dueDate(i.getDueDate())
                .amount(i.getAmount())
            .remainingAmount(remainingAmount)
                .status(i.getStatus())
                .paidDate(i.getPaidDate())
            .penalty(penalty)
                .build();
    }

    private BigDecimal calculateRemainingPrincipal(CreditRequest request) {
        BigDecimal totalPrincipal = CreditCalculator.calculatePrincipal(request.getTotalAmount(), request.getDownPayment());
        List<Installment> installments = installmentRepository.findByCreditRequestId(request.getId())
                .stream()
                .sorted(Comparator.comparing(Installment::getDueDate)
                        .thenComparing(Installment::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();
        if (installments.isEmpty()) {
            return totalPrincipal;
        }

        List<BigDecimal> principalSchedule = CreditCalculator.calculatePrincipalSchedule(
                request.getTotalAmount(),
                request.getDownPayment(),
                request.getNumberOfInstallments()
        );

        BigDecimal paidPrincipal = BigDecimal.ZERO;
        for (int index = 0; index < installments.size() && index < principalSchedule.size(); index++) {
            if (installments.get(index).getStatus() == InstallmentStatus.PAID) {
                paidPrincipal = paidPrincipal.add(principalSchedule.get(index));
            }
        }

        return totalPrincipal.subtract(paidPrincipal).max(BigDecimal.ZERO);
    }
}
