package com.echo.dto.user;

import com.echo.entity.UserStatus;
import com.echo.entity.UserRole;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        String avatarUrl,
        String bio,
        Integer activeDaysCount,
        UserStatus status,
        UserRole role,
        LocalDateTime lastSeen
) {}