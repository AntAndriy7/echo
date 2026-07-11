package com.echo.service;

import com.echo.dto.post.PostResponse;
import com.echo.dto.post.PostCreateRequest;
import com.echo.dto.post.PostUpdateRequest;
import com.echo.entity.Post;
import com.echo.entity.PostLike;
import com.echo.entity.User;
import com.echo.mapper.PostMapper;
import com.echo.repository.PostLikeRepository;
import com.echo.repository.PostRepository;
import com.echo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;
    private final PostMapper postMapper;

    @Transactional(readOnly = true)
    public Page<PostResponse> getPostsByUsername(String username, Pageable pageable, UUID currentUserId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Користувача '" + username + "' не знайдено"));

        Page<Post> posts = postRepository.findByAuthorIdAndDeletedAtIsNull(user.getId(), pageable);

        return posts.map(post -> mapToResponseWithLikes(post, currentUserId));
    }

    @Transactional
    public PostResponse createPost(PostCreateRequest request, UUID authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

        Post post = Post.builder()
                .content(request.content())
                .author(author)
                .build();

        post = postRepository.save(post);
        return mapToResponseWithLikes(post, authorId);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getFeed(int page, int size, UUID currentUserId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository.findByDeletedAtIsNullOrderByCreatedAtDesc(pageable);

        return posts.map(post -> mapToResponseWithLikes(post, currentUserId));
    }

    @Transactional
    public void toggleLike(UUID postId, UUID currentUserId) {
        boolean alreadyLiked = postLikeRepository.existsByPostIdAndUserId(postId, currentUserId);

        if (alreadyLiked) {
            postLikeRepository.deleteByPostIdAndUserId(postId, currentUserId);
        } else {
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Пост не знайдено"));
            User user = userRepository.getReferenceById(currentUserId);

            PostLike like = PostLike.builder()
                    .post(post)
                    .user(user)
                    .build();
            postLikeRepository.save(like);
        }
    }

    @Transactional
    public void deletePost(UUID postId, UUID currentUserId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Пост не знайдено"));

        if (!post.getAuthor().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Ви можете видаляти лише власні пости");
        }

        postRepository.delete(post);
    }

    @Transactional
    public PostResponse updatePost(UUID postId, PostUpdateRequest request, UUID currentUserId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Пост не знайдено"));

        if (!post.getAuthor().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Ви можете редагувати лише власні пости");
        }

        post.setContent(request.content());
        post.setIsEdited(true);

        Post updatedPost = postRepository.save(post);
        return postMapper.toResponse(updatedPost);
    }

    private PostResponse mapToResponseWithLikes(Post post, UUID currentUserId) {
        PostResponse baseResponse = postMapper.toResponse(post);

        long likesCount = postLikeRepository.countByPostId(post.getId());
        boolean isLiked = postLikeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);

        return new PostResponse(
                baseResponse.id(),
                baseResponse.author(),
                baseResponse.content(),
                baseResponse.isEdited(),
                baseResponse.createdAt(),
                likesCount,
                isLiked
        );
    }
}