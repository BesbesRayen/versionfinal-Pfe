package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.EmploymentStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialProfileRequest {

    @NotNull
    @DecimalMin(value = "100.00", message = "Monthly salary must be between 100 and 15000 DT")
    @DecimalMax(value = "15000.00", message = "Monthly salary must be between 100 and 15000 DT")
    private BigDecimal monthlySalary;

    @NotNull
    @Min(1)
    @Max(31)
    private Integer salaryDay;

    @NotNull
    private EmploymentStatus employmentStatus;
}
