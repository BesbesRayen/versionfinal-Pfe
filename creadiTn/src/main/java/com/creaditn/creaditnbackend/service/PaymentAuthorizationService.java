package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentAuthorizationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User verifyPassword(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (password == null || password.isBlank()
                || !passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Mot de passe incorrect. Paiement non autorise.");
        }

        return user;
    }
}
