package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.CreditPlanResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/credit-plans")
public class CreditPlanController {

    @GetMapping
    public ResponseEntity<List<CreditPlanResponse>> getCreditPlans() {
        return ResponseEntity.ok(List.of(
                CreditPlanResponse.builder()
                        .months(3)
                        .label("3 mois")
                        .feePercent(0.0)
                        .feeLabel("0%")
                        .description("sans frais")
                        .recommended(true)
                        .build(),
                CreditPlanResponse.builder()
                        .months(6)
                        .label("6 mois")
                        .feePercent(3.0)
                        .feeLabel("+3%")
                        .description("populaire")
                        .recommended(false)
                        .build(),
                CreditPlanResponse.builder()
                        .months(9)
                        .label("9 mois")
                        .feePercent(6.0)
                        .feeLabel("+6%")
                        .description("intermediaire")
                        .recommended(false)
                        .build(),
                CreditPlanResponse.builder()
                        .months(12)
                        .label("12 mois")
                        .feePercent(12.0)
                        .feeLabel("+12%")
                        .description("long terme")
                        .recommended(false)
                        .build()
        ));
    }
}
