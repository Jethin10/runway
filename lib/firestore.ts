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
  Milestone,
  Task,
  Sprint,
  ValidationEntry,
  LedgerEntry,
  WorkspaceMember,
  UserRole,
  WorkspaceInvite,
  FundingRound,
  FundingAllocation,
  SpendLog,
  ExecutionAuditLogEntry,
  ExecutionAuditLogType,
  FundingSource,
  FundingCategory,
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
    milestoneIds: [],
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
    milestoneIds: d.milestoneIds ?? [],
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
        milestoneIds: d.milestoneIds ?? [],
        createdAt: toMillis(d.createdAt) || Date.now(),
      });
    }
  });
  return out;
}

/** Remove undefined values so Firestore doesn't reject the update. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item !== null && typeof item === "object" && !Array.isArray(item)
          ? stripUndefined(item as Record<string, unknown>)
          : item
      );
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out[k] = stripUndefined(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function updateWorkspace(
  workspaceId: string,
  updates: Partial<Pick<StartupWorkspace, "name" | "stage" | "members">>
) {
  const db = getFirebaseDb();
  const safe = stripUndefined(updates as Record<string, unknown>);
  await updateDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId), safe as DocumentData);
}

// ---- Workspace invites (invite-by-link only; no email sending) ----
function randomToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

export async function createWorkspaceInvite(
  workspaceId: string,
  role: UserRole,
  createdBy: string
): Promise<{ inviteId: string; token: string }> {
  const db = getFirebaseDb();
  const token = randomToken();
  const ref = doc(collection(db, COLLECTIONS.WORKSPACE_INVITES));
  await setDoc(ref, {
    workspaceId,
    role,
    token,
    createdBy,
    createdAt: serverTimestamp(),
    expiresAt: null,
    used: false,
  });
  return { inviteId: ref.id, token };
}

export async function getInviteByWorkspaceAndToken(
  workspaceId: string,
  token: string
): Promise<WorkspaceInvite | null> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, COLLECTIONS.WORKSPACE_INVITES),
    where("workspaceId", "==", workspaceId),
    where("token", "==", token),
    where("used", "==", false),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  const docSnap = snap.docs[0];
  return {
    id: docSnap.id,
    workspaceId: d.workspaceId,
    role: d.role,
    token: d.token,
    createdBy: d.createdBy,
    createdAt: toMillis(d.createdAt),
    expiresAt: d.expiresAt != null ? toMillis(d.expiresAt) : null,
    used: d.used === true,
    usedBy: d.usedBy ?? null,
    usedAt: d.usedAt != null ? toMillis(d.usedAt) : null,
  };
}

export async function markInviteUsed(
  inviteId: string,
  usedBy: string
): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTIONS.WORKSPACE_INVITES, inviteId), {
    used: true,
    usedBy,
    usedAt: serverTimestamp(),
  } as DocumentData);
}

// ---- Milestones ----
export async function createMilestone(
  workspaceId: string,
  title: string,
  description: string,
  order: number
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.MILESTONES));
  await setDoc(ref, {
    workspaceId,
    title,
    description,
    status: "planned",
    progressPercentage: 0,
    taskIds: [],
    order,
    createdAt: serverTimestamp(),
  });
  const ws = await getWorkspace(workspaceId);
  if (ws) {
    await updateDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId), {
      milestoneIds: [...ws.milestoneIds, ref.id],
    });
  }
  return ref.id;
}

export async function getMilestones(workspaceId: string): Promise<Milestone[]> {
  const db = getFirebaseDb();
  // Query by workspaceId only (no orderBy) to avoid requiring a composite index
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.MILESTONES), where("workspaceId", "==", workspaceId))
  );
  const milestones = snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      title: d.title,
      description: d.description,
      status: d.status,
      progressPercentage: d.progressPercentage ?? 0,
      taskIds: d.taskIds ?? [],
      order: d.order ?? 0,
      createdAt: toMillis(d.createdAt),
      fundingCategory: d.fundingCategory ?? null,
      estimatedSpendRangeMin: d.estimatedSpendRangeMin ?? null,
      estimatedSpendRangeMax: d.estimatedSpendRangeMax ?? null,
    };
  });
  milestones.sort((a, b) => a.order - b.order);
  return milestones;
}

export async function updateMilestone(
  milestoneId: string,
  updates: Partial<
    Pick<
      Milestone,
      | "title"
      | "description"
      | "status"
      | "progressPercentage"
      | "fundingCategory"
      | "estimatedSpendRangeMin"
      | "estimatedSpendRangeMax"
    >
  >
) {
  const db = getFirebaseDb();
  const safe = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as DocumentData;
  if (Object.keys(safe).length) await updateDoc(doc(db, COLLECTIONS.MILESTONES, milestoneId), safe);
}

// ---- Tasks ----
export async function createTask(
  workspaceId: string,
  milestoneId: string,
  sprintId: string | null,
  title: string,
  ownerId: string | null
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.TASKS));
  const now = Date.now();
  await setDoc(ref, {
    workspaceId,
    milestoneId,
    sprintId,
    title,
    ownerId,
    status: "todo",
    createdAt: now,
    updatedAt: now,
  });
  const milestones = await getMilestones(workspaceId);
  const m = milestones.find((x) => x.id === milestoneId);
  if (m) {
    await updateDoc(doc(db, COLLECTIONS.MILESTONES, milestoneId), {
      taskIds: [...m.taskIds, ref.id],
    });
  }
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
      milestoneId: d.milestoneId,
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
      milestoneId: d.milestoneId,
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
      fundingCategory: d.fundingCategory ?? null,
      estimatedSpendRange: d.estimatedSpendRange ?? null,
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
    fundingCategory: d.fundingCategory ?? null,
    estimatedSpendRange: d.estimatedSpendRange ?? null,
  };
}

// ---- Validations ----
export async function createValidationEntry(
  workspaceId: string,
  sprintId: string,
  milestoneId: string,
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
    milestoneId,
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
      sprintId: d.sprintId ?? null,
      milestoneId: d.milestoneId,
      type: d.type,
      summary: d.summary ?? "",
      qualitativeNotes: d.qualitativeNotes ?? "",
      createdBy: d.createdBy ?? null,
      createdAt: toMillis(d.createdAt),
      origin: d.origin ?? "internal",
      sourceType: d.sourceType ?? null,
      feedbackText: d.feedbackText ?? null,
      confidenceScore: d.confidenceScore ?? null,
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

// ---- Funding ----
export async function createFundingRound(
  workspaceId: string,
  data: {
    name: string;
    amount: number;
    currency: string;
    source: FundingSource;
    date: number;
    notes?: string | null;
  },
  createdBy: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.FUNDING_ROUNDS));
  const now = Date.now();
  await setDoc(ref, {
    workspaceId,
    name: data.name,
    amount: data.amount,
    currency: data.currency,
    source: data.source,
    date: data.date,
    notes: data.notes ?? null,
    createdBy,
    createdAt: now,
  });
  return ref.id;
}

export async function getFundingRounds(workspaceId: string): Promise<FundingRound[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.FUNDING_ROUNDS), where("workspaceId", "==", workspaceId))
  );
  const out = snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      name: d.name,
      amount: d.amount ?? 0,
      currency: d.currency ?? "INR",
      source: d.source,
      date: d.date ?? 0,
      notes: d.notes ?? null,
      createdBy: d.createdBy,
      createdAt: d.createdAt ?? 0,
    };
  });
  out.sort((a, b) => b.date - a.date);
  return out;
}

export async function updateFundingRoundNotes(
  roundId: string,
  notes: string | null
): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTIONS.FUNDING_ROUNDS, roundId), { notes } as DocumentData);
}

export async function getFundingRound(roundId: string): Promise<FundingRound | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, COLLECTIONS.FUNDING_ROUNDS, roundId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    workspaceId: d.workspaceId,
    name: d.name,
    amount: d.amount ?? 0,
    currency: d.currency ?? "INR",
    source: d.source,
    date: d.date ?? 0,
    notes: d.notes ?? null,
    createdBy: d.createdBy,
    createdAt: d.createdAt ?? 0,
  };
}

export async function createFundingAllocation(
  workspaceId: string,
  fundingRoundId: string,
  category: FundingCategory,
  allocatedAmount: number,
  createdBy: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.FUNDING_ALLOCATIONS));
  const now = Date.now();
  await setDoc(ref, {
    workspaceId,
    fundingRoundId,
    category,
    allocatedAmount,
    createdAt: now,
  });
  return ref.id;
}

export async function getFundingAllocations(workspaceId: string): Promise<FundingAllocation[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.FUNDING_ALLOCATIONS), where("workspaceId", "==", workspaceId))
  );
  const out = snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      fundingRoundId: d.fundingRoundId,
      category: d.category,
      allocatedAmount: d.allocatedAmount ?? 0,
      createdAt: d.createdAt ?? 0,
    };
  });
  return out;
}

export async function getFundingAllocationsForRound(
  fundingRoundId: string
): Promise<FundingAllocation[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.FUNDING_ALLOCATIONS),
      where("fundingRoundId", "==", fundingRoundId)
    )
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      fundingRoundId: d.fundingRoundId,
      category: d.category,
      allocatedAmount: d.allocatedAmount ?? 0,
      createdAt: d.createdAt ?? 0,
    };
  });
}

export async function updateFundingAllocation(
  allocationId: string,
  updates: Partial<Pick<FundingAllocation, "category" | "allocatedAmount">>
): Promise<void> {
  const db = getFirebaseDb();
  const safe = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as DocumentData;
  if (Object.keys(safe).length)
    await updateDoc(doc(db, COLLECTIONS.FUNDING_ALLOCATIONS, allocationId), safe);
}

export async function deleteFundingAllocation(allocationId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, COLLECTIONS.FUNDING_ALLOCATIONS, allocationId));
}

export async function createSpendLog(
  workspaceId: string,
  data: {
    fundingRoundId?: string | null;
    category: FundingCategory;
    amount: number;
    date: number;
    linkedSprintId?: string | null;
    linkedMilestoneId?: string | null;
    note: string;
  },
  createdBy: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.SPEND_LOGS));
  const now = Date.now();
  await setDoc(ref, {
    workspaceId,
    fundingRoundId: data.fundingRoundId ?? null,
    category: data.category,
    amount: data.amount,
    date: data.date,
    linkedSprintId: data.linkedSprintId ?? null,
    linkedMilestoneId: data.linkedMilestoneId ?? null,
    note: data.note,
    createdBy,
    createdAt: now,
  });
  return ref.id;
}

export async function getSpendLogs(workspaceId: string): Promise<SpendLog[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.SPEND_LOGS), where("workspaceId", "==", workspaceId))
  );
  const out = snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      fundingRoundId: d.fundingRoundId ?? null,
      category: d.category,
      amount: d.amount ?? 0,
      date: d.date ?? 0,
      linkedSprintId: d.linkedSprintId ?? null,
      linkedMilestoneId: d.linkedMilestoneId ?? null,
      note: d.note ?? "",
      createdBy: d.createdBy,
      createdAt: d.createdAt ?? 0,
    };
  });
  out.sort((a, b) => b.date - a.date);
  return out;
}

export async function updateSpendLog(
  logId: string,
  updates: Partial<
    Pick<
      SpendLog,
      | "category"
      | "amount"
      | "date"
      | "linkedSprintId"
      | "linkedMilestoneId"
      | "note"
      | "fundingRoundId"
    >
  >
): Promise<void> {
  const db = getFirebaseDb();
  const safe = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as DocumentData;
  if (Object.keys(safe).length) await updateDoc(doc(db, COLLECTIONS.SPEND_LOGS, logId), safe);
}

export async function deleteSpendLog(logId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, COLLECTIONS.SPEND_LOGS, logId));
}

// ---- Execution Audit Log (append-only) ----
export async function appendExecutionAuditLog(
  workspaceId: string,
  type: ExecutionAuditLogType,
  entityId: string,
  summary: string,
  createdBy: string
): Promise<string> {
  const db = getFirebaseDb();
  const ref = doc(collection(db, COLLECTIONS.EXECUTION_AUDIT_LOG));
  const now = Date.now();
  await setDoc(ref, {
    workspaceId,
    type,
    entityId,
    summary,
    createdBy,
    createdAt: now,
  });
  return ref.id;
}

export async function getExecutionAuditLog(
  workspaceId: string,
  limitCount = 50
): Promise<ExecutionAuditLogEntry[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.EXECUTION_AUDIT_LOG),
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    )
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      type: d.type,
      entityId: d.entityId,
      summary: d.summary,
      createdBy: d.createdBy,
      createdAt: d.createdAt ?? 0,
    };
  });
}
