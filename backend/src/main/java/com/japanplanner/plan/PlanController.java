package com.japanplanner.plan;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/plan")
@RequiredArgsConstructor // This annotation is used to create a constructor with required arguments
public class PlanController {

    private final TripPlanRepository tripPlanRepository;
    
    @PostMapping
    public PlanResponse createPlan(@Valid @RequestBody PlanRequest request) {
        TripPlanEntity entity = new TripPlanEntity();
        entity.setDestination(request.destination());
        entity.setDays(request.days());
        tripPlanRepository.save(entity);

        List<DayPlan> days = new ArrayList<>();

        for (int day = 1; day <= request.days(); day++) {
            days.add(new DayPlan( 
                day,
                "Explore " + request.destination() + " - Day " + day,
                List.of("Morning: sightseeing", "Afternoon: local food", "Evening: free time") 
            ));
        }

        return new PlanResponse(request.destination(), request.days(), days);
    }

    @GetMapping
    public List<PlanSummaryResponse> getPlanHistory() {
        return tripPlanRepository.findAll()
        .stream()
        .map(plan -> new PlanSummaryResponse(
            plan.getId(),
            plan.getDestination(),
            plan.getDays(),
            plan.getCreatedAt().toString()
        ))
        .toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlan(@PathVariable Long id) {
        if (!tripPlanRepository.existsById(id)) {
            throw new PlanNotFoundException(id);
        }
        tripPlanRepository.deleteById(id);
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

    public record PlanSummaryResponse(
        Long id,
        String destination,
        int days,
        String createdAt
    ) {}
}
