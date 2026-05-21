package com.creaditn.creaditnbackend.kyc.service;

import com.creaditn.creaditnbackend.entity.KycStatus;

public record KycDecision(KycStatus status, String reason, int riskScore) {
}
