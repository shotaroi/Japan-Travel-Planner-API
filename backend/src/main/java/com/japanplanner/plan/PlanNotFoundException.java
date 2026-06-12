package com.japanplanner.plan;

public class PlanNotFoundException extends RuntimeException {
    public PlanNotFoundException(Long id) {
        super("Plan not found: " + id);
    }
}
