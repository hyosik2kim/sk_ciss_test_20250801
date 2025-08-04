package com.example.cissserver.controller;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class QueueController {
    private final StringRedisTemplate redisTemplate;

    public QueueController(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/health")
    public String health() {
        return "ciss-server";
    }

    @GetMapping("/dequeue")
    public String dequeue() {
        return redisTemplate.opsForList().rightPop("ciss:queue");
    }
}