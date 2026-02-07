/**
 * Seed dummy data for the current workspace: tasks, sprints, validations.
 * Call from the client with workspaceId and userId.
 */

import {
  createTask,
  createSprint,
  createValidationEntry,
  getTasksForSprint,
  lockSprint,
  closeSprint,
  updateTask,
  getSprints,
} from "./firestore";

function lastWeekDates(): { start: string; end: string } {
  const now = new Date();
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  const day = lastWeek.getDay();
  const diff = lastWeek.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(lastWeek);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function thisWeekDates(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export async function seedDummyData(
  workspaceId: string,
  userId: string
): Promise<void> {
  const taskTitles = [
    "Set up landing page",
    "User authentication",
    "Dashboard UI",
    "API integration",
    "Testing & bug fixes",
    "Deploy to production",
  ];

  const taskIds: string[] = [];
  for (const title of taskTitles) {
    const id = await createTask(workspaceId, null, null, title, userId);
    taskIds.push(id);
  }

  const lastWeek = lastWeekDates();
  const thisWeek = thisWeekDates();

  const sprint1TaskIds = taskIds.slice(0, 3);
  const sprint1Id = await createSprint(
    workspaceId,
    lastWeek.start,
    lastWeek.end,
    [],
    sprint1TaskIds,
    userId
  );

  await updateTask(taskIds[0], { status: "done" });
  await updateTask(taskIds[1], { status: "done" });
  await lockSprint(sprint1Id);
  const sprint1Tasks = await getTasksForSprint(sprint1Id);
  const completed = sprint1Tasks.filter((t) => t.status === "done").length;
  const total = sprint1Tasks.length;
  await closeSprint(sprint1Id, {
    tasksCompleted: completed,
    tasksTotal: total,
    completionPercentage: total ? Math.round((completed / total) * 100) : 0,
    blockedTaskIds: sprint1Tasks.filter((t) => t.status !== "done").map((t) => t.id),
    missedGoalIds: [],
    closedAt: Date.now(),
  });

  const sprint2TaskIds = taskIds.slice(3, 6);
  await createSprint(
    workspaceId,
    thisWeek.start,
    thisWeek.end,
    [],
    sprint2TaskIds,
    userId
  );

  await createValidationEntry(
    workspaceId,
    sprint1Id,
    null,
    "interview",
    "5 user interviews: strong interest in simplicity and speed",
    "Users want fewer steps to create a sprint.",
    userId
  );

  const sprints = await getSprints(workspaceId);
  const currentSprint = sprints.find((s) => !s.completed && s.taskIds.length > 0);
  if (currentSprint) {
    await createValidationEntry(
      workspaceId,
      currentSprint.id,
      null,
      "survey",
      "NPS survey sent to 20 beta users",
      "Early results positive.",
      userId
    );
  }
}
