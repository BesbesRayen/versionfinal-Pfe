package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.CreditRequest;
import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.repository.FinancialProfileRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InstallmentServiceTest {

    @Mock
    private InstallmentRepository installmentRepository;

    @Mock
    private FinancialProfileRepository financialProfileRepository;

    @Test
    void generateInstallmentsIsIdempotentForApprovedCredit() {
        when(installmentRepository.existsByCreditRequestId(11L)).thenReturn(true);

        service().generateInstallments(creditRequest());

        verify(installmentRepository, never()).saveAll(anyList());
    }

    @Test
    void generateInstallmentsUsesBackendScheduleWithLastCorrection() {
        when(installmentRepository.existsByCreditRequestId(11L)).thenReturn(false);
        when(financialProfileRepository.findByUserId(7L)).thenReturn(Optional.empty());

        service().generateInstallments(creditRequest());

        ArgumentCaptor<List<Installment>> captor = ArgumentCaptor.forClass(List.class);
        verify(installmentRepository).saveAll(captor.capture());
        List<Installment> installments = captor.getValue();

        assertThat(installments).hasSize(6);
        assertThat(installments).extracting(Installment::getAmount)
                .containsExactly(
                        new BigDecimal("137.33"),
                        new BigDecimal("137.33"),
                        new BigDecimal("137.33"),
                        new BigDecimal("137.33"),
                        new BigDecimal("137.33"),
                        new BigDecimal("137.35")
                );
    }

    private InstallmentService service() {
        return new InstallmentService(installmentRepository, financialProfileRepository);
    }

    private CreditRequest creditRequest() {
        return CreditRequest.builder()
                .id(11L)
                .user(User.builder().id(7L).build())
                .totalAmount(BigDecimal.valueOf(1000))
                .downPayment(BigDecimal.valueOf(200))
                .numberOfInstallments(6)
                .monthlyAmount(new BigDecimal("137.33"))
                .build();
    }
}
