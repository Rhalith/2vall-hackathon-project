package com.TWOvALL.earthquake;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EarthquakeApplication {
	public static void main(String[] args) {
		SpringApplication.run(EarthquakeApplication.class, args);
	}
}
