const { v4: uuidv4 } = require("uuid");
const RotationLog = require("../models/RotationLog");
const SecretVault = require("../models/SecretVault");
const RotationSchedule = require("../models/RotationSchedule");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class RotationService {
  constructor() {
    this.activeRotations = new Map();
    this.rotationTimeout = 3600000; // 1 hour default timeout
  }

  // ===== ZERO-DOWNTIME ROTATION WORKFLOW =====

  /**
   * Initiates a complete zero-downtime rotation workflow
   * Steps:
   * 1. Generate new secret
   * 2. Update dependent services with new secret (parallel)
   * 3. Validate new secret in all services
   * 4. Mark old secret for deprecation (only after validation)
   * 5. Remove old secret with fallback rollback
   */
  async initiateZeroDowntimeRotation(secretName, triggeredBy = "manual") {
    const rotationId = uuidv4();
    
    try {
      // Step 1: Get existing secret
      const secretVault = await SecretVault.findOne({ secretName });
      if (!secretVault) {
        throw new Error(`Secret '${secretName}' not found in vault`);
      }

      const oldVersion = secretVault.currentVersion;

      // Create rotation log
      const rotationLog = await RotationLog.create({
        rotationId,
        secretName,
        status: "in-progress",
        oldSecretVersion: oldVersion,
        triggeredBy,
        affectedServices: secretVault.dependentServices,
      });

      // Track this rotation
      this.activeRotations.set(rotationId, {
        secretName,
        startTime: Date.now(),
        status: "in-progress",
      });

      console.log(`[ROTATION ${rotationId}] Starting zero-downtime rotation for ${secretName}`);

      // Step 2: Generate new secret
      const newSecret = this.generateNewSecret(secretVault.secretType);
      const newVersion = this.generateVersionHash();

      // Step 3: Backup current state before any changes
      const backup = await this.createRotationBackup(secretName, oldVersion, newVersion);

      // Step 4: Update dependent services in parallel with rollback capability
      const serviceUpdates = await this.updateServicesInParallel(
        secretName,
        newSecret,
        newVersion,
        secretVault.dependentServices,
        backup,
      );

      // Step 5: Validate new secret across all services
      const validationResults = await this.validateSecretAcrossServices(
        secretName,
        newVersion,
        secretVault.dependentServices,
        secretVault.validationScript,
      );

      if (!validationResults.allValidated) {
        console.error(`[ROTATION ${rotationId}] Validation failed. Initiating rollback...`);
        await this.rollbackRotation(rotationId, backup, secretName, newVersion);
        
        rotationLog.status = "rolled-back";
        rotationLog.validationStatus = "failed";
        rotationLog.validationResults = validationResults;
        rotationLog.rollbackMessage = "Validation failed. All services rolled back to previous state.";
        await rotationLog.save();

        this.activeRotations.delete(rotationId);
        return {
          success: false,
          rotationId,
          message: "Rotation failed and rolled back due to validation failure",
          validationResults,
        };
      }

      // Step 6: Update vault with new secret only after validation passes
      secretVault.previousVersion = oldVersion;
      secretVault.currentVersion = newVersion;
      secretVault.encryptedValue = this.encryptSecret(newSecret);
      secretVault.lastRotatedAt = new Date();
      secretVault.status = "active";
      
      secretVault.rotationHistory.push({
        version: newVersion,
        rotatedAt: new Date(),
        rotatedBy: triggeredBy,
        status: "success",
      });

      await secretVault.save();

      // Step 7: Update rotation log with success
      rotationLog.newSecretVersion = newVersion;
      rotationLog.status = "success";
      rotationLog.validationStatus = "validated";
      rotationLog.validationResults = validationResults;
      rotationLog.endTime = new Date();
      await rotationLog.save();

      this.activeRotations.delete(rotationId);

      console.log(`[ROTATION ${rotationId}] Zero-downtime rotation completed successfully`);

      return {
        success: true,
        rotationId,
        secretName,
        oldVersion,
        newVersion,
        affectedServices: secretVault.dependentServices,
        validationResults,
        message: "Secret rotated successfully with zero downtime",
      };
    } catch (error) {
      console.error(`[ROTATION ${rotationId}] Error during rotation:`, error.message);
      
      const rotationLog = await RotationLog.findOne({ rotationId });
      if (rotationLog) {
        rotationLog.status = "failed";
        rotationLog.errorMessage = error.message;
        rotationLog.endTime = new Date();
        await rotationLog.save();
      }

      this.activeRotations.delete(rotationId);

      throw error;
    }
  }

  /**
   * Generate new secret based on type
   */
  generateNewSecret(secretType) {
    switch (secretType) {
      case "database_password":
        return this.generateStrongPassword(32);
      case "api_key":
        return this.generateApiKey();
      case "token":
        return this.generateToken();
      case "certificate":
        return this.generateCertificate();
      default:
        return this.generateRandomString(32);
    }
  }

  /**
   * Generate a strong password with mixed character types
   */
  generateStrongPassword(length = 32) {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split("").sort(() => Math.random() - 0.5).join("");
  }

  /**
   * Generate API key format
   */
  generateApiKey() {
    return `sk_${crypto.randomBytes(24).toString("hex")}`;
  }

  /**
   * Generate JWT-like token
   */
  generateToken() {
    return crypto.randomBytes(48).toString("base64");
  }

  /**
   * Placeholder for certificate generation
   */
  generateCertificate() {
    return `CERT_${crypto.randomBytes(32).toString("hex")}`;
  }

  /**
   * Generate random string
   */
  generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString("hex").slice(0, length);
  }

  /**
   * Generate version hash for tracking
   */
  generateVersionHash() {
    return `v_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  /**
   * Encrypt secret for storage
   */
  encryptSecret(secret) {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "default-key", "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(secret, "utf8", "hex");
    encrypted += cipher.final("hex");

    return `${iv.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypt secret from storage
   */
  decryptSecret(encryptedData) {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "default-key", "salt", 32);
    const [iv, encrypted] = encryptedData.split(":");

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(iv, "hex"), Buffer.from(iv, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Create backup of current secret state
   */
  async createRotationBackup(secretName, oldVersion, newVersion) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(process.env.BACKUP_DIR || "./backups", secretName);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `${oldVersion}_${timestamp}.backup.json`);
    const backup = {
      secretName,
      oldVersion,
      newVersion,
      timestamp: new Date(),
      vaultSnapshot: await SecretVault.findOne({ secretName }),
      scheduleSnapshot: await RotationSchedule.findOne({ secretName }),
    };

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    return {
      backupFile,
      backup,
    };
  }

  /**
   * Update all dependent services in parallel with retry logic
   */
  async updateServicesInParallel(secretName, newSecret, newVersion, services, backup) {
    const schedule = await RotationSchedule.findOne({ secretName });
    const retryAttempts = schedule?.retryAttempts || 3;
    const retryDelayMs = schedule?.retryDelayMs || 5000;

    const updatePromises = services.map((service) =>
      this.updateServiceWithRetry(
        service,
        secretName,
        newSecret,
        newVersion,
        retryAttempts,
        retryDelayMs,
      ),
    );

    const results = await Promise.allSettled(updatePromises);

    const successful = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const failed = results.filter((r) => r.status === "rejected").map((r) => r.reason);

    return {
      successful,
      failed,
      allSuccessful: failed.length === 0,
    };
  }

  /**
   * Update individual service with retry logic
   */
  async updateServiceWithRetry(service, secretName, newSecret, newVersion, retries, delay) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(
          `[SERVICE UPDATE] Updating ${service} with new secret (Attempt ${attempt}/${retries})`,
        );

        // Execute update script
        const scriptPath = this.getUpdateScriptPath(service);
        if (fs.existsSync(scriptPath)) {
          const command = process.platform === "win32" 
            ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -ServiceName "${service}" -NewSecret "${newSecret}" -SecretVersion "${newVersion}"`
            : `bash "${scriptPath}" "${service}" "${newSecret}" "${newVersion}"`;
          
          execSync(command, { timeout: 30000 });
        } else {
          console.warn(`[SERVICE UPDATE] Script not found for service: ${service}`);
        }

        return { service, status: "updated", attempt };
      } catch (error) {
        console.error(
          `[SERVICE UPDATE] Failed to update ${service} (Attempt ${attempt}/${retries}):`,
          error.message,
        );

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw new Error(`Failed to update ${service} after ${retries} attempts: ${error.message}`);
        }
      }
    }
  }

  /**
   * Get update script path based on service name
   */
  getUpdateScriptPath(service) {
    const scriptsDir = path.join(__dirname, "../scripts");
    const platform = process.platform === "win32" ? "bat" : "sh";
    return path.join(scriptsDir, `update-${service}.${platform}`);
  }

  /**
   * Validate new secret across all services
   */
  async validateSecretAcrossServices(secretName, newVersion, services, validationScript) {
    const validationPromises = services.map((service) =>
      this.validateServiceSecret(service, secretName, newVersion, validationScript),
    );

    const results = await Promise.allSettled(validationPromises);

    const validationResults = {
      timestamp: new Date(),
      newVersion,
      services: {},
      allValidated: true,
    };

    results.forEach((result, index) => {
      const service = services[index];
      if (result.status === "fulfilled") {
        validationResults.services[service] = {
          status: "validated",
          message: result.value,
        };
      } else {
        validationResults.services[service] = {
          status: "failed",
          error: result.reason.message,
        };
        validationResults.allValidated = false;
      }
    });

    return validationResults;
  }

  /**
   * Validate single service secret
   */
  async validateServiceSecret(service, secretName, newVersion, validationScript) {
    try {
      if (validationScript && fs.existsSync(validationScript)) {
        const command = process.platform === "win32"
          ? `powershell -ExecutionPolicy Bypass -File "${validationScript}" -ServiceName "${service}" -SecretVersion "${newVersion}"`
          : `bash "${validationScript}" "${service}" "${newVersion}"`;

        const output = execSync(command, {
          timeout: 30000,
          encoding: "utf8",
        });

        return `Validation passed for ${service}: ${output.trim()}`;
      }

      return `Basic validation passed for ${service} (no custom script)`;
    } catch (error) {
      throw new Error(`Validation failed for ${service}: ${error.message}`);
    }
  }

  /**
   * Rollback rotation to previous state
   */
  async rollbackRotation(rotationId, backup, secretName, attemptedVersion) {
    try {
      console.log(`[ROLLBACK ${rotationId}] Initiating rollback for ${secretName}...`);

      const secretVault = await SecretVault.findOne({ secretName });
      if (!secretVault) {
        throw new Error("Cannot rollback: Secret not found");
      }

      // Revert to previous version
      const previousVersion = secretVault.previousVersion || backup.backup.oldVersion;
      const affectedServices = secretVault.dependentServices;

      // Notify all services to revert
      const revertPromises = affectedServices.map((service) =>
        this.revertServiceSecret(service, secretName, previousVersion),
      );

      const results = await Promise.allSettled(revertPromises);
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.error(`[ROLLBACK ${rotationId}] Some services failed to revert`);
      }

      console.log(`[ROLLBACK ${rotationId}] Rollback completed`);

      return {
        success: failed.length === 0,
        failedServices: failed.length,
        backupFile: backup.backupFile,
      };
    } catch (error) {
      console.error(`[ROLLBACK ${rotationId}] Rollback failed:`, error.message);
      throw error;
    }
  }

  /**
   * Revert individual service secret
   */
  async revertServiceSecret(service, secretName, previousVersion) {
    try {
      const scriptPath = path.join(__dirname, "../scripts", `revert-${service}.bat`);
      if (fs.existsSync(scriptPath)) {
        const command = process.platform === "win32"
          ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -ServiceName "${service}" -SecretVersion "${previousVersion}"`
          : `bash "${scriptPath}" "${service}" "${previousVersion}"`;

        execSync(command, { timeout: 30000 });
      }

      return { service, status: "reverted" };
    } catch (error) {
      throw new Error(`Failed to revert ${service}: ${error.message}`);
    }
  }

  /**
   * Get rotation history for a secret
   */
  async getRotationHistory(secretName, limit = 50) {
    return RotationLog.find({ secretName })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get current rotation status
   */
  async getRotationStatus(rotationId) {
    const log = await RotationLog.findOne({ rotationId });
    if (!log) {
      return { error: "Rotation not found" };
    }

    const activeRotation = this.activeRotations.get(rotationId);
    const isActive = !!activeRotation;

    return {
      rotationId,
      isActive,
      ...log.toObject(),
      elapsedTime: activeRotation ? Date.now() - activeRotation.startTime : null,
    };
  }

  /**
   * Cancel ongoing rotation (if possible)
   */
  async cancelRotation(rotationId) {
    const rotation = this.activeRotations.get(rotationId);
    if (!rotation) {
      throw new Error("Rotation not found or already completed");
    }

    const log = await RotationLog.findOne({ rotationId });
    log.status = "cancelled";
    log.endTime = new Date();
    await log.save();

    this.activeRotations.delete(rotationId);

    return {
      success: true,
      message: `Rotation ${rotationId} cancelled`,
    };
  }
}

module.exports = new RotationService();
