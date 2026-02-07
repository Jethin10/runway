"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleInWorkspace } from "@/contexts/AuthContext";
import {
  getWorkspace,
  getFundingRounds,
  getFundingAllocations,
  getSpendLogs,
  getExecutionAuditLog,
  getMilestones,
  getSprints,
  createFundingRound,
  createFundingAllocation,
  deleteFundingAllocation,
  createSpendLog,
  appendExecutionAuditLog,
} from "@/lib/firestore";
import type {
  StartupWorkspace,
  FundingRound,
  FundingAllocation,
  SpendLog,
  FundingSource,
  FundingCategory,
} from "@/lib/types";

const SOURCES: FundingSource[] = ["Angel", "VC", "Grant", "Accelerator", "Bootstrapped"];
const CATEGORIES: FundingCategory[] = ["Engineering", "Marketing", "Hiring", "Infra", "Ops", "Custom"];

function formatAmount(amount: number, currency: string): string {
  if (currency === "INR") return `₹${amount.toLocaleString("en-IN")}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export default function FundingPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [rounds, setRounds] = useState<FundingRound[]>([]);
  const [allocations, setAllocations] = useState<FundingAllocation[]>([]);
  const [spendLogs, setSpendLogs] = useState<SpendLog[]>([]);
  const [auditLog, setAuditLog] = useState<{ id: string; type: string; summary: string; createdAt: number }[]>([]);
  const [milestones, setMilestones] = useState<{ id: string; title: string; status: string; fundingCategory?: string | null }[]>([]);
  const [sprints, setSprints] = useState<{ id: string; weekStartDate: string; completed: boolean; fundingCategory?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [showAddRound, setShowAddRound] = useState(false);
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [showAddSpend, setShowAddSpend] = useState(false);

  const role = workspace ? getRoleInWorkspace(user?.uid ?? undefined, workspace.members) : null;
  const isFounder = role === "founder";
  const canWrite = role === "founder" || role === "team_member";

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      getWorkspace(workspaceId),
      getFundingRounds(workspaceId),
      getFundingAllocations(workspaceId),
      getSpendLogs(workspaceId),
      getExecutionAuditLog(workspaceId),
      getMilestones(workspaceId).then((ms) => ms.map((m) => ({ id: m.id, title: m.title, status: m.status, fundingCategory: m.fundingCategory }))),
      getSprints(workspaceId).then((sp) => sp.map((s) => ({ id: s.id, weekStartDate: s.weekStartDate, completed: s.completed, fundingCategory: s.fundingCategory }))),
    ])
      .then(([ws, r, a, s, audit, ms, sp]) => {
        setWorkspace(ws ?? null);
        setRounds(r);
        setAllocations(a);
        setSpendLogs(s);
        setAuditLog(audit.map((e) => ({ id: e.id, type: e.type, summary: e.summary, createdAt: e.createdAt })));
        setMilestones(ms);
        setSprints(sp);
        if (r.length && !selectedRoundId) setSelectedRoundId(r[0].id);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);
  const allocationsForRound = selectedRound
    ? allocations.filter((a) => a.fundingRoundId === selectedRound.id)
    : [];
  const allocationTotal = allocationsForRound.reduce((sum, a) => sum + a.allocatedAmount, 0);
  const totalRaised = rounds.reduce((sum, r) => sum + r.amount, 0);
  const totalSpend = spendLogs.reduce((sum, s) => sum + s.amount, 0);

  if (loading || !workspace) {
    return (
      <div className="py-12">
        {loading ? <p className="text-gray-500">Loading…</p> : <p className="text-gray-500">Workspace not found.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Funding</h1>
        <p className="text-[#5f6368] dark:text-gray-400 text-sm mt-0.5">
          Plan how capital is used, log spend, and link it to execution.
        </p>
      </div>

      {/* 1. Funding Rounds */}
      <section className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#111418] dark:text-white">Funding rounds</h2>
          {isFounder && (
            <button
              type="button"
              onClick={() => setShowAddRound(true)}
              className="rounded-lg h-9 px-4 bg-primary text-white text-sm font-medium hover:bg-primary/90"
            >
              Add round
            </button>
          )}
        </div>
        {rounds.length === 0 ? (
          <p className="text-sm text-[#5f6368] dark:text-gray-400">No funding rounds yet. Add one to track capital and allocations.</p>
        ) : (
          <ul className="space-y-2">
            {rounds.map((r) => (
              <li
                key={r.id}
                className={`flex items-center justify-between py-3 px-4 rounded-xl border ${
                  selectedRoundId === r.id ? "border-primary/40 bg-primary/5" : "border-[#e8eaed] dark:border-white/10"
                }`}
              >
                <button type="button" onClick={() => setSelectedRoundId(r.id)} className="text-left flex-1 min-w-0">
                  <p className="font-medium text-[#111418] dark:text-white truncate">{r.name}</p>
                  <p className="text-sm text-[#5f6368] dark:text-gray-400">
                    {formatAmount(r.amount, r.currency)} · {r.source} · {new Date(r.date).toLocaleDateString()}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2. Allocation plan */}
      <section className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530] shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#111418] dark:text-white mb-4">Allocation plan</h2>
        {!selectedRound ? (
          <p className="text-sm text-[#5f6368] dark:text-gray-400">Select a funding round above.</p>
        ) : (
          <>
            <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-4">
              {selectedRound.name}: {formatAmount(selectedRound.amount, selectedRound.currency)} total. Allocated: {formatAmount(allocationTotal, selectedRound.currency)}.
            </p>
            {canWrite && allocationTotal < selectedRound.amount && (
              <button
                type="button"
                onClick={() => setShowAddAllocation(true)}
                className="mb-4 rounded-lg h-8 px-3 border border-[#e8eaed] dark:border-white/10 text-sm font-medium text-[#111418] dark:text-white hover:bg-[#f5f6f8] dark:hover:bg-white/5"
              >
                Add allocation
              </button>
            )}
            {allocationsForRound.length === 0 ? (
              <p className="text-sm text-[#5f6368] dark:text-gray-400">No allocations for this round yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e8eaed] dark:border-white/10">
                      <th className="text-left py-2 font-medium text-[#5f6368] dark:text-gray-400">Category</th>
                      <th className="text-right py-2 font-medium text-[#5f6368] dark:text-gray-400">Amount</th>
                      {canWrite && <th className="w-20" />}
                    </tr>
                  </thead>
                  <tbody>
                    {allocationsForRound.map((a) => (
                      <tr key={a.id} className="border-b border-[#e8eaed] dark:border-white/10">
                        <td className="py-2 text-[#111418] dark:text-white">{a.category}</td>
                        <td className="py-2 text-right text-[#111418] dark:text-white">{formatAmount(a.allocatedAmount, selectedRound.currency)}</td>
                        {canWrite && (
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm("Remove this allocation?")) return;
                                await deleteFundingAllocation(a.id);
                                setAllocations((prev) => prev.filter((x) => x.id !== a.id));
                              }}
                              className="text-red-600 dark:text-red-400 text-xs"
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {/* 3. Spend logs */}
      <section className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#111418] dark:text-white">Spend logs</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowAddSpend(true)}
              className="rounded-lg h-9 px-4 border border-primary text-primary text-sm font-medium hover:bg-primary/10"
            >
              Log spend
            </button>
          )}
        </div>
        {spendLogs.length === 0 ? (
          <p className="text-sm text-[#5f6368] dark:text-gray-400">No spend logged yet. Log directional spend and optionally link to sprints or milestones.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8eaed] dark:border-white/10">
                  <th className="text-left py-2 font-medium text-[#5f6368] dark:text-gray-400">Date</th>
                  <th className="text-left py-2 font-medium text-[#5f6368] dark:text-gray-400">Category</th>
                  <th className="text-right py-2 font-medium text-[#5f6368] dark:text-gray-400">Amount</th>
                  <th className="text-left py-2 font-medium text-[#5f6368] dark:text-gray-400">Note</th>
                </tr>
              </thead>
              <tbody>
                {spendLogs.slice(0, 30).map((s) => (
                  <tr key={s.id} className="border-b border-[#e8eaed] dark:border-white/10">
                    <td className="py-2 text-[#111418] dark:text-white">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="py-2 text-[#111418] dark:text-white">{s.category}</td>
                    <td className="py-2 text-right text-[#111418] dark:text-white">{s.amount.toLocaleString()}</td>
                    <td className="py-2 text-[#5f6368] dark:text-gray-400 max-w-[200px] truncate">{s.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Insights */}
      <section className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530] shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#111418] dark:text-white mb-4">Insights</h2>
        <FundingInsights
          rounds={rounds}
          allocations={allocations}
          spendLogs={spendLogs}
          milestones={milestones}
          sprints={sprints}
        />
      </section>

      {/* 5. Activity log */}
      <section className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530] shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#111418] dark:text-white mb-4">Activity history</h2>
        {auditLog.length === 0 ? (
          <p className="text-sm text-[#5f6368] dark:text-gray-400">No activity yet.</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {auditLog.map((e) => (
              <li key={e.id} className="text-sm text-[#5f6368] dark:text-gray-400 flex gap-2">
                <span className="text-[#111418] dark:text-white shrink-0">{new Date(e.createdAt).toLocaleString()}</span>
                <span>{e.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modals */}
      {showAddRound && (
        <AddRoundModal
          workspaceId={workspaceId}
          onClose={() => setShowAddRound(false)}
          onAdded={async (round) => {
            setRounds((prev) => [round, ...prev]);
            setSelectedRoundId(round.id);
            if (user) {
              await appendExecutionAuditLog(
                workspaceId,
                "FUNDING_CREATED",
                round.id,
                `Funding round added: ${round.name} (${formatAmount(round.amount, round.currency)})`,
                user.uid
              );
              const log = await getExecutionAuditLog(workspaceId, 50);
              setAuditLog(log.map((e) => ({ id: e.id, type: e.type, summary: e.summary, createdAt: e.createdAt })));
            }
            setShowAddRound(false);
          }}
        />
      )}
      {showAddAllocation && selectedRound && (
        <AddAllocationModal
          round={selectedRound}
          existingTotal={allocationTotal}
          onClose={() => setShowAddAllocation(false)}
          onAdded={async (allocation) => {
            setAllocations((prev) => [...prev, allocation]);
            if (user) {
              await appendExecutionAuditLog(
                workspaceId,
                "ALLOCATION_UPDATED",
                allocation.id,
                `Allocation: ${allocation.category} ${formatAmount(allocation.allocatedAmount, selectedRound.currency)}`,
                user.uid
              );
              const log = await getExecutionAuditLog(workspaceId, 50);
              setAuditLog(log.map((e) => ({ id: e.id, type: e.type, summary: e.summary, createdAt: e.createdAt })));
            }
            setShowAddAllocation(false);
          }}
        />
      )}
      {showAddSpend && (
        <AddSpendModal
          workspaceId={workspaceId}
          rounds={rounds}
          onClose={() => setShowAddSpend(false)}
          onAdded={async (log) => {
            setSpendLogs((prev) => [log, ...prev]);
            if (user) {
              await appendExecutionAuditLog(
                workspaceId,
                "SPEND_LOGGED",
                log.id,
                `Spend: ${log.category} ${log.amount} – ${log.note || "no note"}`,
                user.uid
              );
              const audit = await getExecutionAuditLog(workspaceId, 50);
              setAuditLog(audit.map((e) => ({ id: e.id, type: e.type, summary: e.summary, createdAt: e.createdAt })));
            }
            setShowAddSpend(false);
          }}
        />
      )}
    </div>
  );
}

function FundingInsights({
  rounds,
  allocations,
  spendLogs,
  milestones,
  sprints,
}: {
  rounds: FundingRound[];
  allocations: FundingAllocation[];
  spendLogs: SpendLog[];
  milestones: { id: string; title: string; status: string; fundingCategory?: string | null }[];
  sprints: { id: string; weekStartDate: string; completed: boolean; fundingCategory?: string | null }[];
}) {
  const totalRaised = rounds.reduce((s, r) => s + r.amount, 0);
  const totalSpend = spendLogs.reduce((s, x) => s + x.amount, 0);
  const marketingSpend = spendLogs.filter((s) => s.category === "Marketing").reduce((a, s) => a + s.amount, 0);
  const hasMarketingSpend = marketingSpend > 0;
  const validationCount = 0;
  const completedSprints = sprints.filter((s) => s.completed).length;
  const engineeringSpend = spendLogs.filter((s) => s.category === "Engineering").reduce((a, s) => a + s.amount, 0);
  const avgMonthlySpend = spendLogs.length > 0 ? totalSpend / Math.max(1, (Date.now() - Math.min(...spendLogs.map((x) => x.date))) / (30 * 24 * 60 * 60 * 1000)) : 0;
  const runwayMonths = avgMonthlySpend > 0 && totalRaised > totalSpend ? (totalRaised - totalSpend) / avgMonthlySpend : null;

  const insights: string[] = [];
  if (hasMarketingSpend && validationCount === 0) insights.push("Spend logged under Marketing, but no validation recorded yet.");
  if (engineeringSpend > 0 && completedSprints === 0) insights.push("Engineering spend is present while no sprints are completed yet.");
  if (runwayMonths !== null && runwayMonths < 3) insights.push(`At current spend rate, runway is under 3 months (≈${runwayMonths.toFixed(1)} months).`);
  if (totalRaised > 0 && totalSpend === 0) insights.push("Capital raised but no spend logged yet. Log spend to track usage.");
  if (insights.length === 0 && totalRaised > 0) insights.push("Funding and spend data look consistent. Keep logging spend and linking to milestones.");

  return (
    <ul className="space-y-2 text-sm text-[#111418] dark:text-gray-300">
      {insights.map((text, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-primary shrink-0">•</span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

function AddRoundModal({
  workspaceId,
  onClose,
  onAdded,
}: {
  workspaceId: string;
  onClose: () => void;
  onAdded: (round: FundingRound) => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [source, setSource] = useState<FundingSource>("VC");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !amount.trim()) return;
    const num = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return;
    setSaving(true);
    try {
      const id = await createFundingRound(
        workspaceId,
        { name: name.trim(), amount: num, currency, source, date: new Date(date).getTime(), notes: notes.trim() || null },
        user.uid
      );
      onAdded({
        id,
        workspaceId,
        name: name.trim(),
        amount: num,
        currency,
        source,
        date: new Date(date).getTime(),
        notes: notes.trim() || null,
        createdBy: user.uid,
        createdAt: Date.now(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a2530] rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[#111418] dark:text-white mb-4">Add funding round</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white" placeholder="e.g. Pre-Seed, Seed" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Amount</label>
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white" placeholder="5000000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white">
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value as FundingSource)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white">
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white" rows={2} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="rounded-lg h-9 px-4 border border-[#e8eaed] dark:border-white/10 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg h-9 px-4 bg-primary text-white text-sm font-medium disabled:opacity-50">{saving ? "Adding…" : "Add round"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddAllocationModal({
  round,
  existingTotal,
  onClose,
  onAdded,
}: {
  round: FundingRound;
  existingTotal: number;
  onClose: () => void;
  onAdded: (a: FundingAllocation) => void;
}) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [category, setCategory] = useState<FundingCategory>("Engineering");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const remaining = round.amount - existingTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount.trim()) return;
    const num = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(num) || num <= 0 || num > remaining) return;
    setSaving(true);
    try {
      const id = await createFundingAllocation(workspaceId, round.id, category, num, user.uid);
      onAdded({
        id,
        workspaceId,
        fundingRoundId: round.id,
        category,
        allocatedAmount: num,
        createdAt: Date.now(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a2530] rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[#111418] dark:text-white mb-2">Add allocation</h3>
        <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-4">Remaining: {formatAmount(remaining, round.currency)}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as FundingCategory)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Amount</label>
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white" placeholder={String(remaining)} required />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="rounded-lg h-9 px-4 border border-[#e8eaed] dark:border-white/10 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg h-9 px-4 bg-primary text-white text-sm font-medium disabled:opacity-50">{saving ? "Adding…" : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddSpendModal({
  workspaceId,
  rounds,
  onClose,
  onAdded,
}: {
  workspaceId: string;
  rounds: FundingRound[];
  onClose: () => void;
  onAdded: (log: SpendLog) => void;
}) {
  const { user } = useAuth();
  const [category, setCategory] = useState<FundingCategory>("Engineering");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roundId, setRoundId] = useState<string | null>(rounds[0]?.id ?? null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount.trim()) return;
    const num = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return;
    setSaving(true);
    try {
      const id = await createSpendLog(
        workspaceId,
        { fundingRoundId: roundId, category, amount: num, date: new Date(date).getTime(), linkedSprintId: null, linkedMilestoneId: null, note: note.trim() },
        user.uid
      );
      onAdded({
        id,
        workspaceId,
        fundingRoundId: roundId,
        category,
        amount: num,
        date: new Date(date).getTime(),
        linkedSprintId: null,
        linkedMilestoneId: null,
        note: note.trim(),
        createdBy: user.uid,
        createdAt: Date.now(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a2530] rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[#111418] dark:text-white mb-4">Log spend</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as FundingCategory)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Amount</label>
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white" placeholder="e.g. 50000" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white" required />
          </div>
          {rounds.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Funding round (optional)</label>
              <select value={roundId ?? ""} onChange={(e) => setRoundId(e.target.value || null)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white">
                <option value="">—</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-1">Note</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-[#111418] dark:text-white" placeholder="Brief description" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="rounded-lg h-9 px-4 border border-[#e8eaed] dark:border-white/10 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg h-9 px-4 bg-primary text-white text-sm font-medium disabled:opacity-50">{saving ? "Logging…" : "Log spend"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
