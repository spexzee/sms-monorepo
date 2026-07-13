# Analysis: Timetable Generation Algorithm & Architecture

This document provides a technical overview of the AI-powered timetable generation system, its current implementation, and identified issues for future reference.

## 1. System Architecture

The system follows a standard client-server architecture with a specific service dedicated to the scheduling logic.

### Frontend Components
- **TimetableMaster.tsx**: The main management interface (Generate button currently commented out).
- **AITimetableGenerateDialog.tsx**: The wizard UI for configuring subject rules (Periods/Week, Max/Day, Morning Priority) and global options (Half-day Saturday).
- **Timetable Queries**: TanStack Query hooks (`useValidateAITimetable`, `useGenerateAITimetable`) connecting to the backend.

### Backend Components
- **Routes**: Defines `/ai/validate` and `/ai/generate` endpoints in `sm-academics-service`.
- **AI Controller**: Orchestrates data fetching (Teachers, Classes, Config) and calls the AI service.
- **AI Service**: The core engine containing the generation logic (`timetable-ai.service.js`).

---

## 2. Core Algorithm Analysis

The engine uses a **Randomized Heuristic Constraint Satisfaction** approach.

### Generation Logic (`attemptGeneration`)
1.  **Job Preparation**: All required periods (e.g., "Math for 8-A") are flattened into a "jobs" list.
2.  **Initial Sorting**: Rules are sorted by "Constraint Density" (subjects with the fewest available teachers are prioritized).
3.  **Global Shuffling**: All jobs are shuffled to prevent section-based bias and ensure teacher distribution.
4.  **Three-Pass Placement Strategy**:
    - **Pass 1 (Strict)**: Respects `morningPriority`, `maxPeriodsPerDay`, and `dayLimits` (e.g., Saturday cutoff).
    - **Pass 2 (Relaxed)**: Ignores `morningPriority` but keeps other constraints.
    - **Pass 3 (Emergency)**: Ignores `dayLimits` (e.g., fills afternoon slots on a half-day if absolutely necessary).
5.  **Teacher Selection**: Uses a "Least Workload First" heuristic to balance teacher schedules.
6.  **Retries**: If any job fails to place after all three passes, the entire process is discarded and restarted (up to 200 retries).

---

## 3. Current Issues & Failure Points

The "Generate" button was disabled because the algorithm frequently fails on tightly constrained schedules.

### Identified Technical Weaknesses
1.  **Lack of Backtracking**: The algorithm is "greedy." If it makes a choice early on that causes a failure later, it cannot move that period. It simply fails and retries from scratch.
2.  **Deadlocks in Shuffling**: Random shuffling can accidentally cluster difficult subjects for the same teacher or class, causing early placement failures.
3.  **Teacher Overlap Blindness**: Validation checks total hours per subject but doesn't account for teachers who teach multiple different subjects (the "Shared Resource" problem).
4.  **Morning Priority Conflicts**: If too many subjects are marked "Morning Priority," Pass 1 will almost always fail, forcing the algorithm to ignore priorities.

---

## 4. Recommendations for Future Improvements

- **Implementation of Backtracking**: Instead of full restarts, implement a "Conflict-Directed Backjumping" or "Min-Conflicts" algorithm.
- **Weight-Based Scoring**: Replace the 3-pass system with a scoring mechanism (Soft Constraints) using penalties for breaking priorities.
- **Pre-check for Teacher Overlaps**: Improve validation to detect when a single teacher's total load across *all* their subjects exceeds the school's total periods.
- **Optimization with Web Workers**: Move the generation loop to a background worker to prevent blocking the Node.js event loop.
