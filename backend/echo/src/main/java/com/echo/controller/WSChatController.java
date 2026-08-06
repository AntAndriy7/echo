package com.echo.controller;

import com.echo.dto.chat.TypingResponse;
import com.echo.security.service.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class WSChatController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{chatId}/typing")
    public void processTypingEvent(@DestinationVariable UUID chatId, Authentication authentication) {
        CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();

        TypingResponse payload = new TypingResponse(chatId, user.getUsername());

        messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/typing", payload);
    }
}