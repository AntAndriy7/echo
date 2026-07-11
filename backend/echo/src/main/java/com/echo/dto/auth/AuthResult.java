package com.echo.dto.auth;

import com.echo.dto.user.UserResponse;

public record AuthResult(
        String accessToken,
        String refreshToken,
        UserResponse user
) {}