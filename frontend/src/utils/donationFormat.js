/**
 * Presentation helpers for donations.
 *
 * The backend owns the real numbers; these turn them into the strings the
 * screens show. Nothing here invents a figure — every derived value is labelled
 * as an estimate wherever it is displayed.
 */

import { UNIT_TO_KG } from '../constants/options.js';

/** Statuses that mean "still being worked on", for the dashboard counters. */
export const ACTIVE_STATUSES = ['AVAILABLE', 'ACCEPTED', 'ASSIGNED', 'PICKED_UP'];

/** Statuses that mean "the food reached people", for the impact counters. */
export const RESCUED_STATUSES = ['COMPLETED'];

/** Illustrative conversion used only for the on-screen estimate. */
export const CO2E_KG_PER_KG_FOOD = 2.5;

/** Approximate kilograms for a quantity in any supported unit. */
export function toKilograms(quantity, unit) {
  const factor = UNIT_TO_KG[unit] ?? 1;
  return (Number(quantity) || 0) * factor;
}

/**
 * A rough "meals" figure: a kilogram of rescued food is treated as about two and
 * a half 400 g servings. Presentation only.
 */
export function estimateMeals(quantity, unit) {
  return Math.round(toKilograms(quantity, unit) / 0.4);
}

/** Estimated CO2e diverted, in kilograms. */
export function estimateCo2eKg(quantity, unit) {
  return Math.round(toKilograms(quantity, unit) * CO2E_KG_PER_KG_FOOD * 10) / 10;
}

function trimNumber(value) {
  const n = Number(value) || 0;
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** "50 servings" or "12 kg" — the quantity with its unit, no conversion. */
export function formatQuantity(quantity, unit) {
  const label = unit || 'kg';
  return `${trimNumber(quantity)} ${label}`;
}

/**
 * "50 servings (~20 kg)" — the weight is added only when the unit is not
 * already kilograms, so a kg donation is not shown as "12 kg (~12 kg)".
 */
export function formatQuantityWithWeight(quantity, unit) {
  const base = formatQuantity(quantity, unit);
  if (!unit || unit === 'kg') return base;
  const kg = Math.round(toKilograms(quantity, unit));
  return `${base} (~${kg} kg)`;
}

/** True when the donation is still in play and can be shown as active. */
export function isActiveStatus(status) {
  return ACTIVE_STATUSES.includes(status);
}

/** The countdown tone for a deadline: 'expired' | 'urgent' | 'soon' | 'normal'. */
export function deadlineTone(minutes) {
  if (minutes <= 0) return 'expired';
  if (minutes <= 60) return 'urgent';
  if (minutes <= 6 * 60) return 'soon';
  return 'normal';
}
