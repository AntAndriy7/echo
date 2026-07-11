package com.echo.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Логін не може бути порожнім")
        String login,

        @NotBlank(message = "Пароль не може бути порожнім")
        String password
) {}