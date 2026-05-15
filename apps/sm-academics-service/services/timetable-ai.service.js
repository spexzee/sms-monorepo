/**
 * Timetable AI Generation Service
 * A core constraint-satisfaction heuristic algorithm to generate a timetable.
 */

/**
 * Validate if the requested generation is mathematically possible given the teachers.
 */
function validateConstraints(config, classes, teachers, rules, subjects = [], options = {}) {
  const errors = [];
  const instructionalPeriods = config.periods.filter(p => !['break', 'lunch', 'assembly'].includes(p.type));
  const periodsPerDay = instructionalPeriods.length;

  // Calculate effective max periods per teacher considering day limits
  const teacherMaxPeriods = config.workingDays.reduce((total, day) => {
    const dayLimit = options.dayLimits?.[day.toLowerCase()];
    const effectivePeriods = dayLimit && dayLimit > 0 ? Math.min(dayLimit, periodsPerDay) : periodsPerDay;
    return total + effectivePeriods;
  }, 0);

  // Create subject map for names
  const subjectMap = {};
  subjects.forEach(s => (subjectMap[s.subjectId] = s.name || s.subjectId));

  const subjectNeeds = {};
  const subjectAvailability = {};

  // 1. Calculate needs
  classes.forEach(cls => {
    cls.sections.forEach(() => {
      rules.forEach(rule => {
        if (!subjectNeeds[rule.subjectId]) subjectNeeds[rule.subjectId] = 0;
        subjectNeeds[rule.subjectId] += rule.periodsPerWeek;
      });
    });
  });

  // 2. Count teacher availability
  teachers.forEach(teacher => {
    const teacherSubjects =
      teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects : [];
    teacherSubjects.forEach(sub => {
      if (!subjectAvailability[sub]) subjectAvailability[sub] = 0;
      subjectAvailability[sub] += teacherMaxPeriods;
    });
  });

  // 3. Verify
  Object.keys(subjectNeeds).forEach(subjectId => {
    const needed = subjectNeeds[subjectId];
    const available = subjectAvailability[subjectId] || 0;
    if (available < needed) {
      const subjectName = subjectMap[subjectId] || subjectId;
      errors.push(
        `Shortage for ${subjectName}: Needs ${needed} periods/week across all classes, ` +
        `but available teachers can only provide at most ${available}. ` +
        `Please assign more teachers to this subject.`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * The core algorithm logic (internal).
 */
function attemptGeneration(config, classes, teachers, subjects, rules, options = {}) {
  const schedule = [];
  const subjectMap = {};
  subjects.forEach(s => (subjectMap[s.subjectId] = s.name || s.subjectId));

  const workingDays = config.workingDays;
  const instructionalPeriods = config.periods
    .filter(p => !['break', 'lunch', 'assembly'].includes(p.type))
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // Teacher status and workload tracking
  const teacherStatus = {};
  const teacherWorkload = {};

  // sectionKey -> day -> subjectId -> count
  const sectionDailyCounts = {};

  teachers.forEach(t => {
    teacherWorkload[t.teacherId] = 0;
    teacherStatus[t.teacherId] = {};
    workingDays.forEach(d => {
      teacherStatus[t.teacherId][d] = {};
      instructionalPeriods.forEach(p => {
        teacherStatus[t.teacherId][d][p.periodNumber] = false;
      });
    });
  });

  const allSections = [];
  classes.forEach(c => {
    c.sections.forEach(s => {
      const sectionKey = `${c.classId}-${s.sectionId}`;
      allSections.push({
        ...s,
        classId: c.classId,
        className: c.name,
        sectionName: s.name,
        sectionKey
      });
      sectionDailyCounts[sectionKey] = {};
      workingDays.forEach(d => (sectionDailyCounts[sectionKey][d] = {}));
    });
  });

  // Flatten ALL needed periods into a single job list to break section bias
  const jobs = [];
  const shuffledSections = shuffleArray(allSections);

    for (const section of shuffledSections) {
      const sortedRules = [...rules].sort((a, b) => {
        const aTeachers = teachers.filter(t => t.subjects?.includes(a.subjectId) || t.subjects?.length === 0).length;
        const bTeachers = teachers.filter(t => t.subjects?.includes(b.subjectId) || t.subjects?.length === 0).length;
        if (aTeachers !== bTeachers) return aTeachers - bTeachers; // fewer teachers first
        if (b.periodsPerWeek !== a.periodsPerWeek) return b.periodsPerWeek - a.periodsPerWeek;
        if ((b.morningPriority ? 1 : 0) !== (a.morningPriority ? 1 : 0)) {
          return (b.morningPriority ? 1 : 0) - (a.morningPriority ? 1 : 0);
        }
        return Math.random() - 0.5;
      });

    for (const rule of sortedRules) {
      for (let pIter = 0; pIter < rule.periodsPerWeek; pIter++) {
        jobs.push({ section, rule });
      }
    }
  }

  // Shuffle all jobs globally to resolve teacher bottlenecks
  const shuffledJobs = shuffleArray(jobs);

  for (const job of shuffledJobs) {
    const { section, rule } = job;
    const { sectionKey } = section;
    const maxPerDay = rule.maxPeriodsPerDay || 99;

    const eligibleTeachers = teachers.filter(
      t => t.subjects?.includes(rule.subjectId) || t.subjects?.length === 0
    );

    if (eligibleTeachers.length === 0) {
      throw new Error(
        `Failed to generate: No teacher found for ${subjectMap[rule.subjectId] || rule.subjectId}`
      );
    }

    let placed = false;

    // Primary pass: search days in random order with all constraints
    const shuffledDays = shuffleArray(workingDays);

    for (const day of shuffledDays) {
      const currentDayCount = sectionDailyCounts[sectionKey][day][rule.subjectId] || 0;
      if (currentDayCount >= maxPerDay) continue;

      let searchPeriods = [...instructionalPeriods];

      const dayLimit = options.dayLimits?.[day.toLowerCase()];
      if (dayLimit && dayLimit > 0) {
        searchPeriods = searchPeriods.slice(0, dayLimit);
      }

      if (rule.morningPriority) {
        const morningCount = Math.ceil(searchPeriods.length / 2);
        const morning = shuffleArray(searchPeriods.slice(0, morningCount));
        const afternoon = shuffleArray(searchPeriods.slice(morningCount));
        searchPeriods = [...morning, ...afternoon];
      } else {
        searchPeriods = shuffleArray(searchPeriods);
      }

      for (const period of searchPeriods) {
        const pNum = period.periodNumber;
        const classBusy = schedule.some(
          e =>
            e.classId === section.classId &&
            e.sectionId === section.sectionId &&
            e.dayOfWeek === day &&
            e.periodNumber === pNum
        );
        if (classBusy) continue;

        // HEURISTIC: Pick the teacher with the least current workload
        const availableTeachers = eligibleTeachers
          .filter(t => !teacherStatus[t.teacherId][day][pNum])
          .sort((a, b) => teacherWorkload[a.teacherId] - teacherWorkload[b.teacherId]);

        const assignedTeacher = availableTeachers[0];

        if (assignedTeacher) {
          schedule.push({
            classId: section.classId,
            sectionId: section.sectionId,
            subjectId: rule.subjectId,
            teacherId: assignedTeacher.teacherId,
            dayOfWeek: day,
            periodNumber: pNum
          });
          teacherStatus[assignedTeacher.teacherId][day][pNum] = true;
          teacherWorkload[assignedTeacher.teacherId]++;
          sectionDailyCounts[sectionKey][day][rule.subjectId] =
            (sectionDailyCounts[sectionKey][day][rule.subjectId] || 0) + 1;
          placed = true;
          break;
        }
      }

      if (placed) break;
    }

    // Fallback pass: search everything without morning priority
    if (!placed) {
      const fallbackDays = shuffleArray(workingDays);

      for (const day of fallbackDays) {
        const currentDayCount = sectionDailyCounts[sectionKey][day][rule.subjectId] || 0;
        if (currentDayCount >= maxPerDay) continue;

        let fallbackPeriods = [...instructionalPeriods];
        const dayLimit = options.dayLimits?.[day.toLowerCase()];
        if (dayLimit && dayLimit > 0) {
          fallbackPeriods = fallbackPeriods.slice(0, dayLimit);
        }
        fallbackPeriods = shuffleArray(fallbackPeriods);

        for (const period of fallbackPeriods) {
          const pNum = period.periodNumber;
          const classBusy = schedule.some(
            e =>
              e.classId === section.classId &&
              e.sectionId === section.sectionId &&
              e.dayOfWeek === day &&
              e.periodNumber === pNum
          );
          if (classBusy) continue;

          const availableTeachers = eligibleTeachers
            .filter(t => !teacherStatus[t.teacherId][day][pNum])
            .sort((a, b) => teacherWorkload[a.teacherId] - teacherWorkload[b.teacherId]);

          const assignedTeacher = availableTeachers[0];

          if (assignedTeacher) {
            schedule.push({
              classId: section.classId,
              sectionId: section.sectionId,
              subjectId: rule.subjectId,
              teacherId: assignedTeacher.teacherId,
              dayOfWeek: day,
              periodNumber: pNum
            });
            teacherStatus[assignedTeacher.teacherId][day][pNum] = true;
            teacherWorkload[assignedTeacher.teacherId]++;
            sectionDailyCounts[sectionKey][day][rule.subjectId] =
              (sectionDailyCounts[sectionKey][day][rule.subjectId] || 0) + 1;
            placed = true;
            break;
          }
        }

        if (placed) break;
      }
    }

    // Final fallback: ignore dayLimits if still not placed
    if (!placed) {
      const finalDays = shuffleArray(workingDays);

      for (const day of finalDays) {
        const currentDayCount = sectionDailyCounts[sectionKey][day][rule.subjectId] || 0;
        if (currentDayCount >= maxPerDay) continue;

        const finalPeriods = shuffleArray(instructionalPeriods);

        for (const period of finalPeriods) {
          const pNum = period.periodNumber;
          const classBusy = schedule.some(
            e =>
              e.classId === section.classId &&
              e.sectionId === section.sectionId &&
              e.dayOfWeek === day &&
              e.periodNumber === pNum
          );
          if (classBusy) continue;

          const availableTeachers = eligibleTeachers
            .filter(t => !teacherStatus[t.teacherId][day][pNum])
            .sort((a, b) => teacherWorkload[a.teacherId] - teacherWorkload[b.teacherId]);

          const assignedTeacher = availableTeachers[0];

          if (assignedTeacher) {
            schedule.push({
              classId: section.classId,
              sectionId: section.sectionId,
              subjectId: rule.subjectId,
              teacherId: assignedTeacher.teacherId,
              dayOfWeek: day,
              periodNumber: pNum
            });
            teacherStatus[assignedTeacher.teacherId][day][pNum] = true;
            teacherWorkload[assignedTeacher.teacherId]++;
            sectionDailyCounts[sectionKey][day][rule.subjectId] =
              (sectionDailyCounts[sectionKey][day][rule.subjectId] || 0) + 1;
            placed = true;
            break;
          }
        }

        if (placed) break;
      }
    }

    if (!placed) {
      const subjectName = subjectMap[rule.subjectId] || rule.subjectId;
      const eligibleCount = teachers.filter(
        t => t.subjects?.includes(rule.subjectId) || t.subjects?.length === 0
      ).length;
      throw new Error(
        `Failed to place period for ${subjectName} in Class ${section.className}-${section.sectionName}. ` +
        `Eligible teachers: ${eligibleCount}, Periods needed per week: ${rule.periodsPerWeek}, ` +
        `Max per day: ${rule.maxPeriodsPerDay}, Morning priority: ${rule.morningPriority}`
      );
    }
  }

  return schedule; // ✅ Inside attemptGeneration
}

/**
 * The core algorithm to generate the timetable.
 * Uses a robust heuristic approach with randomization and retries.
 */
function generateTimetable(config, classes, teachers, subjects, rules, options = {}) {
  const maxRetries = 200;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return attemptGeneration(config, classes, teachers, subjects, rules, options);
    } catch (error) {
      lastError = error;
      console.warn(
        `Timetable Generation Attempt ${attempt} failed: ${error.message}. Retrying...`
      );
    }
  }

  throw lastError;
}

const TimetableAIService = {
  validateConstraints,
  generateTimetable
};

module.exports = TimetableAIService;