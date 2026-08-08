import assert from "node:assert/strict";
import { formatDateLocal } from "../src/lib/date.ts";
import {
  getDefaultHydrationState,
  MAX_STREAK_SHIELD_CHARGES,
  normalizeHydrationState,
  rolloverHydrationState,
} from "../src/lib/hydrationState.ts";
import {
  buildRollingHydrationStats,
  buildWeeklyHydrationStats,
  getHydrationInsight,
} from "../src/lib/hydrationStats.ts";
import {
  HYDRATION_NOTIFICATION_TYPES,
  WORKOUT_NOTIFICATION_LOG_AMOUNT,
  getNextHydrationLifecycleDueAt,
  pickHydrationLifecycleNotification,
  pickHydrationNotification,
  pickHydrationStreakAlertNotification,
  pickWorkoutHydrationNotification,
} from "../src/lib/notificationMessages.ts";

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
      assert.equal(state.quickAddAmount, 250);
      assert.equal(state.streakShieldCharges, MAX_STREAK_SHIELD_CHARGES);
      assert.equal(state.streakAlert, null);
      assert.equal(state.workoutSessionStartedAt, null);
      assert.equal(state.workoutSessionEndsAt, null);
      assert.equal(state.workoutSessionDurationMinutes, 90);
      assert.equal(state.workoutSessionPausedRemainingMs, null);
      assert.equal(state.lastUpdated, "2026-04-10");
      assert.deepEqual(state.quietHours, { start: "22:00", end: "07:00" });
      assert.deepEqual(state.drinkLog, []);
    },
  },
  {
    name: "normalizeHydrationState migrates an active legacy workout session",
    run: () => {
      const sessionEndsAt = 1775847600000;
      const state = normalizeHydrationState(
        { workoutSessionEndsAt: sessionEndsAt },
        "2026-04-11"
      );

      assert.equal(state.workoutSessionDurationMinutes, 90);
      assert.equal(state.workoutSessionEndsAt, sessionEndsAt);
      assert.equal(
        state.workoutSessionStartedAt,
        sessionEndsAt - 90 * 60 * 1000
      );
      assert.equal(state.workoutSessionPausedRemainingMs, null);
    },
  },
  {
    name: "normalizeHydrationState preserves a paused workout without activating its timer",
    run: () => {
      const state = normalizeHydrationState(
        {
          workoutSessionDurationMinutes: 60,
          workoutSessionPausedRemainingMs: 18 * 60 * 1000,
        },
        "2026-04-11"
      );

      assert.equal(state.workoutSessionDurationMinutes, 60);
      assert.equal(state.workoutSessionEndsAt, null);
      assert.equal(state.workoutSessionPausedRemainingMs, 18 * 60 * 1000);
    },
  },
  {
    name: "normalizeHydrationState clamps invalid hydration values",
    run: () => {
      const state = normalizeHydrationState({ intake: -200, goal: 100000, quickAddAmount: 2 }, "2026-04-11");

      assert.equal(state.intake, 0);
      assert.equal(state.goal, 10000);
      assert.equal(state.quickAddAmount, 50);
    },
  },
  {
    name: "normalizeHydrationState keeps valid drink notes and removes invalid log rows",
    run: () => {
      const state = normalizeHydrationState(
        {
          drinkLog: [
            { id: "drink-1", amount: 330, timestamp: 1775847600000, note: "tea" },
            { id: "drink-2", amount: Number.NaN, timestamp: 1775847600000, note: "sparkles" },
          ],
        } as unknown as Parameters<typeof normalizeHydrationState>[0],
        "2026-04-11"
      );

      assert.deepEqual(state.drinkLog, [
        {
          id: "drink-1",
          amount: 330,
          timestamp: 1775847600000,
          drinkType: "tea",
        },
      ]);
    },
  },
  {
    name: "normalizeHydrationState separates legacy workout water from its context",
    run: () => {
      const state = normalizeHydrationState(
        {
          drinkLog: [
            {
              id: "workout-water",
              amount: 250,
              timestamp: 1775847600000,
              note: "workout",
            },
          ],
          history: [
            {
              date: "2026-04-10",
              intake: 500,
              goal: 2500,
              breakdown: { water: 250, workout: 250 },
            },
          ],
        } as unknown as Parameters<typeof normalizeHydrationState>[0],
        "2026-04-11"
      );

      assert.deepEqual(state.drinkLog, [
        {
          id: "workout-water",
          amount: 250,
          timestamp: 1775847600000,
          drinkType: "water",
          context: "workout",
        },
      ]);
      assert.deepEqual(state.history[0].breakdown, { water: 500 });
      assert.deepEqual(state.history[0].contextBreakdown, { workout: 250 });
    },
  },
  {
    name: "weekly stats exclude future days and compare matching elapsed periods",
    run: () => {
      const anchor = new Date(2026, 3, 7, 12);
      const stats = buildWeeklyHydrationStats({
        anchor,
        history: [
          { date: "2026-04-06", intake: 2000, goal: 2500 },
          { date: "2026-03-30", intake: 1000, goal: 2500 },
          { date: "2026-03-31", intake: 1000, goal: 2500 },
        ],
        todayIntake: 2000,
        currentGoal: 2500,
      });

      assert.equal(stats.elapsedDays, 2);
      assert.equal(stats.daysWithHydration, 2);
      assert.equal(stats.dailyAverage, 2000);
      assert.equal(stats.previousDailyAverage, 1000);
      assert.equal(stats.averageDelta, 1000);
      assert.equal(stats.canComparePeriods, true);
      assert.equal(stats.chartDays.filter((day) => day.isFuture).length, 5);
    },
  },
  {
    name: "rolling stats compare the latest 30 days with the previous 30 days",
    run: () => {
      const stats = buildRollingHydrationStats({
        anchor: new Date(2026, 3, 30, 12),
        history: [
          { date: "2026-04-01", intake: 3000, goal: 2500 },
          { date: "2026-04-02", intake: 3000, goal: 2500 },
          { date: "2026-03-02", intake: 1000, goal: 2500 },
          { date: "2026-03-03", intake: 1000, goal: 2500 },
          { date: "2026-03-04", intake: 1000, goal: 2500 },
        ],
        todayIntake: 3000,
        currentGoal: 2500,
      });

      assert.equal(stats.chartDays.length, 30);
      assert.equal(stats.chartDays[0].date, "2026-04-01");
      assert.equal(stats.chartDays[29].date, "2026-04-30");
      assert.equal(stats.daysWithHydration, 3);
      assert.equal(stats.dailyAverage, 300);
      assert.equal(stats.previousDailyAverage, 100);
      assert.equal(stats.averageDelta, 200);
      assert.equal(stats.canComparePeriods, true);
    },
  },
  {
    name: "hydration insight exposes every weekly and 30-day message state",
    run: () => {
      const makeStats = ({
        daysWithHydration,
        elapsedDays,
        averageDelta,
        canComparePeriods,
      }: {
        daysWithHydration: number;
        elapsedDays: number;
        averageDelta: number;
        canComparePeriods: boolean;
      }) => ({
        chartDays: [],
        elapsedDays,
        daysWithHydration,
        dailyAverage: 0,
        previousDailyAverage: 0,
        averageDelta,
        canComparePeriods,
      });
      const states = [
        ["week", makeStats({ daysWithHydration: 0, elapsedDays: 3, averageDelta: 0, canComparePeriods: false }), "empty", "Your week is ready"],
        ["week", makeStats({ daysWithHydration: 1, elapsedDays: 3, averageDelta: 0, canComparePeriods: false }), "forming", "A rhythm is taking shape"],
        ["week", makeStats({ daysWithHydration: 2, elapsedDays: 3, averageDelta: 250, canComparePeriods: true }), "rising", "Your daily average is rising"],
        ["week", makeStats({ daysWithHydration: 2, elapsedDays: 3, averageDelta: -250, canComparePeriods: true }), "falling", "Keep the pace comfortable"],
        ["week", makeStats({ daysWithHydration: 2, elapsedDays: 3, averageDelta: 0, canComparePeriods: true }), "steady", "A steady week so far"],
        ["month", makeStats({ daysWithHydration: 0, elapsedDays: 30, averageDelta: 0, canComparePeriods: false }), "empty", "Your 30-day view is ready"],
        ["month", makeStats({ daysWithHydration: 2, elapsedDays: 30, averageDelta: 0, canComparePeriods: false }), "forming", "Your 30-day rhythm is taking shape"],
        ["month", makeStats({ daysWithHydration: 3, elapsedDays: 30, averageDelta: 250, canComparePeriods: true }), "rising", "Your 30-day average is rising"],
        ["month", makeStats({ daysWithHydration: 3, elapsedDays: 30, averageDelta: -250, canComparePeriods: true }), "falling", "Keep the pace comfortable"],
        ["month", makeStats({ daysWithHydration: 3, elapsedDays: 30, averageDelta: 0, canComparePeriods: true }), "steady", "A steady 30 days"],
      ] as const;

      for (const [range, stats, tone, title] of states) {
        const insight = getHydrationInsight(range, stats);
        assert.equal(insight.tone, tone);
        assert.equal(insight.title, title);
      }
    },
  },
  {
    name: "rolloverHydrationState increments streak and archives yesterday after one sip",
    run: () => {
      const base = getDefaultHydrationState();
      const rolled = rolloverHydrationState(
        {
          ...base,
          intake: 50,
          goal: 2500,
          streak: 2,
          lastUpdated: "2026-04-10",
          drinkLog: [
            {
              id: "drink-1",
              amount: 250,
              timestamp: 1775847600000,
              drinkType: "water",
            },
          ],
        },
        "2026-04-11"
      );

      assert.equal(rolled.intake, 0);
      assert.equal(rolled.streak, 3);
      assert.equal(rolled.streakShieldCharges, MAX_STREAK_SHIELD_CHARGES);
      assert.equal(rolled.lastUpdated, "2026-04-11");
      assert.deepEqual(rolled.history, [{ date: "2026-04-10", intake: 50, goal: 2500, breakdown: { water: 50 } }]);
      assert.deepEqual(rolled.drinkLog, []);
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
      assert.equal(rolled.streakShieldCharges, MAX_STREAK_SHIELD_CHARGES);
      assert.equal(rolled.history.length, 4);
      assert.deepEqual(rolled.history[0], { date: "2026-04-07", intake: 1800, goal: 2500, breakdown: { water: 1800 } });
      assert.deepEqual(rolled.history[1], { date: "2026-04-08", intake: 0, goal: 2500 });
      assert.deepEqual(rolled.history[2], { date: "2026-04-09", intake: 0, goal: 2500 });
      assert.deepEqual(rolled.history[3], { date: "2026-04-10", intake: 0, goal: 2500 });
    },
  },
  {
    name: "rolloverHydrationState uses streak batteries before breaking streak",
    run: () => {
      const base = getDefaultHydrationState();
      const firstMiss = rolloverHydrationState(
        {
          ...base,
          intake: 0,
          goal: 2500,
          streak: 5,
          streakShieldCharges: 2,
          lastUpdated: "2026-04-10",
        },
        "2026-04-11"
      );
      const secondMiss = rolloverHydrationState(
        {
          ...firstMiss,
          lastUpdated: "2026-04-11",
        },
        "2026-04-12"
      );
      const thirdMiss = rolloverHydrationState(
        {
          ...secondMiss,
          lastUpdated: "2026-04-12",
        },
        "2026-04-13"
      );

      assert.equal(firstMiss.streak, 5);
      assert.equal(firstMiss.streakShieldCharges, 1);
      assert.equal(firstMiss.streakAlert?.kind, "shield-used");
      assert.equal(secondMiss.streak, 5);
      assert.equal(secondMiss.streakShieldCharges, 0);
      assert.equal(secondMiss.streakAlert?.shieldCharges, 0);
      assert.equal(thirdMiss.streak, 0);
      assert.equal(thirdMiss.streakShieldCharges, MAX_STREAK_SHIELD_CHARGES);
      assert.equal(thirdMiss.streakAlert?.kind, "streak-lost");
    },
  },
  {
    name: "rolloverHydrationState recharges one streak battery after one sip",
    run: () => {
      const base = getDefaultHydrationState();
      const rolled = rolloverHydrationState(
        {
          ...base,
          intake: 50,
          goal: 2500,
          streak: 5,
          streakShieldCharges: 0,
          lastUpdated: "2026-04-10",
        },
        "2026-04-11"
      );

      assert.equal(rolled.streak, 6);
      assert.equal(rolled.streakShieldCharges, 1);
    },
  },
  {
    name: "notification library exposes unique reminder types",
    run: () => {
      assert.equal(HYDRATION_NOTIFICATION_TYPES.length, 17);
      assert.equal(new Set(HYDRATION_NOTIFICATION_TYPES.map((type) => type.kind)).size, 17);
    },
  },
  {
    name: "pickWorkoutHydrationNotification sends gentle set checks",
    run: () => {
      const now = new Date(2026, 4, 5, 18, 0);
      const message = pickWorkoutHydrationNotification({
        intake: 1200,
        goal: 2500,
        reminderInterval: 40,
        lastDrinkAt: new Date(2026, 4, 5, 17, 10).getTime(),
        lastWorkoutDrinkAt: new Date(2026, 4, 5, 17, 45).getTime(),
        workoutSessionEndsAt: new Date(2026, 4, 5, 19, 0).getTime(),
        now,
        isCatchUp: false,
      });

      assert.equal(message?.kind, "workout-set-check");
      assert.equal(message?.actionAmount, WORKOUT_NOTIFICATION_LOG_AMOUNT);
      assert.equal(message?.actionNote, "workout");
      assert.match(message?.body ?? "", /few sips/);
    },
  },
  {
    name: "pickWorkoutHydrationNotification waits after a recent workout log",
    run: () => {
      const now = new Date(2026, 4, 5, 18, 0);
      const message = pickWorkoutHydrationNotification({
        intake: 1200,
        goal: 2500,
        reminderInterval: 40,
        lastDrinkAt: new Date(2026, 4, 5, 17, 55).getTime(),
        lastWorkoutDrinkAt: new Date(2026, 4, 5, 17, 55).getTime(),
        workoutSessionEndsAt: new Date(2026, 4, 5, 19, 0).getTime(),
        now,
        isCatchUp: false,
      });

      assert.equal(message, null);
    },
  },
  {
    name: "pickHydrationNotification chooses a relevant hydration nudge",
    run: () => {
      const message = pickHydrationNotification({
        intake: 0,
        goal: 2500,
        reminderInterval: 40,
        lastDrinkAt: null,
        now: new Date(2026, 4, 5, 9, 30),
        isCatchUp: false,
      });

      assert.equal(message.kind, "first-log");
      assert.match(message.body, /No water logged today/);
      assert.match(message.body, /250 ml/);
      assert.equal(message.nextDelayMinutes, 15);
    },
  },
  {
    name: "pickHydrationNotification follows up after an ignored first reminder",
    run: () => {
      const message = pickHydrationNotification(
        {
          intake: 0,
          goal: 2500,
          reminderInterval: 40,
          lastDrinkAt: null,
          now: new Date(2026, 4, 5, 9, 45),
          isCatchUp: false,
        },
        "first-log"
      );

      assert.equal(message.kind, "first-log-follow-up");
      assert.match(message.title, /Still no water logged/);
      assert.equal(message.nextDelayMinutes, 15);
    },
  },
  {
    name: "pickHydrationNotification catches a no-water evening",
    run: () => {
      const message = pickHydrationNotification({
        intake: 0,
        goal: 2500,
        reminderInterval: 40,
        lastDrinkAt: null,
        now: new Date(2026, 4, 5, 19, 15),
        isCatchUp: false,
      });

      assert.equal(message.kind, "all-day-empty");
      assert.match(message.body, /Nothing is logged today/);
    },
  },
  {
    name: "pickHydrationNotification keeps return nudges out of interval reminders",
    run: () => {
      const message = pickHydrationNotification({
        intake: 0,
        goal: 2500,
        reminderInterval: 40,
        lastDrinkAt: null,
        now: new Date(2026, 4, 5, 10, 0),
        isCatchUp: true,
        inactiveDays: 22,
      });

      assert.notEqual(message.kind, "weekly-return");
      assert.notEqual(message.kind, "monthly-return");
      assert.equal(message.kind, "first-log");
    },
  },
  {
    name: "pickHydrationNotification uses a close-goal message on interval reminders",
    run: () => {
      const message = pickHydrationNotification({
        intake: 2250,
        goal: 2500,
        reminderInterval: 40,
        lastDrinkAt: new Date(2026, 4, 5, 17, 0).getTime(),
        now: new Date(2026, 4, 5, 19, 0),
        isCatchUp: false,
      });

      assert.equal(message.kind, "close-goal");
      assert.match(message.body, /250 ml would complete today/);
    },
  },
  {
    name: "pickHydrationNotification does not pressure a streak after water was logged",
    run: () => {
      const message = pickHydrationNotification({
        intake: 1500,
        goal: 2500,
        reminderInterval: 40,
        lastDrinkAt: new Date(2026, 4, 5, 16, 0).getTime(),
        now: new Date(2026, 4, 5, 19, 0),
        isCatchUp: false,
        streak: 7,
        streakShieldCharges: 0,
      });

      assert.notEqual(message.kind, "streak-last-chance");
    },
  },
  {
    name: "pickHydrationNotification avoids late-night pressure when far behind",
    run: () => {
      const message = pickHydrationNotification({
        intake: 1200,
        goal: 2500,
        reminderInterval: 40,
        lastDrinkAt: new Date(2026, 4, 5, 18, 30).getTime(),
        now: new Date(2026, 4, 5, 21, 15),
        isCatchUp: false,
        streak: 7,
        streakShieldCharges: 0,
      });

      assert.notEqual(message.kind, "streak-last-chance");
      assert.match(message.body, /comfortable/);
      assert.equal(message.nextDelayMinutes, undefined);
    },
  },
  {
    name: "pickHydrationStreakAlertNotification explains a used battery",
    run: () => {
      const message = pickHydrationStreakAlertNotification({
        id: "2026-05-04-shield-1",
        kind: "shield-used",
        date: "2026-05-04",
        streak: 7,
        shieldCharges: 1,
      });

      assert.equal(message?.kind, "streak-shield-used");
      assert.match(message?.body ?? "", /recharge one battery/);
    },
  },
  {
    name: "pickHydrationLifecycleNotification sends one daily no-water check",
    run: () => {
      const now = new Date(2026, 4, 5, 19, 15);
      const context = {
        intake: 0,
        goal: 2500,
        reminderInterval: 40,
        lastDrinkAt: null,
        now,
        isCatchUp: false,
        inactiveDays: 1,
      };
      const message = pickHydrationLifecycleNotification(context, {
        lastDailyAt: 0,
        lastWeeklyAt: 0,
        lastMonthlyAt: 0,
      });
      const repeated = pickHydrationLifecycleNotification(context, {
        lastDailyAt: new Date(2026, 4, 5, 18, 0).getTime(),
        lastWeeklyAt: 0,
        lastMonthlyAt: 0,
      });

      assert.equal(message?.kind, "all-day-empty");
      assert.equal(message?.cadence, "daily");
      assert.equal(repeated, null);
    },
  },
  {
    name: "pickHydrationLifecycleNotification respects weekly and monthly cadence",
    run: () => {
      const now = new Date(2026, 4, 20, 10, 0);
      const weekly = pickHydrationLifecycleNotification(
        {
          intake: 0,
          goal: 2500,
          reminderInterval: 40,
          lastDrinkAt: null,
          now,
          isCatchUp: true,
          inactiveDays: 4,
        },
        {
          lastDailyAt: 0,
          lastWeeklyAt: 0,
          lastMonthlyAt: 0,
        }
      );
      const weeklyCoolingDown = pickHydrationLifecycleNotification(
        {
          intake: 0,
          goal: 2500,
          reminderInterval: 40,
          lastDrinkAt: null,
          now,
          isCatchUp: true,
          inactiveDays: 4,
        },
        {
          lastDailyAt: 0,
          lastWeeklyAt: new Date(2026, 4, 17, 10, 0).getTime(),
          lastMonthlyAt: 0,
        }
      );
      const monthly = pickHydrationLifecycleNotification(
        {
          intake: 0,
          goal: 2500,
          reminderInterval: 40,
          lastDrinkAt: null,
          now,
          isCatchUp: true,
          inactiveDays: 22,
        },
        {
          lastDailyAt: 0,
          lastWeeklyAt: 0,
          lastMonthlyAt: 0,
        }
      );

      assert.equal(weekly?.kind, "weekly-return");
      assert.equal(weekly?.cadence, "weekly");
      assert.equal(weeklyCoolingDown, null);
      assert.equal(monthly?.kind, "monthly-return");
      assert.equal(monthly?.cadence, "monthly");
    },
  },
  {
    name: "getNextHydrationLifecycleDueAt schedules the daily evening check",
    run: () => {
      const now = new Date(2026, 4, 5, 12, 0);
      const dueAt = getNextHydrationLifecycleDueAt(
        {
          intake: 0,
          goal: 2500,
          reminderInterval: 40,
          lastDrinkAt: null,
          now,
          isCatchUp: false,
          inactiveDays: 1,
        },
        {
          lastDailyAt: 0,
          lastWeeklyAt: 0,
          lastMonthlyAt: 0,
        }
      );

      assert.equal(new Date(dueAt).getHours(), 18);
      assert.equal(new Date(dueAt).getMinutes(), 0);
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
