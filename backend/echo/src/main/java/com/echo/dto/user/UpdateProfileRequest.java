package com.echo.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 3, max = 50)
        String username,

        @Email
        String email,

        @Size(min = 6)
        String password,

        String avatarUrl,

        @Size(max = 500)
        String bio
) {}