package com.echo.service;

import com.echo.dto.auth.AuthResult;
import com.echo.dto.auth.LoginRequest;
import com.echo.dto.auth.RegisterRequest;
import com.echo.entity.User;
import com.echo.mapper.UserMapper;
import com.echo.repository.UserRepository;
import com.echo.security.jwt.JwtTokenProvider;
import com.echo.security.service.RefreshTokenRedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;
    private final RefreshTokenRedisService redisService;

    @Transactional
    public AuthResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email вже використовується");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username вже зайнятий");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();

        User savedUser = userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        redisService.saveToken(refreshToken, request.username());

        return new AuthResult(accessToken, refreshToken, userMapper.toResponse(savedUser));
    }

    public AuthResult login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.login(), request.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        String username = authentication.getName();
        redisService.saveToken(refreshToken, username);

        User user = userRepository.findByUsernameOrEmail(request.login(), request.login())
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

        return new AuthResult(accessToken, refreshToken, userMapper.toResponse(user));
    }

    @Transactional
    public AuthResult refreshToken(String refreshToken) {
        if (refreshToken == null || !tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Невалідний підпис Refresh токена");
        }

        if (!redisService.isTokenValid(refreshToken)) {
            throw new RuntimeException("Токен був анульований або застарів. Увійдіть знову.");
        }

        String username = tokenProvider.getUsernameFromJWT(refreshToken);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

        redisService.deleteToken(refreshToken);

        String newAccessToken = tokenProvider.generateAccessTokenFromUsername(username);
        String newRefreshToken = tokenProvider.generateRefreshTokenFromUsername(username);

        redisService.saveToken(newRefreshToken, username);

        return new AuthResult(newAccessToken, newRefreshToken, userMapper.toResponse(user));
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isEmpty()) {
            redisService.deleteToken(refreshToken);
        }
    }
}