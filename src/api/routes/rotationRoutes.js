const express = require("express");
const router = express.Router();
const rotationService = require("../../services/rotationService");
const RotationLog = require("../../models/RotationLog");
const RotationSchedule = require("../../models/RotationSchedule");
const SecretVault = require("../../models/SecretVault");
const logger = require("../../utils/logger");
const { v4: uuidv4 } = require("uuid");

// ===== MIDDLEWARE =====

const validateRequest = (req, res, next) => {
  if (!req.body.secretName) {
    return res.status(400).json({ error: "secretName is required" });
  }
  next();
};

const errorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    logger.error("Route error:", err);
    res.status(500).json({ error: err.message });
  });
};

// ===== MANUAL ROTATION ENDPOINTS =====

/**
 * POST /api/rotations/manual
 * Trigger manual secret rotation
 */
router.post(
  "/manual",
  validateRequest,
  errorHandler(async (req, res) => {
    const { secretName } = req.body;

    // Check if secret exists
    const secret = await SecretVault.findOne({ secretName });
    if (!secret) {
      return res.status(404).json({ error: `Secret '${secretName}' not found` });
    }

    // Check if rotation is already in progress
    if (secret.status === "rotating") {
      return res.status(409).json({ error: "Rotation already in progress for this secret" });
    }

    try {
      const result = await rotationService.initiateZeroDowntimeRotation(secretName, "api");
      logger.info(`Manual rotation initiated for secret: ${secretName}`);
      return res.status(200).json({
        success: true,
        message: "Manual rotation initiated",
        rotation: result,
      });
    } catch (error) {
      logger.error(`Failed to initiate rotation for ${secretName}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

/**
 * GET /api/rotations/status/:rotationId
 * Get status of ongoing or completed rotation
 */
router.get(
  "/status/:rotationId",
  errorHandler(async (req, res) => {
    const { rotationId } = req.params;

    const status = await rotationService.getRotationStatus(rotationId);
    if (status.error) {
      return res.status(404).json(status);
    }

    return res.status(200).json({ success: true, status });
  })
);

/**
 * POST /api/rotations/cancel/:rotationId
 * Cancel ongoing rotation
 */
router.post(
  "/cancel/:rotationId",
  errorHandler(async (req, res) => {
    const { rotationId } = req.params;

    try {
      const result = await rotationService.cancelRotation(rotationId);
      logger.info(`Rotation cancelled: ${rotationId}`);
      return res.status(200).json(result);
    } catch (error) {
      logger.error(`Failed to cancel rotation ${rotationId}:`, error);
      return res.status(400).json({ error: error.message });
    }
  })
);

// ===== ROTATION HISTORY ENDPOINTS =====

/**
 * GET /api/rotations/history/:secretName
 * Get rotation history for a secret
 */
router.get(
  "/history/:secretName",
  errorHandler(async (req, res) => {
    const { secretName } = req.params;
    const { limit = 50 } = req.query;

    const history = await rotationService.getRotationHistory(secretName, parseInt(limit));

    return res.status(200).json({
      secretName,
      count: history.length,
      history,
    });
  })
);

/**
 * GET /api/rotations/logs
 * Get all rotation logs with filters
 */
router.get(
  "/logs",
  errorHandler(async (req, res) => {
    const { status, secretName, triggeredBy, limit = 100, skip = 0 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (secretName) filter.secretName = secretName;
    if (triggeredBy) filter.triggeredBy = triggeredBy;

    const logs = await RotationLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await RotationLog.countDocuments(filter);

    return res.status(200).json({
      total,
      count: logs.length,
      skip: parseInt(skip),
      limit: parseInt(limit),
      logs,
    });
  })
);

// ===== SCHEDULE MANAGEMENT ENDPOINTS =====

/**
 * POST /api/schedules/create
 * Create new rotation schedule
 */
router.post(
  "/schedules/create",
  errorHandler(async (req, res) => {
    const { secretName, cronExpression, affectedServices, validationScript, description } = req.body;

    if (!secretName || !cronExpression) {
      return res.status(400).json({
        error: "secretName and cronExpression are required",
      });
    }

    // Verify secret exists
    const secret = await SecretVault.findOne({ secretName });
    if (!secret) {
      return res.status(404).json({ error: `Secret '${secretName}' not found` });
    }

    // Check if schedule already exists
    const existingSchedule = await RotationSchedule.findOne({ secretName });
    if (existingSchedule) {
      return res.status(409).json({ error: "Schedule already exists for this secret" });
    }

    const schedule = await RotationSchedule.create({
      scheduleId: uuidv4(),
      secretName,
      cronExpression,
      affectedServices: affectedServices || [],
      validationScript: validationScript || null,
      description: description || "",
      isActive: true,
    });

    logger.info(`Schedule created for secret: ${secretName}`);
    return res.status(201).json({
      success: true,
      message: "Schedule created successfully",
      schedule,
    });
  })
);

/**
 * GET /api/schedules/:secretName
 * Get rotation schedule for a secret
 */
router.get(
  "/schedules/:secretName",
  errorHandler(async (req, res) => {
    const { secretName } = req.params;

    const schedule = await RotationSchedule.findOne({ secretName });
    if (!schedule) {
      return res.status(404).json({ error: `No schedule found for '${secretName}'` });
    }

    return res.status(200).json({ success: true, schedule });
  })
);

/**
 * GET /api/rotations/schedules
 * Get all active schedules
 */
router.get(
  "/schedules",
  errorHandler(async (req, res) => {
    const schedules = await RotationSchedule.find({ isActive: true }).sort({ nextExecutionTime: 1 });

    return res.status(200).json({
      count: schedules.length,
      schedules,
    });
  })
);

/**
 * PATCH /api/schedules/:scheduleId
 * Update rotation schedule
 */
router.patch(
  "/schedules/:scheduleId",
  errorHandler(async (req, res) => {
    const { scheduleId } = req.params;
    const { cronExpression, isActive, affectedServices, validationScript, description } = req.body;

    const schedule = await RotationSchedule.findOne({ scheduleId });
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    if (cronExpression) schedule.cronExpression = cronExpression;
    if (isActive !== undefined) schedule.isActive = isActive;
    if (affectedServices) schedule.affectedServices = affectedServices;
    if (validationScript) schedule.validationScript = validationScript;
    if (description) schedule.description = description;

    await schedule.save();

    logger.info(`Schedule updated: ${scheduleId}`);
    return res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      schedule,
    });
  })
);

/**
 * DELETE /api/schedules/:scheduleId
 * Delete rotation schedule (soft delete)
 */
router.delete(
  "/schedules/:scheduleId",
  errorHandler(async (req, res) => {
    const { scheduleId } = req.params;

    const schedule = await RotationSchedule.findOne({ scheduleId });
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    schedule.isActive = false;
    await schedule.save();

    logger.info(`Schedule deactivated: ${scheduleId}`);
    return res.status(200).json({
      success: true,
      message: "Schedule deactivated successfully",
    });
  })
);

// ===== SECRET VAULT ENDPOINTS =====

/**
 * POST /api/secrets/register
 * Register a new secret in the vault
 */
router.post(
  "/secrets/register",
  errorHandler(async (req, res) => {
    const { secretName, secretType, rotationPolicy, dependentServices, metadata } = req.body;

    if (!secretName || !rotationPolicy) {
      return res.status(400).json({
        error: "secretName and rotationPolicy are required",
      });
    }

    // Check if secret already exists
    const existing = await SecretVault.findOne({ secretName });
    if (existing) {
      return res.status(409).json({ error: "Secret already registered" });
    }

    const currentVersion = "v_" + Date.now();
    const newSecret = new SecretVault({
      secretName,
      secretType: secretType || "custom",
      currentVersion,
      rotationPolicy,
      dependentServices: dependentServices || [],
      encryptedValue: "",
      metadata: metadata || {},
    });

    await newSecret.save();

    logger.info(`Secret registered: ${secretName}`);
    return res.status(201).json({
      success: true,
      message: "Secret registered successfully",
      secret: {
        secretName,
        secretType: newSecret.secretType,
        currentVersion,
        rotationPolicy,
        dependentServices,
      },
    });
  })
);

/**
 * GET /api/secrets/:secretName
 * Get secret metadata (not the secret itself)
 */
router.get(
  "/secrets/:secretName",
  errorHandler(async (req, res) => {
    const { secretName } = req.params;

    const secret = await SecretVault.findOne({ secretName }).select("-encryptedValue");
    if (!secret) {
      return res.status(404).json({ error: "Secret not found" });
    }

    return res.status(200).json({ success: true, secret });
  })
);

/**
 * GET /api/rotations/secrets
 * List all registered secrets (metadata only)
 */
router.get(
  "/secrets",
  errorHandler(async (req, res) => {
    const { status = "active" } = req.query;

    const secrets = await SecretVault.find({ status }).select("-encryptedValue");

    return res.status(200).json({
      count: secrets.length,
      secrets,
    });
  })
);

/**
 * PATCH /api/secrets/:secretName
 * Update secret metadata
 */
router.patch(
  "/secrets/:secretName",
  errorHandler(async (req, res) => {
    const { secretName } = req.params;
    const { dependentServices, metadata } = req.body;

    const secret = await SecretVault.findOne({ secretName });
    if (!secret) {
      return res.status(404).json({ error: "Secret not found" });
    }

    if (dependentServices) {
      secret.dependentServices = dependentServices;
    }
    if (metadata) {
      secret.metadata = { ...secret.metadata, ...metadata };
    }

    await secret.save();

    logger.info(`Secret updated: ${secretName}`);
    return res.status(200).json({
      success: true,
      message: "Secret updated successfully",
      secret: secret.toObject({ hide: "encryptedValue" }),
    });
  })
);

module.exports = router;
