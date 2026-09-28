"""
Greedy heap-based settlement algorithm.

Repeatedly matches the largest creditor with the largest debtor, settles the
smaller of the two amounts, and pushes any remainder back into its heap.

Time complexity: O(n log n) for n members with non-zero balances.
This does NOT guarantee the mathematically minimum number of transactions
(see settlement_exact.py for that) — but it's fast and usually close to
optimal, which is the right trade-off once group size grows.
"""

import heapq
from dataclasses import dataclass


@dataclass
class Settlement:
    from_member_id: str
    to_member_id: str
    amount: float


def settle_greedy(balances: dict[str, float], epsilon: float = 0.01) -> list[Settlement]:
    """
    balances: member_id -> net balance (+ owed to them, - they owe)
    Returns a list of Settlement transactions that zero out every balance.
    """
    creditors: list[tuple[float, str]] = []  # max-heap via negated values
    debtors: list[tuple[float, str]] = []    # max-heap via negated abs values

    for member_id, bal in balances.items():
        if bal > epsilon:
            heapq.heappush(creditors, (-bal, member_id))
        elif bal < -epsilon:
            heapq.heappush(debtors, (bal, member_id))  # already negative, min-heap = most negative first

    settlements: list[Settlement] = []

    while creditors and debtors:
        neg_credit, creditor_id = heapq.heappop(creditors)
        credit_amt = -neg_credit
        debt_amt, debtor_id = heapq.heappop(debtors)  # debt_amt is negative
        owe_amt = -debt_amt

        pay_amount = round(min(credit_amt, owe_amt), 2)
        settlements.append(
            Settlement(from_member_id=debtor_id, to_member_id=creditor_id, amount=pay_amount)
        )

        remaining_credit = round(credit_amt - pay_amount, 2)
        remaining_debt = round(owe_amt - pay_amount, 2)

        if remaining_credit > epsilon:
            heapq.heappush(creditors, (-remaining_credit, creditor_id))
        if remaining_debt > epsilon:
            heapq.heappush(debtors, (-remaining_debt, debtor_id))

    return settlements
