package com.echo.controller;

import com.echo.dto.post.PostResponse;
import com.echo.dto.post.PostCreateRequest;
import com.echo.dto.post.PostUpdateRequest;
import com.echo.security.service.CustomUserDetails;
import com.echo.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        Page<PostResponse> feed = postService.getFeed(page, size, currentUser.getId());
        return ResponseEntity.ok(feed);
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @RequestBody PostCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        PostResponse response = postService.createPost(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Void> toggleLike(
            @PathVariable UUID postId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        postService.toggleLike(postId, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        postService.deletePost(postId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable UUID postId,
            @Valid @RequestBody PostUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        PostResponse updatedPost = postService.updatePost(postId, request, currentUser.getId());
        return ResponseEntity.ok(updatedPost);
    }
}