package com.TWOvALL.earthquake.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(false); // ÖNEMLİ: false olmazsa "*" çalışmaz
        config.setAllowedOrigins(Collections.singletonList("*")); // Her yerden istek kabul et
        config.setAllowedHeaders(Collections.singletonList("*")); // Tüm header'lara izin ver
        config.setAllowedMethods(Collections.singletonList("*")); // Tüm method'lara izin ver

        source.registerCorsConfiguration("/**", config); // Apply to all routes
        return new CorsFilter(source);
    }
}