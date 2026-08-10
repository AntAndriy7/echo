package com.echo.controller;

import com.echo.dto.follow.FollowUserResponse;
import com.echo.security.service.CustomUserDetails;
import com.echo.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{targetUserId}/follow")
    public ResponseEntity<Void> toggleFollow(
            @PathVariable UUID targetUserId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        followService.toggleFollow(currentUser.getId(), targetUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<Page<FollowUserResponse>> getFollowers(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        Page<FollowUserResponse> followers = followService.getFollowers(userId, currentUser.getId(), page, size);
        return ResponseEntity.ok(followers);
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<Page<FollowUserResponse>> getFollowing(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        Page<FollowUserResponse> following = followService.getFollowing(userId, currentUser.getId(), page, size);
        return ResponseEntity.ok(following);
    }

    @GetMapping("/{targetUserId}/follow-status")
    public ResponseEntity<Boolean> getFollowStatus(
            @PathVariable UUID targetUserId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        boolean isFollowing = followService.isFollowing(currentUser.getId(), targetUserId);
        return ResponseEntity.ok(isFollowing);
    }
}