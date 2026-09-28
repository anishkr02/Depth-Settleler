# Debt-Settle
### Group Expense Splitter with Minimum-Transaction Settlement & UPI Deep-Links

---

## 1. Problem Statement

When a group of people share expenses over time — a hostel mess, a trip, a shared flat — money doesn't flow cleanly. Different people pay for different things at different times: one person pays for lunch, another for travel, another fronts cash for a small errand that gets partially spent. By the end of a period (a trip, a month of mess bills), nobody actually remembers who owes what, and if everyone tries to settle up individually — "you owe me for lunch, I owe you for travel, he owes you for the room" — you end up with far more transactions than necessary, several of which cancel each other out.

**The core problem Debt-Settle solves:**

> Given a group's shared expenses (who paid, how much, who it was for) and any informal person-to-person debts, calculate each member's net balance, and then determine the **minimum number of payments** needed to settle everyone up completely — with a **one-tap UPI payment link** generated for each payment.

This is not just a bookkeeping tool. The interesting part — and the part worth building well — is the **settlement algorithm**: turning a tangled web of who-owes-whom into the smallest possible set of actual transactions.

---

## 2. Why This Is Worth Building (Not Just "Another Splitwise Clone")

Apps like Splitwise, Tricount, and Settle Up already solve this problem well at a consumer level. Debt-Settle isn't trying to replace them — it's a **personal DSA showcase project with a real user base** (your own hostel/mess group), where the value is in:

1. **Owning the algorithm end-to-end** — implementing and comparing a fast greedy heap-based settlement algorithm against an exact backtracking solution, and being able to explain the trade-off (a genuinely good interview talking point).
2. **A frictionless real-world payment step** — UPI deep-links mean nobody needs to download an app, create an account, or link a bank card. Settlement literally ends in one tap on a payment already installed on every Indian phone.
3. **A tool you and your hostel-mates will actually use**, not a toy project that only exists in a GitHub repo.

---

## 3. Real-Life Scenarios This App Must Handle

This section captures every situation the settlement engine needs to reason about correctly — from the simple trip example to the messier day-to-day cases.

### 3.1 The basic trip case (equal split, single payer per expense)
Four friends go on a trip. One pays for lunch, another for travel, another for room rent — each split equally among everyone who used it. One friend also buys something purely for himself (a personal purchase), which never enters the group ledger at all.

**Handling:** Each shared expense has one payer and a list of people who benefit equally. Net balance = total paid − total share of expenses consumed. Personal purchases are simply never logged as group expenses.

### 3.2 The "gave money to someone else to buy something" case
One person hands another person cash to go buy something (e.g., chicken for a group meal). The actual cost might be more or less than the amount handed over.

- **If the amount given was more than the actual cost:** the difference is leftover cash that the buyer now personally owes back to the giver — a flat person-to-person IOU, unrelated to the group split.
- **If the amount given was less than the actual cost:** the buyer covered the shortfall out of pocket, meaning the expense now effectively has **two payers** contributing different amounts toward one shared cost.

**Handling:** The data model supports (a) multi-payer expenses, where more than one person contributes toward a single shared cost, and (b) ad-hoc personal debts that are just flat IOUs between two people, entirely separate from expense-splitting logic. Both feed into the same net-balance calculation, so the settlement algorithm doesn't need special-case logic — it just sees the final net numbers.

**Key insight:** the person who was owed the leftover cash will *not necessarily* be the one who receives a direct payment for it. Once folded into the group's overall balance, the minimum-transaction algorithm may reroute that specific debt through someone else entirely, if that produces fewer total transactions. This should be explicitly demoed/explained, since it's the strongest argument for why manual tracking is worse than running the algorithm.

### 3.3 Unequal splits
Not every expense is meant to be split equally.

- **Exact amounts:** e.g., two people order different-priced dishes at a restaurant and want to log exactly what each owes, rather than splitting the full bill evenly.
- **Percentage splits:** e.g., rent split 40/30/30 based on room size or usage.
- **Shares/weights:** e.g., in a mixed group of couples and singles, each couple might be given 2 "shares" of an expense and each single person 1 share, so a bill splits proportionally rather than into equal headcounts.
- **Itemized splits:** each line item on a bill assigned to specific people (useful for mess menus where not everyone orders/eats the same things — e.g., non-veg vs veg members).

