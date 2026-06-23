package com.japanplanner.plan;

import java.time.Instant;
import java.util.Optional;

import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.japanplanner.common.GlobalExceptionHandler;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PlanController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PlanControllerPatchTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TripPlanRepository tripPlanRepository;

    @Test
    void updatePlanDays_whenValidRequest_returnsUpdatedSummary() throws Exception {
        TripPlanEntity existing = new TripPlanEntity();
        existing.setDestination("tokyo");
        existing.setDays(3);
        ReflectionTestUtils.setField(existing, "id", 10L);
        ReflectionTestUtils.setField(existing, "createdAt", Instant.parse("2026-01-01T10:00:00Z"));

        TripPlanEntity saved = new TripPlanEntity();
        saved.setDestination("tokyo");
        saved.setDays(5);
        ReflectionTestUtils.setField(saved, "id", 10L);
        ReflectionTestUtils.setField(saved, "createdAt", Instant.parse("2026-01-01T10:00:00Z"));

        given(tripPlanRepository.findById(10L)).willReturn(Optional.of(existing));
        given(tripPlanRepository.save(any(TripPlanEntity.class))).willReturn(saved);

        String body = """
                {
                    "days": 5
                }
                """;

        mockMvc.perform(patch("/api/plan/{id}", 10L)
                .contentType(APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(10))
            .andExpect(jsonPath("$.destination").value("tokyo"))
            .andExpect(jsonPath("$.days").value(5))
            .andExpect(jsonPath("$.createdAt").value("2026-01-01T10:00:00Z"));

        verify(tripPlanRepository).findById(10L);
        verify(tripPlanRepository).save(any(TripPlanEntity.class));
    }

    @Test
    void updatePlanDays_whenPlanNotFound_returns404() throws Exception {
        given(tripPlanRepository.findById(999L)).willReturn(Optional.empty());

        String body = """
                {
                    "days": 5
                }
                """;

        mockMvc.perform(patch("/api/plan/{id}", 999L)
                .contentType(APPLICATION_JSON)
                .content(body))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.message").value("Plan not found: 999"));

        verify(tripPlanRepository).findById(999L);
        verify(tripPlanRepository, never()).save(any(TripPlanEntity.class));
    }

    @Test
    void updatePlanDays_whenDaysInvalid_returns400() throws Exception {
        String body = """
                {
                    "days": 0
                }
                """;

        mockMvc.perform(patch("/api/plan/{id}", 10L)
            .contentType(APPLICATION_JSON)
            .content(body))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.fieldErrors.days").value("days must be at least 1"));

        verify(tripPlanRepository, never()).findById(any(Long.class));
        verify(tripPlanRepository, never()).save(any(TripPlanEntity.class));
    }
    
}
