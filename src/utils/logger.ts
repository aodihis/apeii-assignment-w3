import "dotenv/config";

type LogContext = Record<string, unknown>;
type LogLevel = "debug" | "info" | "warn" | "error";

const logLevelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isLogLevel = (value: string): value is LogLevel =>
  value in logLevelPriority;

const configuredLogLevel = process.env.LOG_LEVEL?.trim().toLowerCase();
const minimumLogLevel: LogLevel = configuredLogLevel && isLogLevel(configuredLogLevel)
  ? configuredLogLevel
  : "info";

const writeLog = (level: LogLevel, message: string, context?: LogContext) => {
  if (logLevelPriority[level] < logLevelPriority[minimumLogLevel]) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  const output = JSON.stringify(entry);
  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
};

export const logger = {
  debug: (message: string, context?: LogContext) =>
    writeLog("debug", message, context),
  info: (message: string, context?: LogContext) =>
    writeLog("info", message, context),
  warn: (message: string, context?: LogContext) =>
    writeLog("warn", message, context),
  error: (message: string, context?: LogContext) =>
    writeLog("error", message, context),
};

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
