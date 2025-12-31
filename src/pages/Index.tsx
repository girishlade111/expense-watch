import { useEffect, useMemo, useState } from "react";

const API_KEY = "AIzaSyDJ9pXCdrVBLO6xK-rbr4qf2CIAxLuy8JE";
const SPREADSHEET_ID = "1Armz9c9Tr1mXeGWymyhgUOhhw0cA_QvyTAcc2Q6uA9w";
// Change the sheet name / range here if you rename your sheet
const RANGE = "Sheet1!A2:F"; // Date & Time, Credit, Debit, Category, Amount, Purpose/Notes

type TransactionType = "credit" | "debit";

type Transaction = {
  timestamp: string;
  credit: string;
  debit: string;
  category: string;
  amount: number;
  notes: string;
  type: TransactionType;
};

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TransactionType>("all");

  useEffect(() => {
    document.title = "Expense Tracker • Read‑only Dashboard";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
          RANGE,
        )}?key=${API_KEY}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to load data from Google Sheets");
        }
        const data: { values?: string[][] } = await res.json();
        const rows = data.values ?? [];

        const parsed: Transaction[] = rows
          .map((row) => {
            const timestamp = row[0] ?? "";
            const credit = (row[1] ?? "").trim();
            const debit = (row[2] ?? "").trim();
            const category = (row[3] ?? "").trim() || "Uncategorized";
            const amountRaw = (row[4] ?? "0").toString().replace(/[,₹]/g, "");
            const amount = Number(amountRaw) || 0;
            const notes = row[5] ?? "";

            if (!timestamp && !credit && !debit && !amount && !notes) {
              return null;
            }

            const type: TransactionType = credit && !debit ? "credit" : "debit";

            return { timestamp, credit, debit, category, amount, notes, type };
          })
          .filter((t): t is Transaction => t !== null);

        setTransactions(parsed);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { incomeTotal, expenseTotal } = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === "credit") acc.incomeTotal += t.amount;
        if (t.type === "debit") acc.expenseTotal += t.amount;
        return acc;
      },
      { incomeTotal: 0, expenseTotal: 0 },
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const categoryStats = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        count: number;
      }
    >();

    for (const t of transactions) {
      if (t.type !== "debit") continue; // only expenses
      const key = t.category || "Uncategorized";
      const current = map.get(key) ?? { total: 0, count: 0 };
      current.total += t.amount;
      current.count += 1;
      map.set(key, current);
    }

    const totalExpense = Array.from(map.values()).reduce((sum, v) => sum + v.total, 0);

    return Array.from(map.entries())
      .map(([category, value]) => ({
        category,
        total: value.total,
        count: value.count,
        percentage: totalExpense ? (value.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const handleFilter = (next: "all" | TransactionType) => {
    setFilter((current) => (current === next ? "all" : next));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Expense Tracker</h1>
          <p className="max-w-prose text-xs text-muted-foreground sm:text-sm">
            Read-only dashboard powered by your Google Sheet. Update the sheet to instantly refresh this
            view.
          </p>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleFilter("credit")}
            className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors ${
              filter === "credit" ? "border-primary bg-secondary" : "border-border bg-card hover:bg-secondary"
            }`}
          >
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Total Income
            </span>
            <span className="mt-1 text-sm font-semibold sm:text-base">{formatter.format(incomeTotal)}</span>
            <span className="mt-2 text-[11px] text-muted-foreground">Tap to toggle credit-only view</span>
          </button>

          <button
            type="button"
            onClick={() => handleFilter("debit")}
            className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors ${
              filter === "debit" ? "border-primary bg-secondary" : "border-border bg-card hover:bg-secondary"
            }`}
          >
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Total Expenses
            </span>
            <span className="mt-1 text-sm font-semibold sm:text-base">{formatter.format(expenseTotal)}</span>
            <span className="mt-2 text-[11px] text-muted-foreground">Tap to toggle debit-only view</span>
          </button>

          <div className="flex flex-col justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Net
              </span>
              <span className="mt-1 block text-sm font-semibold sm:text-base">
                {formatter.format(incomeTotal - expenseTotal)}
              </span>
            </div>
            {filter !== "all" && (
              <span className="mt-2 text-[11px] text-muted-foreground">
                Showing {filter === "credit" ? "only income" : "only expenses"}. Tap a total to reset.
              </span>
            )}
          </div>
        </section>

        {/* Expense by category */}
        <section className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight sm:text-base">Expense by Category</h2>
            <span className="text-[11px] text-muted-foreground">
              {categoryStats.length} {categoryStats.length === 1 ? "category" : "categories"}
            </span>
          </div>

          {categoryStats.length === 0 ? (
            <p className="text-xs text-muted-foreground">No expense data yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((cat) => (
                <article
                  key={cat.category}
                  className="rounded-xl border border-border/70 bg-secondary/40 p-3 text-xs sm:p-3.5 sm:text-sm"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {cat.count} {cat.count === 1 ? "transaction" : "transactions"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block font-mono text-xs sm:text-sm">
                        {formatter.format(cat.total)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{cat.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/90"
                      style={{ width: `${Math.max(4, Math.min(100, cat.percentage))}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Transaction history */}
        <section className="mb-6 rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight sm:text-base">Transaction History</h2>
            <span className="text-[11px] text-muted-foreground">
              {filteredTransactions.length} records
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground">Loading from Google Sheets…</p>
          ) : error ? (
            <p className="text-xs text-destructive-foreground">{error}</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No transactions to display.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-background/40">
              <div className="max-h-[420px] overflow-auto text-xs sm:text-sm">
                <table className="min-w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                    <tr className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 text-left">Date &amp; Time</th>
                      <th className="px-3 py-2 text-left">Credit (Income Source)</th>
                      <th className="px-3 py-2 text-left">Debit (Expense Details)</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-right">Amount (₹)</th>
                      <th className="px-3 py-2 text-left">Purpose / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t, idx) => (
                      <tr
                        key={`${t.timestamp}-${idx}`}
                        className={`transition-colors hover:bg-sidebar-accent/70 ${
                          idx % 2 === 0 ? "bg-background/40" : "bg-muted/40"
                        }`}
                      >
                        <td className="whitespace-nowrap px-3 py-2 align-top text-[11px] sm:text-xs">
                          {t.timestamp}
                        </td>
                        <td className="px-3 py-2 align-top text-[11px] sm:text-xs">{t.credit}</td>
                        <td className="px-3 py-2 align-top text-[11px] sm:text-xs">{t.debit}</td>
                        <td className="px-3 py-2 align-top text-[11px] sm:text-xs">{t.category}</td>
                        <td className="whitespace-nowrap px-3 py-2 align-top text-right font-mono text-[11px] tabular-nums sm:text-xs">
                          {formatter.format(t.amount)}
                        </td>
                        <td className="px-3 py-2 align-top text-[11px] text-muted-foreground sm:text-xs">
                          {t.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
