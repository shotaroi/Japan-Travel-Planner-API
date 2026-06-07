package com.japanplanner.destination;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DestinationController {
    
    @GetMapping("/api/destinations")
    public List<DestinationResponse> getDestinations() {
        return List.of(
            new DestinationResponse("tokyo", "Tokyo", "Modern city with traditional culture"),
            new DestinationResponse("kyoto", "Kyoto", "Temples, shrines, and historic districts"),
            new DestinationResponse("osaka", "Osaka", "Food culture and vibrant nightlife")
        );
    }

    public record DestinationResponse(
        String id, 
        String name,
        String description
    ) {}
}
