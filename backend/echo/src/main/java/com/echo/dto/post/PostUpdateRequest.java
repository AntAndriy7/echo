package com.echo.dto.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostUpdateRequest(
        @NotBlank(message = "Контент не може бути порожнім")
        @Size(max = 2000, message = "Пост занадто довгий")
        String content
) {}