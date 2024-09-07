package com.TWOvALL.earthquake.service;

import com.TWOvALL.earthquake.model.User;
import com.TWOvALL.earthquake.repository.UserRepository;
import com.TWOvALL.earthquake.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Register a new user with the provided role.
     * Encrypt the password and store user details.
     */
    public User register(User user, String role) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(role); // Set user role (SuperAdmin or Official)
        return userRepository.save(user);
    }

    /**
     * Perform login by verifying username and password.
     * Generate JWT if credentials are valid.
     */
    public String login(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            // Generate a JWT token with firstName and lastName using the JwtUtil
            return jwtUtil.generateToken(user.getUsername(), user.getFirstName(), user.getLastName(), Collections.singleton(user.getRole()));
        }
        return null; // Invalid credentials
    }

    /**
     * Find a user by their username.
     */
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}