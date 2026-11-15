/**
 * Password strength, for the segmented meter on the Register screen.
 *
 * The backend rule (backend/src/utils/validators.js) is the authority:
 * at least 8 characters, containing a letter and a number. This meter only
 * *describes* a password — it never decides whether the form may submit, so the
 * two can never disagree about what is acceptable.
 *
 * Score is 0-4, one point per property:
 *   1. at least 8 characters
 *   2. contains a letter and a number   (the backend minimum)
 *   3. contains an uppercase letter or a symbol
 *   4. at least 12 characters
 */

const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

/** True when the password satisfies the backend's minimum rule. */
export function meetsPasswordRule(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/**
 * @param {string} password
 * @returns {{ score: number, label: string, meetsMinimum: boolean }}
 *          `score` is 0-4 and drives how many meter segments are filled.
 */
export function passwordStrength(password) {
  const value = typeof password === 'string' ? password : '';

  if (value.length === 0) {
    return { score: 0, label: LABELS[0], meetsMinimum: false };
  }

  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Za-z]/.test(value) && /[0-9]/.test(value)) score += 1;
  if (/[A-Z]/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;
  if (value.length >= 12) score += 1;

  // A one-point password ("abcdefgh") must not read as "Weak" *and* pass the
  // backend rule, so the label floor is lifted whenever the rule is met.
  const meetsMinimum = meetsPasswordRule(value);
  const label = meetsMinimum ? LABELS[Math.max(score, 2)] : score >= 2 ? LABELS[2] : LABELS[1];

  return { score, label, meetsMinimum };
}

export default passwordStrength;
