package com.echo.dto.auth;

import com.echo.dto.user.UserResponse;

public record AuthResponse(
        String accessToken,
        UserResponse user
) {}