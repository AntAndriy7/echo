package com.echo.repository;

import com.echo.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    Page<Post> findByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);
    Page<Post> findByAuthorIdAndDeletedAtIsNull(UUID authorId, Pageable pageable);
}