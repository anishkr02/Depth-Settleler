"""
Computes each member's net balance from a list of Expenses and PersonalDebts.

Net balance > 0  => this member is OWED money (a creditor)
Net balance < 0  => this member OWES money (a debtor)

This is always a *derived* view — never persisted — so it's recomputed
fresh from the underlying ledger every time. That avoids any possibility
of a stored "who owes whom" table drifting out of sync with the actual
expense/debt log.
"""

from collections import defaultdict

from models import Expense, PersonalDebt


def compute_balances(
    expenses: list[Expense],
    personal_debts: list[PersonalDebt] | None = None,
) -> dict[str, float]:
    balances: dict[str, float] = defaultdict(float)

    for expense in expenses:
        for payer in expense.payers:
            balances[payer.member_id] += payer.amount_paid
        for split in expense.splits:
            balances[split.member_id] -= split.share_amount

    for debt in personal_debts or []:
        # from_member owes to_member => from_member's balance goes down,
        # to_member's balance goes up (mirrors "to_member effectively paid
        # on from_member's behalf").
        balances[debt.from_member_id] -= debt.amount
        balances[debt.to_member_id] += debt.amount

    # Round to avoid floating point dust (e.g. 99.99999999999997)
    rounded = {member_id: round(bal, 2) for member_id, bal in balances.items()}

    total = round(sum(rounded.values()), 2)
    if abs(total) > 0.01:
        raise ValueError(
            f"Balances do not sum to zero (got {total}) — this indicates a "
            f"bug in expense/debt entry, not a valid group state."
        )

    return rounded
