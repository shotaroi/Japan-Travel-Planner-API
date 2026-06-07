package com.japanplanner.plan;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/plan")
public class PlanController {
    
    @PostMapping
    public PlanResponse createPlan(@Valid @RequestBody PlanRequest request) {
        List<DayPlan> days = new ArrayList<>();

        for (int day = 1; day <= request.days(); day++) {
            days.add(new DayPlan( 
                day,
                "Explore " + request.destination() + " - Day " + day,
                List.of("Morning: sightseeing", "Afternoon: local food", "Evening: free time") 
            ));
        }

        return new PlanResponse( 
            request.destination(),
            request.days(),
            days
        );
    }

    public record PlanRequest(
        @NotBlank(message = "destination is required")
        String destination,

        @Min(value = 1, message = "days must be at least 1")
        @Max(value = 14, message = "days must be at most 14")
        int days
    ) {}

    public record PlanResponse(
        String destination,
        int days,
        List<DayPlan> itinerary
    ) {}

    public record DayPlan(
        int day,
        String title,
        List<String> activities
    ) {}
}
