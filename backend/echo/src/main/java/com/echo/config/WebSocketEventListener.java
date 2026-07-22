package com.echo.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final StringRedisTemplate redisTemplate;

    private static final String PRESENCE_HASH_KEY = "users:presence";
    private static final String SESSION_KEY_PREFIX = "ws:session:";

    private String getActualUsername(StompHeaderAccessor accessor) {
        if (accessor.getUser() == null) return null;
        try {
            return accessor.getUser().getName();
        } catch (Exception e) {
            log.error("Помилка отримання username з сокету", e);
            return null;
        }
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = getActualUsername(accessor);
        String sessionId = accessor.getSessionId();

        if (username != null && sessionId != null) {
            String sessionKey = SESSION_KEY_PREFIX + sessionId;

            Boolean isNewSession = redisTemplate.opsForValue().setIfAbsent(sessionKey, username, 24, TimeUnit.HOURS);
            if (Boolean.FALSE.equals(isNewSession)) return;

            Long activeSessions = redisTemplate.opsForHash().increment(PRESENCE_HASH_KEY, username, 1);
            log.info("Користувач {} підключився (Сесія: {}). Активних сесій: {}", username, sessionId, activeSessions);

            if (activeSessions != null && activeSessions == 1) {
                messagingTemplate.convertAndSend("/topic/presence", new PresencePayload(username, true));
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        if (sessionId != null) {
            String sessionKey = SESSION_KEY_PREFIX + sessionId;
            String username = redisTemplate.opsForValue().get(sessionKey);

            if (username != null) {
                redisTemplate.delete(sessionKey);

                Long activeSessions = redisTemplate.opsForHash().increment(PRESENCE_HASH_KEY, username, -1);
                log.info("Користувач {} відключив сесію {}. Залишилось сесій: {}", username, sessionId, activeSessions);

                if (activeSessions == null || activeSessions <= 0) {
                    redisTemplate.opsForHash().delete(PRESENCE_HASH_KEY, username);
                    messagingTemplate.convertAndSend("/topic/presence", new PresencePayload(username, false));
                }
            }
        }
    }

    public Set<String> getOnlineUsers() {
        Set<Object> keys = redisTemplate.opsForHash().keys(PRESENCE_HASH_KEY);
        if (keys == null || keys.isEmpty()) {
            return Collections.emptySet();
        }
        return (Set<String>) (Set<?>) keys;
    }

    public record PresencePayload(String username, boolean isOnline) {}

    @EventListener(ApplicationReadyEvent.class)
    public void clearActiveSessionsOnStartup() {
        log.info("Очищення завислих WebSocket сесій у Redis при запуску сервера...");

        redisTemplate.delete(PRESENCE_HASH_KEY);

        Set<String> sessionKeys = redisTemplate.keys(SESSION_KEY_PREFIX + "*");
        if (sessionKeys != null && !sessionKeys.isEmpty()) {
            redisTemplate.delete(sessionKeys);
        }

        log.info("Очищення кешу присутності завершено.");
    }
}