package com.echo.repository;

import com.echo.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    Page<Message> findByChatIdOrderByCreatedAtDesc(UUID chatId, Pageable pageable);
    Optional<Message> findFirstByChatIdOrderByCreatedAtDesc(UUID chatId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.chat.id = :chatId AND m.sender.id != :userId AND m.isRead = false")
    int countUnreadMessages(@Param("chatId") UUID chatId, @Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.chat.id = :chatId AND m.sender.id != :userId AND m.isRead = false")
    int markAllAsRead(@Param("chatId") UUID chatId, @Param("userId") UUID userId);

    @Query("SELECT COUNT(m) > 0 FROM Message m JOIN m.chat c JOIN c.participants p WHERE p.id = :userId AND m.sender.id != :userId AND m.isRead = false")
    boolean existsUnreadMessagesForUser(@Param("userId") UUID userId);
}