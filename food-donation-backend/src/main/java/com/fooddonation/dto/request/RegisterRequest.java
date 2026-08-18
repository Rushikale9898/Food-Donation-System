package com.fooddonation.dto.request;

import com.fooddonation.enums.DonorType;
import com.fooddonation.enums.ReceiverType;
import com.fooddonation.enums.VehicleType;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

	@NotBlank(message = "Full name is required")
	@Size(min = 2, max = 100, message = "Full name must be 2-100 characters")
	private String fullName;

	@NotBlank(message = "Email is required")
	@Email(message = "Invalid email format")
	private String email;

	@NotBlank(message = "Password is required")
	@Size(min = 8, max = 50, message = "Password must be 8-50 characters")
	@Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$", message = "Password must contain uppercase, lowercase, digit and special character")
	private String password;

	@NotBlank(message = "Phone is required")
	@Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian phone number")
	private String phone;

	@NotBlank(message = "Role is required")
	private String role;

	private String city;
	private String state;
	private String address;

	// For NGO
	private String organizationName;
	private String registrationNumber;
	private String description;
	private Integer foodCapacity;
	private String serviceArea;

	// For Donor
	private DonorType donorType;
	private String organization;
	private String fssaiNumber;

	// For Delivery Agent
	private VehicleType vehicleType;
	private String vehicleNumber;
	private String licenseNumber;

	// ── Receiver fields ───────────────────────────────────────
	private ReceiverType receiverType; // INDIVIDUAL | FAMILY | ORPHANAGE | OLD_AGE_HOME | SHELTER | OTHER
	private Integer familySize;
	private String specialNeeds;
	private String idProofType;
	private String idProofNumber;

}
