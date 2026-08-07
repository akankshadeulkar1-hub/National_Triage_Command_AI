package com.triage.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    // 256-bit Secret Key for HMAC-SHA256 signing
    private static final String SECRET = "NationalTriageCommandSecretKeyForJWTRoleBasedAccessControl2026";
    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());
    private static final long EXPIRATION_TIME_MS = 86400000; // 24 Hours

    /**
     * Generates a signed JWT embedding the user's role (e.g. ROLE_ADMIN or ROLE_PARAMEDIC) as a custom claim.
     */
    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        // Standardize role prefix if missing
        String formattedRole = role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();
        claims.put("role", formattedRole);
        claims.put("sub", username);
        claims.put("iss", "NationalTriageCommandAI");

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME_MS))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Parses and extracts claims from a JWT token.
     */
    public Claims extractAllClaims(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Extracts the user role custom claim from JWT.
     */
    public String extractRole(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get("role", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Validates if the token is non-expired and valid.
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
