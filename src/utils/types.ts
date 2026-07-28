export interface TimeInterval {
  start: Date;
  end: Date;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface BookingRuleInput {
  startTime: Date;
  endTime: Date;
}
