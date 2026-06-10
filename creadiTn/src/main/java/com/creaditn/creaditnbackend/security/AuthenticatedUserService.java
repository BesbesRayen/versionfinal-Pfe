package com.creaditn.creaditnbackend.security;

import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticatedUserService {

    private final UserRepository userRepository;

    public Long requireUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadRequestException("Authentication required");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"))
                .getId();
    }

    public Long requireSameUser(Authentication authentication, Long requestedUserId) {
        Long authenticatedUserId = requireUserId(authentication);
        if (requestedUserId != null && !authenticatedUserId.equals(requestedUserId)) {
            throw new BadRequestException("You are not authorized to access another account");
        }
        return authenticatedUserId;
    }
}
