import fs from 'fs';
import path from 'path';

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, `app-${this.getDateString()}.log`);
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private writeLog(level: string, message: string, meta?: any): void {
    const logEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      ...(meta && { meta })
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(this.logFile, logLine);
    
    // Also log to console
    const consoleMessage = `[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`;
    if (level === 'error') {
      console.error(consoleMessage, meta || '');
    } else {
      console.log(consoleMessage, meta || '');
    }
  }

  info(message: string, meta?: any): void {
    this.writeLog('info', message, meta);
  }

  error(message: string, error?: any): void {
    const meta = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    this.writeLog('error', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.writeLog('warn', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.writeLog('debug', message, meta);
  }
}

export const logger = new Logger();
