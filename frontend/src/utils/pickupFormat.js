/**
 * Presentation helpers for the pickup lifecycle (Step D).
 *
 * The pickup steps mirror the API's TRANSITIONS map in
 * backend/src/controllers/pickups.controller.js. Only the single legal next step
 * is ever offered, so the UI cannot ask for a transition the server would refuse.
 *
 * A pickup's status is deliberately separate from the donation's: PENDING means
 * "the NGO has accepted and is on its way", and the donation status follows one
 * step behind. There is no volunteer module yet, so ASSIGNED never appears here.
 */

export const PICKUP_STEPS = [
  {
    status: 'PENDING',
    label: 'Awaiting pickup',
    short: 'Awaiting',
    cta: 'Mark as picked up',
    help: 'Collect the batch from the donor before the collection deadline.',
  },
  {
    status: 'PICKED_UP',
    label: 'Collected',
    short: 'Collected',
    cta: 'Confirm delivery',
    help: 'Confirm once the food has reached your kitchen.',
  },
  {
    status: 'COMPLETED',
    label: 'Delivered',
    short: 'Delivered',
    cta: null,
    help: 'This rescue is complete.',
  },
];

const INDEX_BY_STATUS = PICKUP_STEPS.reduce((map, step, index) => {
  map[step.status] = index;
  return map;
}, {});

/** The step entry for a pickup status, or null when the status is unknown. */
export function pickupStep(status) {
  const index = INDEX_BY_STATUS[status];
  return index === undefined ? null : PICKUP_STEPS[index];
}

/**
 * The only legal next move for a pickup, or null when it is already complete.
 * `{ next, cta, help }` — `next` is the status to PATCH.
 */
export function nextPickupStep(status) {
  const index = INDEX_BY_STATUS[status];
  if (index === undefined) return null;
  const step = PICKUP_STEPS[index + 1];
  if (!step) return null;
  return { next: step.status, cta: PICKUP_STEPS[index].cta, help: step.help };
}

/** How far along the 3-step tracker a pickup is: 0, 1 or 2 (or -1). */
export function pickupStageIndex(status) {
  const index = INDEX_BY_STATUS[status];
  return index === undefined ? -1 : index;
}

/** True while the pickup still needs the NGO to do something. */
export function isOpenPickup(status) {
  return status === 'PENDING' || status === 'PICKED_UP';
}
