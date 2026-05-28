package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.CashbackDto;
import com.creaditn.creaditnbackend.dto.CashbackHistoryDto;
import com.creaditn.creaditnbackend.entity.Payment;
import com.creaditn.creaditnbackend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class RewardsService {

    private static final BigDecimal CASHBACK_RATE = new BigDecimal("0.02"); // 2% of payment amount

    private final PaymentRepository paymentRepository;

    public CashbackDto getCashback(Long userId) {
        List<Payment> payments = paymentRepository.findByUserId(userId);
        List<CashbackHistoryDto> history = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        AtomicLong id = new AtomicLong(1);
        for (Payment p : payments) {
            BigDecimal cb = p.getAmount().multiply(CASHBACK_RATE).setScale(2, RoundingMode.HALF_UP);
            if (cb.compareTo(BigDecimal.ZERO) <= 0) continue;
            total = total.add(cb);
            history.add(CashbackHistoryDto.builder()
                    .id(id.getAndIncrement())
                    .amount(cb)
                    .source("Paiement " + p.getTransactionReference())
                    .date(p.getPaidAt() != null
                            ? p.getPaidAt().toLocalDate().toString()
                            : LocalDate.now().toString())
                    .build());
        }
        return CashbackDto.builder()
                .available(total)
                .history(history)
                .build();
    }

    public List<CashbackHistoryDto> getHistory(Long userId) {
        return getCashback(userId).getHistory();
    }
}
