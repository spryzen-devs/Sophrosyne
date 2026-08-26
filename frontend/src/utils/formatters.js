import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format a date as relative time (e.g., "3 min ago")
 */
export function timeAgo(dateString) {
  if (!dateString) return '—';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return '—';
  }
}

/**
 * Format a date as a readable string
 */
export function formatDate(dateString, pattern = 'MMM d, yyyy') {
  if (!dateString) return '—';
  try {
    return format(new Date(dateString), pattern);
  } catch {
    return '—';
  }
}

/**
 * Format a date with time
 */
export function formatDateTime(dateString) {
  return formatDate(dateString, 'MMM d, yyyy · h:mm a');
}

/**
 * Format alert type enum to readable text
 */
export function formatAlertType(type) {
  if (!type) return '—';
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format enum values to readable text (e.g., "FALL_DETECTED" → "Fall Detected")
 */
export function formatEnum(value) {
  if (!value) return '—';
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get initials from a full name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get vital status based on value ranges
 */
export function getHeartRateStatus(hr) {
  if (hr == null) return 'normal';
  if (hr > 120 || hr < 40) return 'critical';
  if (hr > 100 || hr < 50) return 'warning';
  return 'normal';
}

export function getSpo2Status(spo2) {
  if (spo2 == null) return 'normal';
  if (spo2 < 90) return 'critical';
  if (spo2 < 93) return 'warning';
  return 'normal';
}

export function getTemperatureStatus(temp) {
  if (temp == null) return 'normal';
  if (temp > 38.5 || temp < 35.0) return 'critical';
  if (temp > 37.5 || temp < 36.0) return 'warning';
  return 'normal';
}

/**
 * Get severity color token
 */
export function getSeverityColor(severity) {
  switch (severity) {
    case 'CRITICAL': return { text: 'var(--red)', bg: 'var(--red-light)' };
    case 'HIGH': return { text: 'var(--orange)', bg: 'var(--orange-light)' };
    case 'MEDIUM': return { text: '#7A6400', bg: 'var(--yellow-light)' };
    case 'LOW': return { text: 'var(--text-secondary)', bg: 'var(--surface)' };
    default: return { text: 'var(--text-secondary)', bg: 'var(--surface)' };
  }
}
