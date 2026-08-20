package com.echo.mapper;

import com.echo.dto.user.UserResponse;
import com.echo.dto.user.UpdateProfileRequest;
import com.echo.entity.User;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDto(UpdateProfileRequest dto, @MappingTarget User user);
}