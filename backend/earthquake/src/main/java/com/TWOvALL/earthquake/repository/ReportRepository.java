package com.TWOvALL.earthquake.repository;

import com.TWOvALL.earthquake.model.Report;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface ReportRepository extends MongoRepository<Report, String> {
    List<Report> findAllByAddress(String address);
}