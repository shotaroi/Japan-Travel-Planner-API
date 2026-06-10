package com.japanplanner.plan;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.japanplanner.common.GlobalExceptionHandler;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PlanController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PlanControllerHistoryTest {
    
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TripPlanRepository tripPlanRepository;
    
    @Test
    void getPlanHistory_returnsSavedPlans() throws Exception {
        TripPlanEntity tokyo = new TripPlanEntity();
        tokyo.setDestination("tokyo");
        tokyo.setDays(3);
        ReflectionTestUtils.setField(tokyo, "id", 1L);
        ReflectionTestUtils.setField(tokyo, "createdAt", LocalDateTime.of(2026, 1, 1, 10, 0));

        TripPlanEntity kyoto = new TripPlanEntity();
        kyoto.setDestination("kyoto");
        kyoto.setDays(2);
        ReflectionTestUtils.setField(kyoto, "id", 2L);
        ReflectionTestUtils.setField(kyoto, "createdAt", LocalDateTime.of(2026, 1, 2, 11, 30));

        given(tripPlanRepository.findAll()).willReturn(List.of(tokyo, kyoto));

        mockMvc.perform(get("/api/plan"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(1))
        .andExpect(jsonPath("$[0].destination").value("tokyo"))
        .andExpect(jsonPath("$[0].days").value(3))
        .andExpect(jsonPath("$[0].createdAt").exists())
        .andExpect(jsonPath("$[1].id").value(2))
        .andExpect(jsonPath("$[1].destination").value("kyoto"))
        .andExpect(jsonPath("$[1].days").value(2))
        .andExpect(jsonPath("$[1].createdAt").exists());
    }
}
