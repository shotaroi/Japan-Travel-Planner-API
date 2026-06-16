package com.japanplanner.common;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.japanplanner.plan.PlanNotFoundException;

import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice // This annotation is used to handle exceptions globally across all controllers
public class GlobalExceptionHandler {
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>(); // LinkedHashMap is used to maintain the order of the fields

        ex.getBindingResult().getFieldErrors().forEach(error -> {
            String field = error.getField();
            String message = error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value";
            fieldErrors.put(field, message);
        });

        return new ValidationErrorResponse(
            Instant.now().toString(),
            400,
            "Validation failed",
            fieldErrors
        );
    }

    @ExceptionHandler(PlanNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiErrorResponse handlePlanNotFound(PlanNotFoundException ex) {
        return new ApiErrorResponse(Instant.now().toString(), 404, ex.getMessage());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleConstraintViolation(ConstraintViolationException ex) {
        return new ApiErrorResponse(
            Instant.now().toString(),
            400,
            ex.getMessage()
            );
    }

    public record ValidationErrorResponse(
        String timestamp,
        int status,
        String message,
        Map<String, String> fieldErros
    ) {}

    public record ApiErrorResponse(
        String timestamp,
        int status, 
        String message
    ) {}
}
