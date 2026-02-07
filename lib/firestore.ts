/**
 * Firestore CRUD and queries for Runway domain.
 * All IDs are document IDs; subcollections not used for simplicity.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { COLLECTIONS } from "./constants";
import type {
  StartupWorkspace,
  Task,
  Sprint,
  ValidationEntry,
  LedgerEntry,
  WorkspaceMember,
  UserRole,
} from "./types";

const toMillis = (t: Timestamp | undefined) => (t ? t.toMillis() : 0);

// ---- Workspaces ----
export async function createWorkspace(
  name: string,
  stage: StartupWorkspace["stage"],
  founderId: string,
  founderEmail: string,
  founderDisplayName: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.WORKSPACES));
  const members: WorkspaceMember[] = [
    { userId: founderId, role: "founder", email: founderEmail, displayName: founderDisplayName },
  ];
  await setDoc(ref, {
    name,
    stage,
    createdBy: founderId,
    members,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getWorkspace(workspaceId: string): Promise<StartupWorkspace | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    name: d.name,
    stage: d.stage,
    createdBy: d.createdBy,
    members: d.members ?? [],
    createdAt: toMillis(d.createdAt),
  };
}

export async function getWorkspacesForUser(userId: string): Promise<StartupWorkspace[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, COLLECTIONS.WORKSPACES),
    where("members", "array-contains-any", [{ userId }]), // Firestore: need to query by member userId
    orderBy("createdAt", "desc")
  );
  // Firestore doesn't support array-contains-any on objects. Use a membersUserId array for indexing.
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.WORKSPACES), orderBy("createdAt", "desc"))
  );
  const out: StartupWorkspace[] = [];
  snap.docs.forEach((s) => {
    const d = s.data();
    const members = (d.members ?? []) as WorkspaceMember[];
    if (members.some((m) => m.userId === userId)) {
      out.push({
        id: s.id,
        name: d.name,
        stage: d.stage,
        createdBy: d.createdBy,
        members: members,
        createdAt: toMillis(d.createdAt) || Date.now(),
      });
    }
  });
  return out;
}

export async function updateWorkspace(
  workspaceId: string,
  updates: Partial<Pick<StartupWorkspace, "name" | "stage" | "members">>
) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId), updates as DocumentData);
}

// ---- Tasks ----
export async function createTask(
  workspaceId: string,
  milestoneId: string | null,
  sprintId: string | null,
  title: string,
  ownerId: string | null
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.TASKS));
  const now = Date.now();
  await setDoc(ref, {
    workspaceId,
    milestoneId: milestoneId ?? null,
    sprintId,
    title,
    ownerId,
    status: "todo",
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getTasksForWorkspace(workspaceId: string): Promise<Task[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.TASKS), where("workspaceId", "==", workspaceId))
  );
  const tasks = snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      milestoneId: d.milestoneId ?? null,
      sprintId: d.sprintId ?? null,
      title: d.title,
      ownerId: d.ownerId ?? null,
      status: d.status,
      createdAt: d.createdAt ?? 0,
      updatedAt: d.updatedAt ?? 0,
    };
  });
  tasks.sort((a, b) => b.updatedAt - a.updatedAt);
  return tasks;
}

export async function getTasksForSprint(sprintId: string): Promise<Task[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.TASKS), where("sprintId", "==", sprintId))
  );
  const tasks = snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      milestoneId: d.milestoneId ?? null,
      sprintId: d.sprintId ?? null,
      title: d.title,
      ownerId: d.ownerId ?? null,
      status: d.status,
      createdAt: d.createdAt ?? 0,
      updatedAt: d.updatedAt ?? 0,
    };
  });
  tasks.sort((a, b) => b.updatedAt - a.updatedAt);
  return tasks;
}

export async function updateTask(
  taskId: string,
  updates: Partial<Pick<Task, "status" | "ownerId" | "title" | "sprintId">>
) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), {
    ...updates,
    updatedAt: Date.now(),
  } as DocumentData);
}

// ---- Sprints ----
export async function createSprint(
  workspaceId: string,
  weekStartDate: string,
  weekEndDate: string,
  goals: { id: string; text: string }[],
  taskIds: string[],
  createdBy: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.SPRINTS));
  await setDoc(ref, {
    workspaceId,
    weekStartDate,
    weekEndDate,
    goals,
    taskIds,
    locked: false,
    completed: false,
    completionStats: null,
    createdAt: serverTimestamp(),
    createdBy,
  });
  for (const taskId of taskIds) {
    await updateTask(taskId, { sprintId: ref.id });
  }
  return ref.id;
}

export async function getSprints(workspaceId: string): Promise<Sprint[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.SPRINTS), where("workspaceId", "==", workspaceId))
  );
  const sprints = snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      weekStartDate: d.weekStartDate,
      weekEndDate: d.weekEndDate,
      goals: d.goals ?? [],
      taskIds: d.taskIds ?? [],
      locked: d.locked ?? false,
      completed: d.completed ?? false,
      completionStats: d.completionStats ?? null,
      createdAt: toMillis(d.createdAt),
      createdBy: d.createdBy,
    };
  });
  sprints.sort((a, b) => b.createdAt - a.createdAt);
  return sprints.slice(0, 50);
}

export async function lockSprint(sprintId: string) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTIONS.SPRINTS, sprintId), { locked: true });
}

export async function closeSprint(
  sprintId: string,
  completionStats: Sprint["completionStats"]
) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTIONS.SPRINTS, sprintId), {
    completed: true,
    completionStats: completionStats,
  });
}

export async function deleteSprint(sprintId: string): Promise<void> {
  const db = getFirebaseDb();
  const tasks = await getTasksForSprint(sprintId);
  for (const t of tasks) {
    await updateTask(t.id, { sprintId: null });
  }
  await deleteDoc(doc(db, COLLECTIONS.SPRINTS, sprintId));
}

export async function getSprint(sprintId: string): Promise<Sprint | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, COLLECTIONS.SPRINTS, sprintId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    workspaceId: d.workspaceId,
    weekStartDate: d.weekStartDate,
    weekEndDate: d.weekEndDate,
    goals: d.goals ?? [],
    taskIds: d.taskIds ?? [],
    locked: d.locked ?? false,
    completed: d.completed ?? false,
    completionStats: d.completionStats ?? null,
    createdAt: toMillis(d.createdAt),
    createdBy: d.createdBy,
  };
}

// ---- Validations ----
export async function createValidationEntry(
  workspaceId: string,
  sprintId: string,
  milestoneId: string | null,
  type: ValidationEntry["type"],
  summary: string,
  qualitativeNotes: string,
  createdBy: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.VALIDATIONS));
  await setDoc(ref, {
    workspaceId,
    sprintId,
    milestoneId: milestoneId ?? null,
    type,
    summary,
    qualitativeNotes,
    createdBy,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getValidationsForWorkspace(
  workspaceId: string
): Promise<ValidationEntry[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.VALIDATIONS), where("workspaceId", "==", workspaceId))
  );
  const entries = snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      sprintId: d.sprintId,
      milestoneId: d.milestoneId ?? null,
      type: d.type,
      summary: d.summary,
      qualitativeNotes: d.qualitativeNotes,
      createdBy: d.createdBy,
      createdAt: toMillis(d.createdAt),
    };
  });
  entries.sort((a, b) => b.createdAt - a.createdAt);
  return entries.slice(0, 100);
}

// ---- Ledger (blockchain mock) ----
export async function addLedgerEntry(
  workspaceId: string,
  sprintId: string,
  type: LedgerEntry["type"],
  hash: string,
  payloadSummary: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.LEDGER));
  await setDoc(ref, {
    workspaceId,
    sprintId,
    type,
    hash,
    timestamp: Date.now(),
    payloadSummary,
  });
  return ref.id;
}

export async function getLedgerForWorkspace(
  workspaceId: string
): Promise<LedgerEntry[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.LEDGER), where("workspaceId", "==", workspaceId))
  );
  const entries = snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      sprintId: d.sprintId,
      type: d.type,
      hash: d.hash,
      timestamp: d.timestamp ?? 0,
      payloadSummary: d.payloadSummary ?? "",
    };
  });
  entries.sort((a, b) => b.timestamp - a.timestamp);
  return entries.slice(0, 50);
}
