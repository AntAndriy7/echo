package com.echo.controller;

import com.echo.config.WebSocketEventListener;
import com.echo.dto.chat.ChatResponse;
import com.echo.dto.chat.MessageResponse;
import com.echo.security.service.CustomUserDetails;
import com.echo.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final WebSocketEventListener webSocketEventListener;

    @GetMapping("/unread")
    public ResponseEntity<Boolean> checkUnreadMessages(@AuthenticationPrincipal CustomUserDetails currentUser) {
        boolean hasUnread = chatService.hasUnreadMessages(currentUser.getId());
        return ResponseEntity.ok(hasUnread);
    }

    @GetMapping("/presence")
    public ResponseEntity<Set<String>> getOnlineUsers() {
        return ResponseEntity.ok(webSocketEventListener.getOnlineUsers());
    }

    @GetMapping
    public ResponseEntity<List<ChatResponse>> getUserChats(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(chatService.getUserChats(currentUser.getId()));
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<Page<MessageResponse>> getChatMessages(
            @PathVariable UUID chatId,
            Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(chatService.getChatMessages(chatId, pageable, currentUser.getId()));
    }

    @PostMapping
    public ResponseEntity<ChatResponse> getOrCreateChat(
            @RequestParam String targetUsername,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        ChatResponse chat = chatService.getOrCreateChat(currentUser.getId(), targetUsername);
        return ResponseEntity.ok(chat);
    }

    @PutMapping("/{chatId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID chatId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        chatService.markChatAsRead(chatId, currentUser.getId());
        return ResponseEntity.ok().build();
    }
}