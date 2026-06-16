package com.japanplanner.plan;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.japanplanner.common.GlobalExceptionHandler;

@WebMvcTest(controllers = PlanController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PlanControllerDeleteTest {
    
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TripPlanRepository tripPlanRepository;

    @Test
    void deletePlan_whenIdExists_returnNoContent() throws Exception {
        given(tripPlanRepository.existsById(10L)).willReturn(true);
        
        mockMvc.perform(delete("/api/plan/{id}", 10L))
        .andExpect(status().isNoContent());

        verify(tripPlanRepository).existsById(10L);
        verify(tripPlanRepository).deleteById(10L);
    }

    @Test
    void deletePlan_whenIdDoesNotExist_returnsNotFound() throws Exception {
        given(tripPlanRepository.existsById(999L)).willReturn(false);

        mockMvc.perform(delete("/api/plan/{id}", 999L))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.message").value("Plan not found: 999"));

        verify(tripPlanRepository).existsById(999L);
        verify(tripPlanRepository, never()).deleteById(999L);
    }
}
