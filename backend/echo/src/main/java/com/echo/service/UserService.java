package com.echo.service;

import com.echo.dto.user.UserResponse;
import com.echo.dto.user.UpdateProfileRequest;
import com.echo.entity.User;
import com.echo.exception.ResourceNotFoundException;
import com.echo.mapper.UserMapper;
import com.echo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserResponse getProfileByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача '" + username + "' не знайдено"));

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));

        if (request.username() != null && !request.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.username()))
                throw new IllegalArgumentException("Username вже зайнятий");
        }

        userMapper.updateEntityFromDto(request, user);
        return userMapper.toResponse(user);
    }
}