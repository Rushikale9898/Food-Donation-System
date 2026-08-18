package com.fooddonation.service.impl;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fooddonation.dto.request.ForgotPasswordRequest;
import com.fooddonation.dto.request.LoginRequest;
import com.fooddonation.dto.request.RegisterRequest;
import com.fooddonation.dto.request.ResetPasswordRequest;
import com.fooddonation.dto.response.AuthResponse;
import com.fooddonation.entity.DeliveryAgentProfile;
import com.fooddonation.entity.DonorProfile;
import com.fooddonation.entity.NgoProfile;
import com.fooddonation.entity.ReceiverProfile;
import com.fooddonation.entity.RefreshToken;
import com.fooddonation.entity.Role;
import com.fooddonation.entity.User;
import com.fooddonation.enums.DonorType;
import com.fooddonation.enums.ReceiverType;
import com.fooddonation.enums.UserStatus;
import com.fooddonation.enums.VehicleType;
import com.fooddonation.exception.BadRequestException;
import com.fooddonation.exception.ConflictException;
import com.fooddonation.exception.ResourceNotFoundException;
import com.fooddonation.exception.UnauthorizedException;
import com.fooddonation.repository.DeliveryAgentProfileRepository;
import com.fooddonation.repository.DonorProfileRepository;
import com.fooddonation.repository.NgoProfileRepository;
import com.fooddonation.repository.ReceiverProfileRepository;
import com.fooddonation.repository.RefreshTokenRepository;
import com.fooddonation.repository.RoleRepository;
import com.fooddonation.repository.UserRepository;
import com.fooddonation.security.jwt.JwtUtils;
import com.fooddonation.service.AuthService;
import com.fooddonation.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final DonorProfileRepository donorProfileRepository;
	private final NgoProfileRepository ngoProfileRepository;
	private final DeliveryAgentProfileRepository agentProfileRepository;
	private final ReceiverProfileRepository receiverProfileRepository; // NEW
	private final AuthenticationManager authenticationManager;
	private final JwtUtils jwtUtils;
	private final PasswordEncoder passwordEncoder;
	private final NotificationService notificationService;

	@Value("${app.jwt.refresh-expiration}")
	private long refreshExpiration;

	@Value("${app.password-reset.expiry-minutes}")
	private int resetExpiryMinutes;

	@Override
	@Transactional
	public AuthResponse register(RegisterRequest request) {

		// ── Duplicate checks ──────────────────────────────────
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new ConflictException("An account with this email already exists");
		}
		if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
			throw new ConflictException("Phone number is already registered");
		}

		// ── Resolve role name ─────────────────────────────────
		String roleName = switch (request.getRole().toUpperCase()) {
		case "DONOR" -> Role.DONOR;
		case "NGO" -> Role.NGO;
		case "DELIVERY_AGENT" -> Role.DELIVERY_AGENT;
		case "RECEIVER" -> Role.RECEIVER; // ← NEW
		default -> throw new BadRequestException("Invalid role. Choose DONOR, NGO, DELIVERY_AGENT, or RECEIVER");
		};

		Role role = roleRepository.findByName(roleName)
				.orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

		// ── Build user ────────────────────────────────────────
		// Donors and Receivers are activated immediately.
		// NGO and Delivery Agents remain PENDING until admin approves.
		UserStatus initialStatus = (roleName.equals(Role.DONOR) || roleName.equals(Role.RECEIVER)) ? UserStatus.ACTIVE
				: UserStatus.PENDING;

		User user = User.builder().fullName(request.getFullName()).email(request.getEmail()).phone(request.getPhone())
				.password(passwordEncoder.encode(request.getPassword())).city(request.getCity())
				.state(request.getState()).address(request.getAddress()).status(initialStatus).emailVerified(false)
				.emailVerifyToken(UUID.randomUUID().toString()).build();

		user.getRoles().add(role);
		User savedUser = userRepository.save(user);

		// ── Create role-specific profile ──────────────────────
		createRoleProfile(savedUser, request, roleName);

		log.info("New user registered: {} with role: {}", request.getEmail(), roleName);

		// ── Generate tokens and return ────────────────────────
		String accessToken = jwtUtils.generateToken(savedUser);
		String refreshTokenStr = createRefreshToken(savedUser);

		return buildAuthResponse(savedUser, accessToken, refreshTokenStr);
	}

	@Override
	@Transactional
	public AuthResponse login(LoginRequest request) {
		Authentication authentication = authenticationManager
				.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

		User user = (User) authentication.getPrincipal();

		if (user.getStatus() == UserStatus.BLOCKED) {
			throw new UnauthorizedException("Your account has been blocked. Please contact support.");
		}

		user.setLastLogin(LocalDateTime.now());
		userRepository.save(user);

		String accessToken = jwtUtils.generateToken(user);
		String refreshTokenStr = createRefreshToken(user);

		log.info("User logged in: {}", user.getEmail());
		return buildAuthResponse(user, accessToken, refreshTokenStr);
	}

	@Override
	@Transactional
	public AuthResponse refreshToken(String tokenStr) {
		RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenStr)
				.orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

		if (refreshToken.getRevoked() || refreshToken.isExpired()) {
			throw new UnauthorizedException("Refresh token is expired or revoked. Please login again.");
		}

		User user = refreshToken.getUser();
		String newAccessToken = jwtUtils.generateToken(user);

		return buildAuthResponse(user, newAccessToken, tokenStr);
	}

	@Override
	@Transactional
	public void logout(String token) {
		String email = jwtUtils.extractEmail(token);
		userRepository.findByEmail(email).ifPresent(user -> refreshTokenRepository.revokeAllByUserId(user.getId()));
		log.info("User logged out: {}", email);
	}

	@Override
	@Transactional
	public void forgotPassword(ForgotPasswordRequest request) {
		User user = userRepository.findByEmail(request.getEmail())
				.orElseThrow(() -> new ResourceNotFoundException("No account found with this email"));

		String resetToken = UUID.randomUUID().toString();
		user.setPasswordResetToken(resetToken);
		user.setPasswordResetExpiry(LocalDateTime.now().plusMinutes(resetExpiryMinutes));
		userRepository.save(user);

		// TODO: Send email with reset link
		log.info("Password reset requested for: {}", request.getEmail());
	}

	@Override
	@Transactional
	public void resetPassword(ResetPasswordRequest request) {
		User user = userRepository.findByPasswordResetToken(request.getToken())
				.orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

		if (user.getPasswordResetExpiry() == null || LocalDateTime.now().isAfter(user.getPasswordResetExpiry())) {
			throw new BadRequestException("Reset token has expired. Please request a new one.");
		}

		user.setPassword(passwordEncoder.encode(request.getNewPassword()));
		user.setPasswordResetToken(null);
		user.setPasswordResetExpiry(null);
		userRepository.save(user);

		refreshTokenRepository.revokeAllByUserId(user.getId());
		log.info("Password reset successful for: {}", user.getEmail());
	}

	@Override
	@Transactional
	public void verifyEmail(String token) {
		User user = userRepository.findByEmailVerifyToken(token)
				.orElseThrow(() -> new BadRequestException("Invalid email verification token"));

		user.setEmailVerified(true);
		user.setEmailVerifyToken(null);
		if (user.getStatus() == UserStatus.PENDING) {
			user.setStatus(UserStatus.ACTIVE);
		}
		userRepository.save(user);
	}

	// ─────────────────────────────────────────────────────────
	// PRIVATE HELPERS
	// ─────────────────────────────────────────────────────────

	private void createRoleProfile(User user, RegisterRequest request, String roleName) {
		switch (roleName) {

		case Role.DONOR -> {
			DonorProfile profile = DonorProfile.builder().user(user)
					.donorType(request.getDonorType() != null ? request.getDonorType() : DonorType.INDIVIDUAL)
					.organization(request.getOrganization()).totalDonated(0).build();
			donorProfileRepository.save(profile);
		}

		case Role.NGO -> {
			if (request.getOrganizationName() == null || request.getOrganizationName().isBlank()) {
				throw new BadRequestException("Organization name is required for NGO registration");
			}
			NgoProfile profile = NgoProfile.builder().user(user).organizationName(request.getOrganizationName())
					.registrationNumber(request.getRegistrationNumber()).description(request.getDescription())
					.verified(false).build();
			ngoProfileRepository.save(profile);
		}

		case Role.DELIVERY_AGENT -> {
			VehicleType vehicleType = VehicleType.BIKE;
			if (request.getVehicleType() != null) {
				vehicleType = request.getVehicleType(); // already a VehicleType enum
			}
			DeliveryAgentProfile profile = DeliveryAgentProfile.builder().user(user).vehicleType(vehicleType)
					.vehicleNumber(request.getVehicleNumber()).isAvailable(true).totalDeliveries(0).build();
			agentProfileRepository.save(profile);
		}

		// ── NEW: Receiver ─────────────────────────────────
		case Role.RECEIVER -> {
			ReceiverType receiverType = ReceiverType.INDIVIDUAL;
			if (request.getReceiverType() != null) {
				receiverType = request.getReceiverType(); // already a ReceiverType enum
			}
			ReceiverProfile profile = ReceiverProfile.builder().user(user).receiverType(receiverType)
					.familySize(request.getFamilySize()).specialNeeds(request.getSpecialNeeds())
					.idProofType(request.getIdProofType()).idProofNumber(request.getIdProofNumber()).isVerified(false)
					.totalReceived(0).build();
			receiverProfileRepository.save(profile);
			log.info("Receiver profile created for user: {}", user.getEmail());
		}

		default -> log.warn("No profile creation logic for role: {}", roleName);
		}
	}

	private String createRefreshToken(User user) {
		refreshTokenRepository.revokeAllByUserId(user.getId());
		RefreshToken token = RefreshToken.builder().user(user).token(UUID.randomUUID().toString())
				.expiryDate(LocalDateTime.now().plusSeconds(refreshExpiration / 1000)).revoked(false).build();
		return refreshTokenRepository.save(token).getToken();
	}

	private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
		return AuthResponse.builder().accessToken(accessToken).refreshToken(refreshToken).tokenType("Bearer")
				.userId(user.getId()).email(user.getEmail()).fullName(user.getFullName())
				.profileImage(user.getProfileImage())
				.roles(user.getAuthorities().stream().map(a -> a.getAuthority()).collect(Collectors.toList()))
				.status(user.getStatus().name()).build();
	}
}
