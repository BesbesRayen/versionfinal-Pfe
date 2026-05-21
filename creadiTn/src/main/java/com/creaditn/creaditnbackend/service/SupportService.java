package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.ApiResponse;
import com.creaditn.creaditnbackend.dto.SupportFaqDto;
import com.creaditn.creaditnbackend.dto.SupportFeedbackRequest;
import com.creaditn.creaditnbackend.dto.SupportTicketCreateRequest;
import com.creaditn.creaditnbackend.dto.SupportTicketDto;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class SupportService {

    private final AtomicLong ticketSeq = new AtomicLong(1);
    private final Map<Long, SupportTicketDto> tickets = new ConcurrentHashMap<>();

    public List<SupportFaqDto> getFaq() {
        List<SupportFaqDto> list = new ArrayList<>();
        list.add(SupportFaqDto.builder().id(1L).category("Compte").question("Comment creer un compte ?")
                .answer("Telechargez l'app Creadi.tn et inscrivez-vous avec votre email.").build());
        list.add(SupportFaqDto.builder().id(2L).category("Credit").question("Comment simuler un credit ?")
                .answer("Ouvrez l'onglet Simulateur, choisissez le montant et le nombre de mensualites.").build());
        list.add(SupportFaqDto.builder().id(3L).category("KYC").question("Pourquoi la verification KYC ?")
                .answer("Elle est obligatoire pour securiser les demandes de credit conformement a la reglementation.").build());
        return list;
    }

    public List<SupportTicketDto> getTickets(Long userId) {
        return tickets.values().stream()
                .filter(t -> t.getUserId().equals(userId))
                .toList();
    }

    public SupportTicketDto createTicket(Long userId, SupportTicketCreateRequest req) {
        long id = ticketSeq.getAndIncrement();
        SupportTicketDto dto = SupportTicketDto.builder()
                .id(id)
                .userId(userId)
                .subject(req.getSubject())
                .message(req.getMessage())
                .response("Nous avons bien recu votre demande. Un agent vous repondra rapidement.")
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .build();
        tickets.put(id, dto);
        return dto;
    }

    public ApiResponse submitFeedback(SupportFeedbackRequest req) {
        return ApiResponse.success("Merci pour votre avis (" + req.getRating() + "/5)");
    }

    public void clearTransientTickets() {
        tickets.clear();
        ticketSeq.set(1);
    }
}
