package com.echo.dto.chat;

import java.util.UUID;

public record TypingResponse(
        UUID chatId,
        String username
) {}