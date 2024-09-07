package com.TWOvALL.earthquake.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
public class Feedback {
    private String interactionId;
    private String userId;
    private LocalDateTime timestamp;
    private String rating;
    private String feedbackText;
    private String preferredResponse;
    private String device;
    private String location;
    private int sessionDuration;

    private Map<String, String> contentGenerated; // Holds input_prompt and response
    private Map<String, String> userFeedback;     // Holds rating, feedback_text, preferred_response
}