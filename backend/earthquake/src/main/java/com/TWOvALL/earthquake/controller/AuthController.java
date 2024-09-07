package com.TWOvALL.earthquake.controller;

import com.TWOvALL.earthquake.model.User;
import com.TWOvALL.earthquake.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        return ResponseEntity.ok(userService.register(user, "OFFICIAL")); // Register users with Official role
    }

    @PostMapping("/registerSuperAdmin")
    public ResponseEntity<?> registerSuperAdmin(@RequestBody User user) {
        return ResponseEntity.ok(userService.register(user, "SUPERADMIN")); // For SuperAdmin registration
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        String token = userService.login(user.getUsername(), user.getPassword());
        if (token != null) {
            return ResponseEntity.ok(token); // Return JWT token
        } else {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }
}