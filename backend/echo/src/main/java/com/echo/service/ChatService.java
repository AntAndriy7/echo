package com.echo.service;

import com.echo.dto.chat.ChatResponse;
import com.echo.dto.chat.MessageRequest;
import com.echo.dto.chat.MessageResponse;
import com.echo.entity.Chat;
import com.echo.entity.Message;
import com.echo.entity.User;
import com.echo.mapper.ChatMapper;
import com.echo.mapper.MessageMapper;
import com.echo.repository.ChatRepository;
import com.echo.repository.MessageRepository;
import com.echo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final MessageMapper messageMapper;
    private final ChatMapper chatMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageResponse saveMessage(UUID chatId, MessageRequest request, UUID senderId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("Чат не знайдено"));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Користувача не знайдено"));

        boolean isParticipant = chat.getParticipants().stream()
                .anyMatch(u -> u.getId().equals(senderId));
        if (!isParticipant) {
            throw new AccessDeniedException("Ви не є учасником цього чату");
        }

        Message message = Message.builder()
                .chat(chat)
                .sender(sender)
                .content(request.content())
                .build();

        Message savedMessage = messageRepository.save(message);
        return messageMapper.toResponse(savedMessage);
    }

    @Transactional
    public void saveAndBroadcastMessage(UUID chatId, MessageRequest request, UUID senderId) {
        // Зберігаємо повідомлення в БД
        MessageResponse savedMessage = saveMessage(chatId, request, senderId);

        // Дістаємо чат (Hibernate візьме його з кешу L1, зайвого SELECT не буде)
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("Чат не знайдено"));

        // Розсилка кожному учаснику через його приватну чергу
        for (User participant : chat.getParticipants()) {
            messagingTemplate.convertAndSendToUser(
                    participant.getUsername(),
                    "/queue/messages",
                    savedMessage
            );
        }
    }

    @Transactional
    public void markChatAsRead(UUID chatId, UUID currentUserId) {
        int updatedCount = messageRepository.markAllAsRead(chatId, currentUserId);

        // Якщо були оновлені повідомлення — сповіщаємо співрозмовника
        if (updatedCount > 0) {
            Chat chat = chatRepository.findById(chatId)
                    .orElseThrow(() -> new IllegalArgumentException("Чат не знайдено"));

            String partnerUsername = chat.getParticipants().stream()
                    .filter(u -> !u.getId().equals(currentUserId))
                    .map(User::getUsername)
                    .findFirst()
                    .orElse(null);

            if (partnerUsername != null) {
                Map<String, String> payload = Map.of("chatId", chatId.toString());

                messagingTemplate.convertAndSendToUser(
                        partnerUsername,
                        "/queue/read-receipts",
                        payload
                );
            }
        }
    }

    @Transactional(readOnly = true)
    public boolean hasUnreadMessages(UUID userId) {
        return messageRepository.existsUnreadMessagesForUser(userId);
    }

    @Transactional(readOnly = true)
    public List<ChatResponse> getUserChats(UUID currentUserId) {
        List<Chat> chats = chatRepository.findAllByUserId(currentUserId);

        return chats.stream()
                .map(chat -> chatMapper.toResponse(chat, currentUserId))
                .sorted(Comparator.comparing(
                        ChatResponse::lastMessageAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> getChatMessages(UUID chatId, Pageable pageable, UUID currentUserId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("Чат не знайдено"));

        boolean isParticipant = chat.getParticipants().stream()
                .anyMatch(u -> u.getId().equals(currentUserId));

        if (!isParticipant) {
            throw new AccessDeniedException("Ви не маєте доступу до історії цього чату");
        }

        Page<Message> messages = messageRepository.findByChatIdOrderByCreatedAtDesc(chatId, pageable);

        return messages.map(messageMapper::toResponse);
    }

    @Transactional
    public ChatResponse getOrCreateChat(UUID currentUserId, String targetUsername) {
        User targetUser = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("Користувача не знайдено"));

        if (currentUserId.equals(targetUser.getId())) {
            throw new IllegalArgumentException("Ви не можете створити чат самі з собою");
        }

        List<Chat> existingChats = chatRepository.findChatBetweenUsers(currentUserId, targetUser.getId());

        if (!existingChats.isEmpty()) {
            return chatMapper.toResponse(existingChats.get(0), currentUserId);
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Поточного користувача не знайдено"));

        Chat newChat = new Chat();
        newChat.getParticipants().add(currentUser);
        newChat.getParticipants().add(targetUser);

        Chat savedChat = chatRepository.save(newChat);

        return chatMapper.toResponse(savedChat, currentUserId);
    }
}