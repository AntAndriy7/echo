package com.echo.config;

import com.echo.repository.UserRepository;
import com.echo.security.service.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

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

        if (username != null) {
            onlineUsers.add(username);
            log.info("Користувач підключився: {}", username);
            messagingTemplate.convertAndSend("/topic/presence", new PresencePayload(username, true));
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = getActualUsername(accessor);

        if (username != null) {
            onlineUsers.remove(username);
            log.info("Користувач відключився: {}", username);
            messagingTemplate.convertAndSend("/topic/presence", new PresencePayload(username, false));
        }
    }

    public Set<String> getOnlineUsers() {
        return onlineUsers;
    }

    public record PresencePayload(String username, boolean isOnline) {}
}