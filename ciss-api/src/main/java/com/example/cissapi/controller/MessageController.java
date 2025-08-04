package com.example.cissapi.controller;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MessageController {
    private final StringRedisTemplate redisTemplate;

    public MessageController(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/health")
    public String health() {
        return "ciss-api";
    }

    @PostMapping("/enqueue")
    public void enqueue(@RequestBody String message) {
        redisTemplate.opsForList().leftPush("ciss:queue", message);
    }
}