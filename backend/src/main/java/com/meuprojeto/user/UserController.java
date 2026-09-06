package com.meuprojeto.user;

import com.meuprojeto.user.dto.UpdateProfileRequest;
import com.meuprojeto.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserProfileResponse me(Authentication authentication) {
        User user = userService.findByEmail(authentication.getName());
        return userService.toProfileResponse(user);
    }

    @PutMapping("/me")
    public UserProfileResponse updateMe(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        User user = userService.updateProfile(authentication.getName(), request);
        return userService.toProfileResponse(user);
    }
}
