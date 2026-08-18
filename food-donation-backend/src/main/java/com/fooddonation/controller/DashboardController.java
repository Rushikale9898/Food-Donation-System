package com.fooddonation.controller;

import com.fooddonation.dto.response.ApiResponse;
import com.fooddonation.dto.response.DashboardStatsResponse;
import com.fooddonation.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Role-specific dashboard statistics")
public class DashboardController {

	private final DashboardService dashboardService;

	@GetMapping("/admin")
	@Operation(summary = "Admin dashboard stats")
	public ResponseEntity<ApiResponse<DashboardStatsResponse>> adminDashboard() {
		return ResponseEntity.ok(ApiResponse.success(dashboardService.getAdminDashboard()));
	}

	@GetMapping("/donor")
	@Operation(summary = "Donor dashboard stats — includes regular + direct donations")
	public ResponseEntity<ApiResponse<DashboardStatsResponse>> donorDashboard(Authentication auth) {
		return ResponseEntity.ok(ApiResponse.success(dashboardService.getDonorDashboard(auth.getName())));
	}

	@GetMapping("/ngo")
	@Operation(summary = "NGO dashboard stats")
	public ResponseEntity<ApiResponse<DashboardStatsResponse>> ngoDashboard(Authentication auth) {
		return ResponseEntity.ok(ApiResponse.success(dashboardService.getNgoDashboard(auth.getName())));
	}

	@GetMapping("/agent")
	@Operation(summary = "Delivery agent dashboard stats")
	public ResponseEntity<ApiResponse<DashboardStatsResponse>> agentDashboard(Authentication auth) {
		return ResponseEntity.ok(ApiResponse.success(dashboardService.getAgentDashboard(auth.getName())));
	}

	// ← NEW: receiver dashboard endpoint
	@GetMapping("/receiver")
	@Operation(summary = "Receiver dashboard stats")
	public ResponseEntity<ApiResponse<DashboardStatsResponse>> receiverDashboard(Authentication auth) {
		return ResponseEntity.ok(ApiResponse.success(dashboardService.getReceiverDashboard(auth.getName())));
	}
}
