package com.echo.config;

import com.echo.repository.UserRepository;
import com.echo.security.service.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;

    private static final String PRESENCE_HASH_KEY = "users:presence";
    private static final String SESSION_KEY_PREFIX = "ws:session:";

    private String getActualUsername(StompHeaderAccessor accessor) {
        if (accessor.getUser() == null) return null;
        try {
            UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) accessor.getUser();
            CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();

            return userRepository.findById(userDetails.getId())
                    .map(user -> user.getUsername())
                    .orElse(null);
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

            Boolean alreadyExists = redisTemplate.hasKey(sessionKey);
            if (Boolean.TRUE.equals(alreadyExists)) return;

            redisTemplate.opsForValue().set(sessionKey, username, 24, TimeUnit.HOURS);
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
}