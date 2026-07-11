package com.echo.security.jwt;

import com.echo.security.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            // 1. Дістаємо токен із запиту
            String jwt = getJwtFromRequest(request);

            // 2. Якщо токен є і він валідний
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {

                // 3. Дістаємо email користувача з токена
                String username = tokenProvider.getUsernameFromJWT(jwt);

                // 4. Завантажуємо дані користувача з бази
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

                // 5. Створюємо об'єкт аутентифікації для Spring Security
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                // Додаємо деталі запиту
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 6. Зберігаємо аутентифікацію в контексті (тепер користувач "залогінений" для цього запиту)
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            log.error("Не вдалося встановити аутентифікацію користувача: {}", ex.getMessage());
        }

        // 7. Передаємо запит далі по ланцюжку фільтрів
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}