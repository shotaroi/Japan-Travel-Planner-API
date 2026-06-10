package com.japanplanner.plan;

import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import com.japanplanner.common.GlobalExceptionHandler;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PlanController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PlanControllerValidation {
    
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TripPlanRepository tripPlanRepository;

    @Test
    void createPlan_whenDaysLessThanOne_returnsBadRequest() throws Exception {
        String body = """
                {
                    "destination": "tokyo",
                    "days": 0
                }
                """;
        
                mockMvc.perform(post("/api/plan")
                    .contentType(APPLICATION_JSON)
                    .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.days").value("days must be at least 1"));
    }

    @Test
    void createPlan_whenDaysGreaterThanFourteen_returnsBadRequest() throws Exception {
        String body = """
                {
                    "destination": "tokyo",
                    "days": 15
                }
                """;
        
        mockMvc.perform(post("/api/plan")
        .contentType(APPLICATION_JSON)
        .content(body))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.fieldErrors.days").value("days must be at most 14"));
    }
}
