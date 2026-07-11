package com.echo.controller;

import com.echo.dto.user.UserResponse;
import com.echo.dto.user.UpdateProfileRequest;
import com.echo.dto.post.PostResponse;
import com.echo.security.service.CustomUserDetails;
import com.echo.service.PostService;
import com.echo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PostService postService;

    @GetMapping("/{username}")
    public ResponseEntity<UserResponse> getUserProfile(@PathVariable String username) {
        return ResponseEntity.ok(userService.getProfileByUsername(username));
    }

    @GetMapping("/{username}/posts")
    public ResponseEntity<Page<PostResponse>> getUserPosts(
            @PathVariable String username,
            Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        UUID currentUserId = (currentUser != null) ? currentUser.getId() : null;

        Page<PostResponse> posts = postService.getPostsByUsername(username, pageable, currentUserId);
        return ResponseEntity.ok(posts);
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UUID currentUserId = ((CustomUserDetails) userDetails).getId();

        UserResponse response = userService.updateProfile(currentUserId, request);
        return ResponseEntity.ok(response);
    }
}