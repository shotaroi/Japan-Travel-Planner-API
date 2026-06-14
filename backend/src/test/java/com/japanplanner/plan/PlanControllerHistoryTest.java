package com.japanplanner.plan;

import com.japanplanner.common.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
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
    void getPlanHistory_returnsPaginatedSavedPlans() throws Exception {
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

        given(tripPlanRepository.findAll(any(Pageable.class)))
                .willReturn(new PageImpl<>(List.of(tokyo, kyoto), PageRequest.of(0, 10), 2));

        mockMvc.perform(get("/api/plan?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].destination").value("tokyo"))
                .andExpect(jsonPath("$.content[0].days").value(3))
                .andExpect(jsonPath("$.content[0].createdAt").exists())
                .andExpect(jsonPath("$.content[1].id").value(2))
                .andExpect(jsonPath("$.content[1].destination").value("kyoto"))
                .andExpect(jsonPath("$.content[1].days").value(2))
                .andExpect(jsonPath("$.content[1].createdAt").exists())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(true));
    }

    @Test
    void getPlanHistory_whenPageAndSizeOutOfRange_appliesSafeBounds() throws Exception {
        given(tripPlanRepository.findAll(any(Pageable.class)))
                .willReturn(new PageImpl<>(List.of(), PageRequest.of(0, 100), 0));

        mockMvc.perform(get("/api/plan?page=-5&size=999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(100));
        
        verify(tripPlanRepository).findAll(org.mockito.ArgumentMatchers.<Pageable>argThat(pageable -> 
            pageable.getPageNumber() == 0
                && pageable.getPageSize() == 100
                && pageable.getSort().equals(
                    org.springframework.data.domain.Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("id")
                    ))
                )
        );
    }
}