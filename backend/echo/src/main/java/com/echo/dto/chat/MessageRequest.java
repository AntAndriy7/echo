package com.echo.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MessageRequest(
        @NotBlank(message = "Повідомлення не може бути порожнім")
        @Size(max = 2000, message = "Повідомлення занадто довге (максимум 2000 символів)")
        String content
) {}