**Handling:** Every expense stores a `split_type` (`equal`, `exact`, `percentage`, `shares`, `itemized`) and a resulting list of `{member_id, share_amount}` — computed once at entry time. Downstream, the balance and settlement logic never need to know which split type was used; they only consume the final share amounts.

### 3.4 Recurring expenses (the actual hostel mess use case)
Unlike a one-off trip, a mess runs continuously — bills recur monthly (mess fee, WiFi, cook's salary contribution), and balances shouldn't reset to zero arbitrarily; they should accumulate until a settlement period is explicitly closed.

**Handling:**
- Recurring expense templates (amount, split rule, frequency) that auto-generate new expense entries each period instead of manual re-entry.
- A `SettlementPeriod` concept — e.g., "August 2026" — that a group can close, which locks in that period's expenses, runs the settlement algorithm, and archives the result. Any partially-paid amounts carry forward as a new opening balance into the next period, rather than the ledger just vanishing.

### 3.5 Refunds / reimbursements
An expense is partially refunded after the fact (e.g., a booking is cancelled, an AC repair charge is waived).

**Handling:** Modeled as a negative expense against the same split rule as the original — the settlement math handles the sign flip automatically, no special-case logic required.

### 3.6 A member leaves the group with an unsettled balance
Someone graduates, moves out, or leaves the mess mid-cycle while still owing (or being owed) money.

**Handling:** Members are never hard-deleted while they have a non-zero balance. A member is marked `inactive` instead — they stop being included in *future* expense splits, but their historical balance remains visible and settleable until manually marked resolved.

### 3.7 Repeated small IOUs cluttering the ledger
In daily hostel life, small individual IOUs pile up constantly (chai money, one-off small purchases) alongside the bigger shared expenses.

**Handling:** This is the general case of 3.2 — every small IOU is just another entry that feeds into the same net-balance calculation. The value of the "simplify debts" settlement algorithm is precisely that it collapses potentially dozens of tiny pairwise IOUs plus large shared expenses into the smallest possible number of real payments, rather than everyone individually chasing everyone else for small amounts.

### 3.8 Fairness — "who should pay next"
Even before a formal settlement, it can help to flag who has been fronting the most money recently, to nudge more even contribution over time rather than waiting until settlement day.

**Handling (stretch feature):** A simple running-balance leaderboard view, showing who is currently "owed the most" as a soft nudge for who should pay for the next shared expense.

### 3.9 Multi-currency (explicitly out of scope for v1)
Relevant only if this tool were used for international trips, not the hostel mess use case. Noted here as a deliberate scope decision, and a natural "future work" line — expenses would need a currency field and a conversion step before entering the shared ledger.

---

## 4. Data Model

```
Group
 - id, name, members[], is_recurring (bool)

Member
 - id, name, upi_id, active (bool)

Expense
 - id, group_id, description, total_amount, timestamp
 - payers: [{member_id, amount_paid}]        # supports single or multiple payers
 - split_type: equal | exact | percentage | shares | itemized
 - splits: [{member_id, share_amount}]        # computed at entry time

PersonalDebt
 - id, group_id (optional), from_member_id, to_member_id, amount, note, timestamp
 - (flat ad-hoc IOU, independent of expense splitting)

SettlementPeriod
 - id, group_id, period_label (e.g. "August 2026"), start_date, end_date, status (open/closed)
 - opening_balances: [{member_id, carried_forward_amount}]

Balance (derived — computed on demand, never persisted)
 - member_id -> net_amount   (+ means owed to them, − means they owe)

Settlement (output of the algorithm, tied to a SettlementPeriod)
 - from_member_id, to_member_id, amount, upi_link, paid (bool)
```

Balances and settlement transactions are always **computed views**, recalculated from the underlying Expenses and PersonalDebts, never stored as mutable state. This avoids sync bugs (a stored "who owes whom" table drifting out of sync with the actual expense log) and is a clean answer to "why did you design it this way" in an interview.

---

## 5. The Settlement Algorithm

### 5.1 Problem framing
This is the classic **Optimal Account Balancing** problem: given a set of net balances that sum to zero, find the minimum number of transactions to zero them all out. Finding the *true* minimum is NP-hard in general (equivalent to partitioning the group into subsets that each sum to zero, then settling within each subset independently). For hostel-sized groups (typically under 25 people), an exact solution is still fast in practice.

### 5.2 Approach A — Greedy (heap-based)
1. Compute net balance per member.
2. Separate into creditors (positive balance) and debtors (negative balance).
3. Repeatedly match the largest creditor with the largest debtor, settle the smaller of the two amounts, push any remainder back into the pool.
4. Repeat until all balances reach zero.

Runs in O(n log n). Always produces a valid settlement, usually close to optimal, but not guaranteed to be the mathematical minimum.

### 5.3 Approach B — Exact backtracking / DFS
1. Same net balances as input.
2. Take the first non-zero balance member, try settling with every other non-zero member in turn, recursing after each attempt, backtracking, and keeping the branch with the fewest total transactions.
3. Exponential in the worst case, but with pruning (skipping zero balances, prioritizing exact matches that fully zero out a pair) this is fast for hostel-sized groups.

### 5.4 Why build both
Having both algorithms in the codebase, with a benchmark comparing "greedy transaction count vs. exact minimum, and time taken, across increasing group sizes," is a much stronger showcase than implementing just one. It demonstrates understanding of the difference between a heuristic and an exact solution to an NP-hard problem — a genuinely good interview conversation.

---

## 6. UPI Deep-Link Generation

Each computed settlement transaction (`from → to, amount`) generates a standard UPI intent URI:

```
upi://pay?pa={payee_upi_id}&pn={payee_name}&am={amount}&cu=INR&tn={note}
```

- `pa` — payee's UPI ID (VPA)
- `am` — the settlement amount, populated directly from the algorithm's output
- `tn` — a transaction note, e.g. "Mess settlement – August 2026"

This link can be rendered as a tappable button (opens any UPI app already installed on the device) or as a QR code for a same-device scan. No payment gateway integration or merchant account is required — it's just a standard URI that any UPI-enabled app on Android intercepts natively.

---

## 7. Feature Scope

### MVP (v1 — ships first, ~1–2 weeks)
- Create group, add members
- Add expense: single or multiple payers, equal split
- Add personal IOU (ad-hoc debt between two members)
- View current net balances per member
- "Settle Up" — runs the settlement algorithm, shows the minimal transaction list with UPI deep-links
- Mark a settlement transaction as paid

### V2 (near-term additions)
- Unequal splits: exact amount, percentage, shares/weights
- Itemized bill splitting (per line-item assignment)
- Recurring expense templates + settlement periods (the actual mess-cycle use case)
- Carry-forward of unpaid balances into the next settlement period
- Inactive-member handling (leaves group, balance remains until resolved)
- Refunds as negative expenses

### V3 (stretch / "future work" for resume)
- "Who should pay next" fairness indicator
- Greedy vs. exact-algorithm comparison/benchmark view (great for a demo or write-up)
- Multi-currency support for trips abroad
- Receipt photo attachment / OCR line-item extraction

---

## 8. Suggested Tech Stack

- **Frontend:** React
- **Backend:** FastAPI (Python) — clean fit for implementing and testing both settlement algorithms
- **Database:** SQLite for MVP (single mess group); Postgres if extended to multi-group/multi-hostel use
- **Deployment:** Vercel (frontend) + Render/Railway (backend) — free-tier friendly

---

## 9. Resume / Interview Framing

> Built a group expense settlement app that computes minimum-transaction debt settlement using a greedy heap-based algorithm (O(n log n)), benchmarked against an exact backtracking solution to the NP-hard Optimal Account Balancing problem — supporting multi-payer expenses, ad-hoc IOUs, and recurring settlement periods, with one-tap UPI payment links generated for each transaction. Deployed and actively used by [N] hostel mates.

This combines: a genuine algorithms/DSA story, a real data-modeling problem (multi-payer expenses, ad-hoc debts, recurring periods), and a real end-user — which is a stronger combination than most portfolio projects at this stage.

---

## 10. Open Questions / Next Steps

1. Confirm MVP scope — is recurring/mess-cycle support needed from day one, or is a single-settlement (trip-style) MVP acceptable first, with recurring logic in V2?
2. Decide on backtracking pruning strategy depth (how large a group size needs to stay fast enough for a live demo).
3. Scaffold the FastAPI backend starting with the `Balance` and `Settlement` computation logic, since that's the core showcase piece.
