package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentAuthorizationServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @Test
    void acceptsTheAccountPassword() {
        User user = User.builder().id(7L).password("hash").build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "hash")).thenReturn(true);

        User verified = service().verifyPassword(7L, "correct");

        assertThat(verified).isSameAs(user);
    }

    @Test
    void rejectsAnIncorrectPassword() {
        User user = User.builder().id(7L).password("hash").build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service().verifyPassword(7L, "wrong"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mot de passe incorrect");
    }

    private PaymentAuthorizationService service() {
        return new PaymentAuthorizationService(userRepository, passwordEncoder);
    }
}
