"""
Core data models for Debt-Settle.

These are plain dataclasses so the algorithm layer stays framework-agnostic —
the FastAPI layer (or any DB layer) just needs to construct these from rows.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class SplitType(str, Enum):
    EQUAL = "equal"
    EXACT = "exact"
    PERCENTAGE = "percentage"
    SHARES = "shares"


@dataclass
class Member:
    id: str
    name: str
    upi_id: Optional[str] = None
    active: bool = True


@dataclass
class Payer:
    member_id: str
    amount_paid: float


@dataclass
class Split:
    member_id: str
    share_amount: float


@dataclass
class Expense:
    id: str
    description: str
    total_amount: float
    payers: list[Payer]
    splits: list[Split]
    split_type: SplitType = SplitType.EQUAL

    def __post_init__(self):
        paid_sum = round(sum(p.amount_paid for p in self.payers), 2)
        split_sum = round(sum(s.share_amount for s in self.splits), 2)
        if abs(paid_sum - self.total_amount) > 0.01:
            raise ValueError(
                f"Expense '{self.description}': payers sum to {paid_sum}, "
                f"expected total_amount {self.total_amount}"
            )
        if abs(split_sum - self.total_amount) > 0.01:
            raise ValueError(
                f"Expense '{self.description}': splits sum to {split_sum}, "
                f"expected total_amount {self.total_amount}"
            )


@dataclass
class PersonalDebt:
    """A flat ad-hoc IOU between two members, independent of any expense split.
    E.g. leftover cash returned, or a small one-off loan (chai money etc.)."""
    id: str
    from_member_id: str  # the person who OWES
    to_member_id: str    # the person who is OWED
    amount: float
    note: str = ""


def make_equal_expense(
    id: str,
    description: str,
    total_amount: float,
    paid_by: str,
    split_among: list[str],
) -> Expense:
    """Convenience constructor for the common case: one payer, equal split."""
    n = len(split_among)
    base = round(total_amount / n, 2)
    splits = [Split(member_id=m, share_amount=base) for m in split_among]
    # Fix up rounding drift on the last split so shares sum exactly to total.
    drift = round(total_amount - sum(s.share_amount for s in splits), 2)
    if drift:
        splits[-1].share_amount = round(splits[-1].share_amount + drift, 2)
    return Expense(
        id=id,
        description=description,
        total_amount=total_amount,
        payers=[Payer(member_id=paid_by, amount_paid=total_amount)],
        splits=splits,
        split_type=SplitType.EQUAL,
    )
