package com.creaditn.creaditnbackend.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private final JwtUtil jwtUtil = mock(JwtUtil.class);
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtUtil);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsAQueryForAnotherUser() throws Exception {
        MockHttpServletRequest request = authenticatedRequest("99");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("Access denied"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void authenticatesAQueryForTheTokenOwner() throws Exception {
        MockHttpServletRequest request = authenticatedRequest("7");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        assertEquals(200, response.getStatus());
        assertEquals(7L, request.getAttribute("authenticatedUserId"));
        assertEquals("user@example.com", SecurityContextHolder.getContext().getAuthentication().getName());
        verify(chain).doFilter(request, response);
    }

    private MockHttpServletRequest authenticatedRequest(String requestedUserId) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        request.addParameter("userId", requestedUserId);
        when(jwtUtil.validateToken("valid-token")).thenReturn(true);
        when(jwtUtil.getEmailFromToken("valid-token")).thenReturn("user@example.com");
        when(jwtUtil.getUserIdFromToken("valid-token")).thenReturn(7L);
        return request;
    }
}
