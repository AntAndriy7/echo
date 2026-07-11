package com.echo.dto.chat;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID chatId,
        String content,
        UUID senderId,
        String senderUsername,
        LocalDateTime createdAt,
        boolean isRead
) {}