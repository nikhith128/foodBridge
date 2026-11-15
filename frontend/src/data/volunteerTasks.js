import { useSyncExternalStore } from 'react';

import { estimateMeals } from '../utils/donationFormat.js';

/**
 * Sample volunteer dispatch data.
 *
 * Architecture.md section 8 has no volunteer module: /api/pickups is NGO-only,
 * the Pickup.volunteerId column is never written, and no endpoint issues or
 * verifies the 4-digit collection code. The volunteer screens therefore cannot
 * be fed by the backend yet.
 *
 * Design.md section 12 allows sample data provided it is labelled "Sample
 * data", which every volunteer page does. The records below reuse the seeded
 * demo organisations and food names so the screens stay consistent with the
 * donor and NGO portals; every value stays a session-only sample.
 *
 * The tiny store below keeps the four pages in agreement: claiming on
 * Available Tasks makes the record appear on My Tasks and in the dashboard
 * counters, verifying the code advances the mission, and completing delivery
 * files it under Completed. A reload restores the initial sample set.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function at(offsetMs) {
  return new Date(Date.now() + offsetMs).toISOString();
}

/** The immutable starting point; never mutated. */
const INITIAL_TASKS = [
  {
    id: 'vol-1042',
    reference: 'VOL-1042',
    foodName: 'Cooked Rice & Dal (Demo)',
    foodCategory: 'Cooked Hot Meals',
    foodType: 'VEG',
    quantity: 25,
    quantityUnit: 'kg',
    donor: {
      name: 'Green Leaf Restaurant (Demo)',
      address: 'Demo address 4, Central Market, Demo City',
    },
    ngo: {
      name: 'Hope Foundation (Demo)',
      address: 'Demo address 1, Community Block, Demo City',
    },
    distanceKm: 3.1,
    deadline: at(2 * HOUR),
    status: 'AVAILABLE',
    otp: '4821',
    claimedAt: null,
    pickedUpAt: null,
    completedAt: null,
  },
  {
    id: 'vol-1043',
    reference: 'VOL-1043',
    foodName: 'Assorted Bread & Buns (Demo)',
    foodCategory: 'Bakery & Bread',
    foodType: 'VEG',
    quantity: 15,
    quantityUnit: 'kg',
    donor: {
      name: 'Green Leaf Restaurant (Demo)',
      address: 'Demo address 4, Central Market, Demo City',
    },
    ngo: {
      name: 'Annapurna Trust (Demo)',
      address: 'Demo address 2, Riverside Road, Demo City',
    },
    distanceKm: 2.4,
    deadline: at(7 * HOUR),
    status: 'AVAILABLE',
    otp: '7315',
    claimedAt: null,
    pickedUpAt: null,
    completedAt: null,
  },
  {
    id: 'vol-1044',
    reference: 'VOL-1044',
    foodName: 'Fresh Paneer Wraps (Demo)',
    foodCategory: 'Cooked Hot Meals',
    foodType: 'VEG',
    quantity: 6,
    quantityUnit: 'kg',
    donor: {
      name: 'Green Leaf Restaurant (Demo)',
      address: 'Demo address 4, Central Market, Demo City',
    },
    ngo: {
      name: 'Akshaya Seva Kitchen (Demo)',
      address: 'Demo address 3, Old Market Lane, Demo City',
    },
    distanceKm: 4.6,
    deadline: at(4 * HOUR),
    status: 'AVAILABLE',
    otp: '9052',
    claimedAt: null,
    pickedUpAt: null,
    completedAt: null,
  },
  {
    id: 'vol-1039',
    reference: 'VOL-1039',
    foodName: 'Hyderabadi Dum Biryani (Demo)',
    foodCategory: 'Cooked Hot Meals',
    foodType: 'NON_VEG',
    quantity: 12,
    quantityUnit: 'kg',
    donor: {
      name: 'Green Leaf Restaurant (Demo)',
      address: 'Demo address 4, Central Market, Demo City',
    },
    ngo: {
      name: 'Hope Foundation (Demo)',
      address: 'Demo address 1, Community Block, Demo City',
    },
    distanceKm: 1.8,
    deadline: at(90 * MINUTE),
    status: 'CLAIMED',
    otp: '6204',
    claimedAt: at(-25 * MINUTE),
    pickedUpAt: null,
    completedAt: null,
  },
  {
    id: 'vol-1036',
    reference: 'VOL-1036',
    foodName: 'Bakery Surplus Box (Demo)',
    foodCategory: 'Bakery & Bread',
    foodType: 'VEG',
    quantity: 20,
    quantityUnit: 'kg',
    donor: {
      name: 'Green Leaf Restaurant (Demo)',
      address: 'Demo address 4, Central Market, Demo City',
    },
    ngo: {
      name: 'Annapurna Trust (Demo)',
      address: 'Demo address 2, Riverside Road, Demo City',
    },
    distanceKm: 2.2,
    deadline: at(3 * HOUR),
    status: 'PICKED_UP',
    otp: '4987',
    claimedAt: at(-50 * MINUTE),
    pickedUpAt: at(-15 * MINUTE),
    completedAt: null,
  },
  {
    id: 'vol-1031',
    reference: 'VOL-1031',
    foodName: 'Assorted Fruit Boxes (Demo)',
    foodCategory: 'Fresh Produce',
    foodType: 'VEG',
    quantity: 18,
    quantityUnit: 'kg',
    donor: {
      name: 'Green Leaf Restaurant (Demo)',
      address: 'Demo address 4, Central Market, Demo City',
    },
    ngo: {
      name: 'Hope Foundation (Demo)',
      address: 'Demo address 1, Community Block, Demo City',
    },
    distanceKm: 3.4,
    deadline: at(-20 * HOUR),
    status: 'COMPLETED',
    otp: '2159',
    claimedAt: at(-23 * HOUR),
    pickedUpAt: at(-22 * HOUR),
    completedAt: at(-20 * HOUR),
  },
  {
    id: 'vol-1027',
    reference: 'VOL-1027',
    foodName: 'Veg Salad & Sandwich Platter (Demo)',
    foodCategory: 'Cooked Hot Meals',
    foodType: 'VEG',
    quantity: 8,
    quantityUnit: 'kg',
    donor: {
      name: 'Green Leaf Restaurant (Demo)',
      address: 'Demo address 4, Central Market, Demo City',
    },
    ngo: {
      name: 'Akshaya Seva Kitchen (Demo)',
      address: 'Demo address 3, Old Market Lane, Demo City',
    },
    distanceKm: 2.9,
    deadline: at(-3 * 24 * HOUR),
    status: 'COMPLETED',
    otp: '3846',
    claimedAt: at(-3 * 24 * HOUR + 30 * MINUTE),
    pickedUpAt: at(-3 * 24 * HOUR + 55 * MINUTE),
    completedAt: at(-3 * 24 * HOUR + 2 * HOUR),
  },
];

