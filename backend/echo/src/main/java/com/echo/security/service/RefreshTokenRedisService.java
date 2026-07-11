package com.echo.security.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RefreshTokenRedisService {

    private final StringRedisTemplate redisTemplate;

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpirationMs;

    public void saveToken(String token, String email) {
        redisTemplate.opsForValue().set(token, email, Duration.ofMillis(refreshExpirationMs));
    }

    public boolean isTokenValid(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(token));
    }

    public void deleteToken(String token) {
        redisTemplate.delete(token);
    }
}