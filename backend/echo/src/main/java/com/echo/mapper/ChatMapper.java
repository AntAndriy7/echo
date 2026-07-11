package com.echo.mapper;

import com.echo.dto.chat.ChatResponse;
import com.echo.entity.Chat;
import com.echo.entity.User;
import com.echo.entity.Message;
import com.echo.repository.MessageRepository;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ChatMapper {

    private final MessageRepository messageRepository;

    public ChatResponse toResponse(Chat chat, UUID currentUserId) {
        if (chat == null) return null;

        User interlocutor = chat.getParticipants().stream()
                .filter(user -> !user.getId().equals(currentUserId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("У чаті відсутній співрозмовник"));

        /*String lastMessageText = messageRepository.findFirstByChatIdOrderByCreatedAtDesc(chat.getId())
                .map(Message::getContent)
                .orElse("Немає повідомлень");*/

        Message lastMsg = messageRepository.findFirstByChatIdOrderByCreatedAtDesc(chat.getId()).orElse(null);

        String lastMessageText = lastMsg != null ? lastMsg.getContent() : "Немає повідомлень";
        LocalDateTime lastMessageAt = lastMsg != null ? lastMsg.getCreatedAt() : null;

        int unreadCount = messageRepository.countUnreadMessages(chat.getId(), currentUserId);

        return new ChatResponse(
                chat.getId(),
                interlocutor.getUsername(),
                interlocutor.getAvatarUrl(),
                lastMessageText,
                unreadCount,
                lastMessageAt
        );
    }
}