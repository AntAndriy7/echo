package com.echo.dto.follow;

import java.util.UUID;

public record FollowUserResponse(
        UUID id,
        String username,
        String avatarUrl,
        String email,
        boolean isFollowing
) {}