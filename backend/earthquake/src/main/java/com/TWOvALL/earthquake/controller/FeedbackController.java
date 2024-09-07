package com.TWOvALL.earthquake.controller;

import com.TWOvALL.earthquake.model.Feedback;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private AtomicInteger interactionCounter = new AtomicInteger(1); // Counter for interaction IDs

    @PostMapping("/submit")
    public ResponseEntity<String> submitFeedback(@RequestBody Feedback feedback) {
        // Ensure contentGenerated and userFeedback are not null
        if (feedback.getContentGenerated() == null || feedback.getUserFeedback() == null) {
            return ResponseEntity.badRequest().body("Invalid feedback structure: contentGenerated or userFeedback is null.");
        }

        // Set the timestamp when the feedback is submitted
        feedback.setTimestamp(LocalDateTime.now());

        // Increment interactionId
        feedback.setInteractionId(String.valueOf(interactionCounter.getAndIncrement()));

        // Get input prompt and response from contentGenerated
        String inputPrompt = feedback.getContentGenerated().get("input_prompt");
        String response = feedback.getContentGenerated().get("response");

        // Get rating and feedback text from userFeedback
        String rating = feedback.getUserFeedback().get("rating");
        String feedbackText = feedback.getUserFeedback().get("feedback_text");
        String preferredResponse = feedback.getUserFeedback().get("preferred_response");


        System.out.println("Feedback received: " + rating);
        try (FileWriter file = new FileWriter("feedback.json", true)) {
            // Write feedback data to a JSON file
            file.write("{\n");
            file.write("\"interactionId\": \"" + feedback.getInteractionId() + "\",\n");
            file.write("\"userId\": \"" + feedback.getUserId() + "\",\n");
            file.write("\"timestamp\": \"" + feedback.getTimestamp() + "\",\n");
            file.write("\"input_prompt\": \"" + inputPrompt + "\",\n");
            file.write("\"response\": \"" + response + "\",\n");
            file.write("\"rating\": \"" + rating + "\",\n");
            file.write("\"feedbackText\": \"" + feedbackText + "\",\n");
            file.write("\"preferredResponse\": \"" + preferredResponse + "\",\n");
            file.write("\"device\": \"" + feedback.getDevice() + "\",\n");
            file.write("\"location\": \"" + feedback.getLocation() + "\",\n");
            file.write("\"sessionDuration\": " + feedback.getSessionDuration() + "\n");
            file.write("},\n");
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Error saving feedback: " + e.getMessage());
        }

        return ResponseEntity.ok("Feedback submitted successfully.");
    }
}