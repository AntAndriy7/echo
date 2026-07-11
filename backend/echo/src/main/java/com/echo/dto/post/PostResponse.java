package com.echo.dto.post;

import com.echo.dto.user.UserResponse;

import java.time.LocalDateTime;
import java.util.UUID;

public record PostResponse(
        UUID id,
        UserResponse author,
        String content,
        Boolean isEdited,
        LocalDateTime createdAt,
        long likesCount,
        boolean isLikedByMe
) {}