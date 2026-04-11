import assert from "node:assert/strict";
import { formatDateLocal } from "../src/lib/date.ts";
import {
  getDefaultHydrationState,
  normalizeHydrationState,
  rolloverHydrationState,
} from "../src/lib/hydrationState.ts";

const tests = [
  {
    name: "formatDateLocal returns YYYY-MM-DD with padded local month and day",
    run: () => {
      const value = formatDateLocal(new Date(2026, 3, 5));
      assert.equal(value, "2026-04-05");
    },
  },
  {
    name: "normalizeHydrationState fills missing values with defaults",
    run: () => {
      const state = normalizeHydrationState({ intake: 900, lastUpdated: "2026-04-10" }, "2026-04-11");

      assert.equal(state.intake, 900);
      assert.equal(state.goal, 2500);
      assert.equal(state.lastUpdated, "2026-04-10");
      assert.deepEqual(state.quietHours, { start: "22:00", end: "07:00" });
    },
  },
  {
    name: "rolloverHydrationState increments streak and archives yesterday when goal was met",
    run: () => {
      const base = getDefaultHydrationState();
      const rolled = rolloverHydrationState(
        {
          ...base,
          intake: 2500,
          goal: 2500,
          streak: 2,
          lastUpdated: "2026-04-10",
        },
        "2026-04-11"
      );

      assert.equal(rolled.intake, 0);
      assert.equal(rolled.streak, 3);
      assert.equal(rolled.lastUpdated, "2026-04-11");
      assert.deepEqual(rolled.history, [{ date: "2026-04-10", intake: 2500, goal: 2500 }]);
    },
  },
  {
    name: "rolloverHydrationState resets streak and fills missed days in history",
    run: () => {
      const base = getDefaultHydrationState();
      const rolled = rolloverHydrationState(
        {
          ...base,
          intake: 1800,
          goal: 2500,
          streak: 4,
          lastUpdated: "2026-04-07",
        },
        "2026-04-11"
      );

      assert.equal(rolled.streak, 0);
      assert.equal(rolled.history.length, 4);
      assert.deepEqual(rolled.history[0], { date: "2026-04-07", intake: 1800, goal: 2500 });
      assert.deepEqual(rolled.history[1], { date: "2026-04-08", intake: 0, goal: 2500 });
      assert.deepEqual(rolled.history[2], { date: "2026-04-09", intake: 0, goal: 2500 });
      assert.deepEqual(rolled.history[3], { date: "2026-04-10", intake: 0, goal: 2500 });
    },
  },
];

let passed = 0;

for (const testCase of tests) {
  try {
    testCase.run();
    passed += 1;
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    console.error(`FAIL ${testCase.name}`);
    throw error;
  }
}

console.log(`\n${passed}/${tests.length} tests passed.`);
