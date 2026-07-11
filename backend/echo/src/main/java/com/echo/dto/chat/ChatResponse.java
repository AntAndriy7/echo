package com.echo.dto.chat;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatResponse(
        UUID id,
        String username,
        String avatarUrl,
        String lastMessage,
        int unreadCount,
        LocalDateTime lastMessageAt
) {}
