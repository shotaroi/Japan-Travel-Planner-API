package com.japanplanner;

import org.springframework.boot.SpringApplication;

public class TestJapanTravelPlannerApplication {

	public static void main(String[] args) {
		SpringApplication.from(JapanTravelPlannerApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
