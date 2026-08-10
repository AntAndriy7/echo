package com.echo.repository;

import com.echo.dto.follow.FollowUserResponse;
import com.echo.entity.Follow;
import com.echo.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FollowRepository extends JpaRepository<Follow, UUID> {

    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    Optional<Follow> findByFollowerAndFollowing(User follower, User following);

    @Query("""
        SELECT new com.echo.dto.follow.FollowUserResponse(
            u.id,
            u.username,
            u.avatarUrl,
            u.email,
            CASE WHEN EXISTS (
                SELECT 1 FROM Follow f2 WHERE f2.follower.id = :currentUserId AND f2.following.id = u.id
            ) THEN true ELSE false END
        )
        FROM Follow f
        JOIN f.following u
        WHERE f.follower.id = :userId
    """)
    Page<FollowUserResponse> findFollowingWithStatus(
            @Param("userId") UUID userId,
            @Param("currentUserId") UUID currentUserId,
            Pageable pageable);

    @Query("""
        SELECT new com.echo.dto.follow.FollowUserResponse(
            u.id,
            u.username,
            u.avatarUrl,
            u.email,
            CASE WHEN EXISTS (
                SELECT 1 FROM Follow f2 WHERE f2.follower.id = :currentUserId AND f2.following.id = u.id
            ) THEN true ELSE false END
        )
        FROM Follow f
        JOIN f.follower u
        WHERE f.following.id = :userId
    """)
    Page<FollowUserResponse> findFollowersWithStatus(
            @Param("userId") UUID userId,
            @Param("currentUserId") UUID currentUserId,
            Pageable pageable);
}