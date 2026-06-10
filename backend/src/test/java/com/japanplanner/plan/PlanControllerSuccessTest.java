package com.japanplanner.plan;

import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.japanplanner.common.GlobalExceptionHandler;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PlanController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PlanControllerSuccessTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TripPlanRepository tripPlanRepository;

    @Test
    void createPlan_whenValidRequest_returnsItineraryAndSavesEntity() throws Exception {
        TripPlanEntity saved = new TripPlanEntity();
        saved.setDestination("tokyo");
        saved.setDays(3);
        given(tripPlanRepository.save(any(TripPlanEntity.class))).willReturn(saved);
    
        String body = """
                {
                    "destination": "tokyo",
                    "days":3
                }            
                """;

        mockMvc.perform(post("/api/plan")
        .contentType(APPLICATION_JSON)
        .content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.desination").value("tokyo"))
        .andExpect(jsonPath("$.days").value(3))
        .andExpect(jsonPath("$.itinerary.length()").value(3))
        .andExpect(jsonPath("$.itinerary[0].day").value(1));
        
        verify(tripPlanRepository).save(any(TripPlanEntity.class));
    }
}
