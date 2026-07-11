package com.echo.controller;

import com.echo.dto.chat.MessageRequest;
import com.echo.dto.chat.MessageResponse;
import com.echo.security.service.CustomUserDetails;
import com.echo.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WSChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{chatId}")
    public void processMessage(
            @DestinationVariable UUID chatId,
            @Payload MessageRequest messageRequest,
            Authentication authentication
    ) {
        log.info("Отримано повідомлення в чат [{}]: {}", chatId, messageRequest);

        try {
            CustomUserDetails currentUser = (CustomUserDetails) authentication.getPrincipal();

            // 1. Зберігаємо повідомлення в БД
            MessageResponse savedMessage = chatService.saveMessage(chatId, messageRequest, currentUser.getId());

            // 2. Отримуємо список усіх учасників цього чату
            List<String> participants = chatService.getParticipantUsernames(chatId);

            // 3. Розсилаємо повідомлення ПЕРСОНАЛЬНО кожному учаснику через унікальний топік
            for (String username : participants) {
                messagingTemplate.convertAndSend("/topic/user/" + username, savedMessage);
            }

        } catch (Exception e) {
            log.error("Помилка при обробці WebSocket повідомлення: ", e);
        }
    }
}