let tasks = INITIAL_TASKS;
const listeners = new Set();

function commit(nextTasks) {
  tasks = nextTasks;
  listeners.forEach((listener) => listener());
}

function replaceTask(id, updater) {
  commit(tasks.map((task) => (task.id === id ? { ...task, ...updater(task) } : task)));
}

/** Subscribe to claim / verify / complete changes. */
export function subscribeVolunteerTasks(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current task list. Stable between changes, as useSyncExternalStore needs. */
export function getVolunteerTasks() {
  return tasks;
}

export function useVolunteerTasks() {
  return useSyncExternalStore(subscribeVolunteerTasks, getVolunteerTasks, getVolunteerTasks);
}

function findTask(id) {
  return tasks.find((task) => task.id === id) || null;
}

/** AVAILABLE records: unclaimed sample work. */
export function availableTasks(list) {
  return list.filter((task) => task.status === 'AVAILABLE');
}

/** CLAIMED or PICKED_UP: work in the volunteer's hands. */
export function activeTasks(list) {
  return list.filter((task) => task.status === 'CLAIMED' || task.status === 'PICKED_UP');
}

export function completedTasks(list) {
  return [...list]
    .filter((task) => task.status === 'COMPLETED')
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

/** Total kilometres and meals across completed sample rescues. */
export function completedTotals(list) {
  const completed = completedTasks(list);
  return completed.reduce(
    (totals, task) => ({
      km: Math.round((totals.km + task.distanceKm) * 10) / 10,
      meals: totals.meals + estimateMeals(task.quantity, task.quantityUnit),
    }),
    { km: 0, meals: 0 }
  );
}

/** Claim an unclaimed sample task. Returns the updated task, or null. */
export function claimTask(id) {
  const task = findTask(id);
  if (!task || task.status !== 'AVAILABLE') return null;
  replaceTask(id, () => ({ status: 'CLAIMED', claimedAt: new Date().toISOString() }));
  return findTask(id);
}

/**
 * Check the 4-digit code against the sample record.
 * The real check belongs on the backend, which does not exist yet.
 */
export function verifyPickup(id, code) {
  const task = findTask(id);
  if (!task) return { ok: false, message: 'That task no longer exists.' };
  if (task.status !== 'CLAIMED') {
    return { ok: false, message: 'This handoff has already been verified.' };
  }
  if (String(code).trim() !== task.otp) {
    return { ok: false, message: 'That code does not match the sample collection code.' };
  }
  replaceTask(id, () => ({ status: 'PICKED_UP', pickedUpAt: new Date().toISOString() }));
  return { ok: true, task: findTask(id) };
}

/** File the delivery. Only a picked-up task can be completed. */
export function completeDelivery(id) {
  const task = findTask(id);
  if (!task || task.status !== 'PICKED_UP') return null;
  replaceTask(id, () => ({ status: 'COMPLETED', completedAt: new Date().toISOString() }));
  return findTask(id);
}

/** Human status label for a sample task. */
export function taskStatusLabel(status) {
  if (status === 'CLAIMED') return 'Assigned · En route';
  if (status === 'PICKED_UP') return 'Picked up · In transit';
  if (status === 'COMPLETED') return 'Delivered';
  return 'Available';
}

/** The Badge status key for a sample task (CLAIMED reads as ASSIGNED). */
export function badgeStatusFor(status) {
  return status === 'CLAIMED' ? 'ASSIGNED' : status;
}
