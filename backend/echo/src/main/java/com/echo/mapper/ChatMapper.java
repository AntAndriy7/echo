package com.echo.mapper;

import com.echo.dto.chat.ChatResponse;
import com.echo.entity.Chat;
import com.echo.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.LocalDateTime;

@Mapper(componentModel = "spring")
public interface ChatMapper {

    @Mapping(target = "id", source = "chat.id")
    @Mapping(target = "username", source = "interlocutor.username")
    @Mapping(target = "avatarUrl", source = "interlocutor.avatarUrl")
    ChatResponse toResponse(Chat chat, User interlocutor, String lastMessage, int unreadCount, LocalDateTime lastMessageAt);
}