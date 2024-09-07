package com.TWOvALL.earthquake.controller;

import com.TWOvALL.earthquake.model.Report;
import com.TWOvALL.earthquake.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports(true));
    }

    @PatchMapping("/updateStatus/{id}")
    public ResponseEntity<Report> updateReportStatus(@PathVariable String id, @RequestBody Map<String, String> statusMap) {
        String newStatus = statusMap.get("newStatus");
        Report updatedReport = reportService.updateReportStatus(id, newStatus);
        return ResponseEntity.ok(updatedReport);
    }
}