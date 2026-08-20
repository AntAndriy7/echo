package com.echo.dto.user;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        String avatarUrl,

        @Size(min = 3, max = 20, message = "Нікнейм має містити від 3 до 20 символів")
        @Pattern(regexp = "^[a-z0-9_]+$", message = "Нікнейм може містити лише маленькі латинські літери, цифри та нижнє підкреслення")
        String username,

        @Size(max = 150, message = "Біографія не може перевищувати 150 символів")
        String bio
) {}