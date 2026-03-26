const cron = require("node-cron");
const RotationSchedule = require("../models/RotationSchedule");
const rotationService = require("./rotationService");

class CronScheduler {
  constructor() {
    this.tasks = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize scheduler - load all active schedules and start tasks
   */
  async initialize() {
    try {
      console.log("[CRON SCHEDULER] Initializing...");

      // Get all active schedules
      const schedules = await RotationSchedule.find({ isActive: true });

      console.log(`[CRON SCHEDULER] Found ${schedules.length} active schedules`);

      // Create cron tasks for each schedule
      for (const schedule of schedules) {
        this.addTask(schedule);
      }

      this.isInitialized = true;
      console.log("[CRON SCHEDULER] Initialization complete");
    } catch (error) {
      console.error("[CRON SCHEDULER] Initialization failed:", error.message);
      throw error;
    }
  }

  /**
   * Add a cron task for a specific schedule
   */
  addTask(schedule) {
    try {
      // Validate cron expression
      if (!cron.validate(schedule.cronExpression)) {
        console.error(
          `[CRON SCHEDULER] Invalid cron expression for ${schedule.secretName}: ${schedule.cronExpression}`,
        );
        return false;
      }

      // Remove existing task if any
      if (this.tasks.has(schedule.secretName)) {
        this.removeTask(schedule.secretName);
      }

      // Create new task
      const task = cron.schedule(schedule.cronExpression, async () => {
        await this.executeRotation(schedule);
      });

      // Calculate and store next execution time
      const now = new Date();
      const nextRun = this.calculateNextRun(schedule.cronExpression, now);

      schedule.nextExecutionTime = nextRun;
      schedule.save().catch((err) =>
        console.error(`[CRON SCHEDULER] Error updating schedule: ${err.message}`),
      );

      this.tasks.set(schedule.secretName, {
        task,
        scheduleId: schedule.scheduleId,
        expression: schedule.cronExpression,
        nextRun,
      });

      console.log(
        `[CRON SCHEDULER] Task added for ${schedule.secretName} (${schedule.cronExpression}). Next run: ${nextRun}`,
      );

      return true;
    } catch (error) {
      console.error(`[CRON SCHEDULER] Error adding task: ${error.message}`);
      return false;
    }
  }

  /**
   * Execute rotation for a schedule
   */
  async executeRotation(schedule) {
    try {
      console.log(`[CRON SCHEDULER] Executing scheduled rotation for ${schedule.secretName}`);

      // Update last execution time
      schedule.lastExecutionTime = new Date();
      await schedule.save();

      // Execute rotation
      const result = await rotationService.initiateZeroDowntimeRotation(
        schedule.secretName,
        "cron",
      );

      if (result.success) {
        console.log(`[CRON SCHEDULER] Rotation completed successfully for ${schedule.secretName}`);

        // Send notifications if configured
        if (schedule.notificationEmail && schedule.notificationEmail.length > 0) {
          await this.sendNotification(schedule, result, "success");
        }
      } else {
        console.error(`[CRON SCHEDULER] Rotation failed for ${schedule.secretName}`);

        if (schedule.notificationEmail && schedule.notificationEmail.length > 0) {
          await this.sendNotification(schedule, result, "failure");
        }
      }

      // Calculate and update next execution time
      const nextRun = this.calculateNextRun(schedule.cronExpression, new Date());
      schedule.nextExecutionTime = nextRun;
      await schedule.save();
    } catch (error) {
      console.error(
        `[CRON SCHEDULER] Error executing rotation for ${schedule.secretName}:`,
        error.message,
      );

      // Log failure and send notification
      const schedule_doc = await RotationSchedule.findOne({ secretName: schedule.secretName });
      if (schedule_doc?.notificationEmail?.length > 0) {
        await this.sendNotification(schedule_doc, { error: error.message }, "failure");
      }
    }
  }

  /**
   * Remove a cron task
   */
  removeTask(secretName) {
    const taskInfo = this.tasks.get(secretName);
    if (taskInfo) {
      taskInfo.task.stop();
      taskInfo.task.destroy();
      this.tasks.delete(secretName);
      console.log(`[CRON SCHEDULER] Task removed for ${secretName}`);
      return true;
    }
    return false;
  }

  /**
   * Pause a cron task (without removing it)
   */
  pauseTask(secretName) {
    const taskInfo = this.tasks.get(secretName);
    if (taskInfo) {
      taskInfo.task.stop();
      console.log(`[CRON SCHEDULER] Task paused for ${secretName}`);
      return true;
    }
    return false;
  }

  /**
   * Resume a paused cron task
   */
  resumeTask(secretName) {
    const taskInfo = this.tasks.get(secretName);
    if (taskInfo) {
      taskInfo.task.start();
      console.log(`[CRON SCHEDULER] Task resumed for ${secretName}`);
      return true;
    }
    return false;
  }

  /**
   * Calculate next execution time based on cron expression
   * Note: This is a simplified calculation. For production, use a cron-parser library
   */
  calculateNextRun(cronExpression, fromDate = new Date()) {
    // Basic parsing for common cron patterns
    const parts = cronExpression.split(" ");

    if (parts.length !== 5) {
      console.error("Invalid cron expression format");
      return null;
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // This is a simplified version. For production, use:
    // npm install cron-parser
    // import parser from 'cron-parser';
    // const interval = parser.parseExpression(cronExpression);
    // return interval.next().toDate();

    // Simplified: Just add 1 hour for demo purposes
    const next = new Date(fromDate);
    next.setHours(next.getHours() + 1);
    return next;
  }

  /**
   * Send email notification for rotation result
   */
  async sendNotification(schedule, result, status) {
    try {
      // This is a placeholder. Implement with actual email service (nodemailer, SendGrid, etc.)
      const emailData = {
        to: schedule.notificationEmail,
        subject: `Secret Rotation ${status.toUpperCase()}: ${schedule.secretName}`,
        template: "rotation-notification",
        data: {
          secretName: schedule.secretName,
          status,
          timestamp: new Date(),
          result,
        },
      };

      console.log(`[NOTIFICATION] Would send email to: ${schedule.notificationEmail.join(", ")}`);
      console.log(`[NOTIFICATION] Status: ${status}`, JSON.stringify(result, null, 2));

      // TODO: Integrate with actual email service
      // await emailService.send(emailData);
    } catch (error) {
      console.error("[NOTIFICATION] Error sending notification:", error.message);
    }
  }

  /**
   * Get all active tasks
   */
  getAllTasks() {
    return Array.from(this.tasks.entries()).map(([secretName, taskInfo]) => ({
      secretName,
      ...taskInfo,
    }));
  }

  /**
   * Get task info for a specific secret
   */
  getTask(secretName) {
    return this.tasks.get(secretName) || null;
  }

  /**
   * Stop all tasks (graceful shutdown)
   */
  stopAll() {
    console.log("[CRON SCHEDULER] Stopping all tasks...");

    for (const [secretName, taskInfo] of this.tasks.entries()) {
      taskInfo.task.stop();
      taskInfo.task.destroy();
    }

    this.tasks.clear();
    console.log("[CRON SCHEDULER] All tasks stopped");
  }
}

module.exports = new CronScheduler();
