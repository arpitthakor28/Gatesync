package com.societysync.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.societysync.repository")
@EnableMongoRepositories(basePackages = "com.societysync.mongo.repository")
public class DataConfig {
}
