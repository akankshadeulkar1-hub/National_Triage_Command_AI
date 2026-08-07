package com.triage.controller;

import com.triage.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class AuthController {

    private final JwtService jwtService;

    @Autowired
    public AuthController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    /**
     * POST /api/auth/login
     * Authenticates user and generates JWT token with embedded role claim (ROLE_ADMIN or ROLE_PARAMEDIC)
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.getOrDefault("username", "paramedic.user");
        String requestedRole = loginRequest.getOrDefault("role", "ROLE_PARAMEDIC");

        // Normalize role
        if (!requestedRole.startsWith("ROLE_")) {
            requestedRole = "ROLE_" + requestedRole.toUpperCase();
        }

        String token = jwtService.generateToken(username, requestedRole);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("tokenType", "Bearer");
        response.put("username", username);
        response.put("role", requestedRole);
        response.put("expiresIn", 86400);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/auth/verify
     * Validates JWT token and returns claims payload
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.put("valid", false);
            response.put("message", "Missing or invalid Authorization header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        String token = authHeader.substring(7);
        if (jwtService.validateToken(token)) {
            String role = jwtService.extractRole(token);
            String username = jwtService.extractAllClaims(token).getSubject();

            response.put("valid", true);
            response.put("username", username);
            response.put("role", role);
            return ResponseEntity.ok(response);
        } else {
            response.put("valid", false);
            response.put("message", "JWT token expired or invalid signature");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
}
