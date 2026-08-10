package com.echo.service;

import com.echo.dto.follow.FollowUserResponse;
import com.echo.entity.Follow;
import com.echo.entity.User;
import com.echo.repository.FollowRepository;
import com.echo.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    @Transactional
    public void toggleFollow(UUID currentUserId, UUID targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Ви не можете підписатися самі на себе");
        }

        User follower = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Користувача не знайдено"));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new EntityNotFoundException("Цільового користувача не знайдено"));

        Optional<Follow> existingFollow = followRepository.findByFollowerAndFollowing(follower, targetUser);

        if (existingFollow.isPresent()) {
            followRepository.delete(existingFollow.get());
            follower.setFollowingCount(Math.max(0, follower.getFollowingCount() - 1));
            targetUser.setFollowersCount(Math.max(0, targetUser.getFollowersCount() - 1));
        } else {
            Follow newFollow = Follow.builder()
                    .follower(follower)
                    .following(targetUser)
                    .build();
            followRepository.save(newFollow);
            follower.setFollowingCount(follower.getFollowingCount() + 1);
            targetUser.setFollowersCount(targetUser.getFollowersCount() + 1);
        }

        userRepository.save(follower);
        userRepository.save(targetUser);
    }

    @Transactional(readOnly = true)
    public Page<FollowUserResponse> getFollowers(UUID userId, UUID currentUserId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return followRepository.findFollowersWithStatus(userId, currentUserId, pageRequest);
    }

    @Transactional(readOnly = true)
    public Page<FollowUserResponse> getFollowing(UUID userId, UUID currentUserId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return followRepository.findFollowingWithStatus(userId, currentUserId, pageRequest);
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(UUID currentUserId, UUID targetUserId) {
        return followRepository.existsByFollowerIdAndFollowingId(currentUserId, targetUserId);
    }
}