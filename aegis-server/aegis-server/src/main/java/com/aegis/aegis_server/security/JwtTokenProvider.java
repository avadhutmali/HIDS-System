package com.aegis.aegis_server.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtTokenProvider(
            @Value("${aegis.jwt.secret}") String secret,
            @Value("${aegis.jwt.expiration-ms}") long accessExpirationMs,
            @Value("${aegis.jwt.refresh-expiration-ms}") long refreshExpirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    /**
     * Generate an access JWT for a device agent.
     */
    public String generateAgentToken(UUID deviceId) {
        return Jwts.builder()
                .subject(deviceId.toString())
                .claim("type", "AGENT")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpirationMs))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Generate a refresh token for a device agent.
     */
    public String generateAgentRefreshToken(UUID deviceId) {
        return Jwts.builder()
                .subject(deviceId.toString())
                .claim("type", "AGENT_REFRESH")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpirationMs))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Generate an access JWT for an admin user.
     */
    public String generateAdminToken(String username, String role) {
        return Jwts.builder()
                .subject(username)
                .claim("type", "ADMIN")
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpirationMs))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Validate and parse a JWT token.
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Check if a token is valid (not expired, properly signed).
     */
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Extract the subject (deviceId or username) from a token.
     */
    public String getSubject(String token) {
        return parseToken(token).getSubject();
    }

    /**
     * Extract the token type (AGENT, ADMIN, AGENT_REFRESH).
     */
    public String getTokenType(String token) {
        return parseToken(token).get("type", String.class);
    }

    /**
     * Extract role from admin token.
     */
    public String getRole(String token) {
        return parseToken(token).get("role", String.class);
    }

    public long getAccessExpirationMs() {
        return accessExpirationMs;
    }
}
