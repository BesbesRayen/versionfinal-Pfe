package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFinancialProfileRequest {

    @NotNull(message = "Monthly salary is required")
    @DecimalMin(value = "100.0", message = "Monthly salary must be between 100 and 15000 DT")
    @DecimalMax(value = "15000.0", message = "Monthly salary must be between 100 and 15000 DT")
    private Double monthlySalary;

    @NotNull(message = "Salary day is required")
    @Min(value = 1)
    private Integer salaryDay;

    @NotNull(message = "Employment status is required")
    private String employmentStatus;
}
