# Graph Report - fluid  (2026-05-26)

## Corpus Check
- 33 files · ~16,668 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 193 nodes · 325 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2c1a0f61`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `useHydration()` - 11 edges
2. `Card()` - 8 edges
3. `useNotifications()` - 8 edges
4. `formatDateLocal()` - 8 edges
5. `pickHydrationLifecycleNotification()` - 7 edges
6. `Home()` - 6 edges
7. `Button()` - 6 edges
8. `getSnapshot()` - 6 edges
9. `normalizeHydrationState()` - 6 edges
10. `StatsPage()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --calls--> `useHydration()`  [EXTRACTED]
  src/app/page.tsx → src/hooks/useHydration.ts
- `Home()` --calls--> `useNotifications()`  [EXTRACTED]
  src/app/page.tsx → src/hooks/useNotifications.ts
- `SettingsPage()` --calls--> `useHydration()`  [EXTRACTED]
  src/app/settings/page.tsx → src/hooks/useHydration.ts
- `StatsPage()` --calls--> `useHydration()`  [EXTRACTED]
  src/app/stats/page.tsx → src/hooks/useHydration.ts
- `StatsPage()` --calls--> `formatDateLocal()`  [EXTRACTED]
  src/app/stats/page.tsx → src/lib/date.ts

## Communities (16 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (23): DataSettings(), DataSettingsProps, formatGoal(), GOAL_PRESETS, GoalSettings(), GoalSettingsProps, NavSettings(), NavSettingsProps (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (22): metadata, viewport, BottomNav(), NAV_ITEMS, PAGES, SwipeDirection, SwipeNavigation(), TouchState (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (24): emitChange(), getCurrentState(), getDefaultState(), getSnapshot(), listeners, persistState(), SERVER_SNAPSHOT, updateState() (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (18): createNotificationMessage(), followUpDelay(), getDailyCheckTimestamp(), getHour(), getNextHydrationLifecycleDueAt(), getNotificationType(), getProgress(), getRemaining() (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (18): getHomeStatusMessage(), getNoteLabel(), Home(), NOTE_OPTIONS, ONBOARDING_FAVORITE_AMOUNTS, ONBOARDING_GOALS, ONBOARDING_REMINDERS, QUICK_AMOUNTS (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (14): getConsecutiveDryDays(), NotificationManager(), FluidNotificationOptions, getLifecycleNotificationState(), getQuietWindowEnd(), getSafeHydrationStatus(), getServiceWorkerRegistration(), getStoredTimestamp() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.27
Nodes (8): BAR_DELAYS, HydrationLoadingState(), HydrationLoadingStateProps, DAY_NAMES, getMonthDays(), getWeekDates(), MONTH_FORMATTER, StatsPage()

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **50 isolated node(s):** `eslintConfig`, `nextConfig`, `config`, `metadata`, `viewport` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useHydration()` connect `Community 1` to `Community 0`, `Community 2`, `Community 4`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `useNotifications()` connect `Community 5` to `Community 0`, `Community 4`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `NotificationManager()` connect `Community 5` to `Community 1`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `config` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._