"""
Helper utilities for validating and computing expense splits (equal, exact, percentage, shares)
and multi-payer breakdowns with penny-rounding drift correction.
"""

from typing import List, Dict, Tuple
from fastapi import HTTPException


def validate_and_compute_payers(paid_by: List[Dict], total_amount: float) -> List[Tuple[int, float]]:
    """
    Validates payer list and ensures the sum of paid amounts equals total_amount.
    Input format: [{'member_id': 1, 'amount_paid': 100.0}, ...]
    Returns list of (member_id, amount_paid)
    """
    if not paid_by:
        raise HTTPException(status_code=400, detail="paid_by cannot be empty")

    payers_result = []
    paid_sum = 0.0

    for p in paid_by:
        m_id = p.get("member_id")
        amt = round(float(p.get("amount_paid", 0.0)), 2)
        if amt <= 0:
            raise HTTPException(status_code=400, detail="Payer amount must be positive")
        payers_result.append((m_id, amt))
        paid_sum += amt

    paid_sum = round(paid_sum, 2)
    if abs(paid_sum - round(total_amount, 2)) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Sum of payer amounts (Rs. {paid_sum}) does not match total amount (Rs. {total_amount})"
        )

    return payers_result


def compute_splits(
    split_type: str,
    split_data: List[Dict],
    total_amount: float
) -> List[Tuple[int, float]]:
    """
    Computes and validates split shares for equal, exact, percentage, or shares.
    Returns list of (member_id, share_amount) with drift correction so sum == total_amount.
    """
    total_amount = round(total_amount, 2)
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Total amount must be greater than zero")

    if not split_data:
        raise HTTPException(status_code=400, detail="split_among data cannot be empty")

    n = len(split_data)
    splits_result: List[Tuple[int, float]] = []

    if split_type == "equal":
        # Expecting [{"member_id": 1}, ...] or split_data as list of ints
        member_ids = [d["member_id"] if isinstance(d, dict) else d for d in split_data]
        base = round(total_amount / n, 2)
        shares = [base] * n
        drift = round(total_amount - sum(shares), 2)
        shares[-1] = round(shares[-1] + drift, 2)
        return list(zip(member_ids, shares))

    elif split_type == "exact":
        # Expecting [{"member_id": 1, "amount": 50.0}, ...]
        split_sum = 0.0
        for item in split_data:
            m_id = item["member_id"]
            amt = round(float(item.get("amount", 0.0)), 2)
            if amt < 0:
                raise HTTPException(status_code=400, detail="Split share cannot be negative")
            splits_result.append((m_id, amt))
            split_sum += amt

        split_sum = round(split_sum, 2)
        if abs(split_sum - total_amount) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Sum of exact splits (Rs. {split_sum}) does not match total amount (Rs. {total_amount})"
            )
        return splits_result

    elif split_type == "percentage":
        # Expecting [{"member_id": 1, "percentage": 50.0}, ...]
        pct_sum = round(sum(float(item.get("percentage", 0.0)) for item in split_data), 2)
        if abs(pct_sum - 100.0) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Percentages must sum to 100% (currently sums to {pct_sum}%)"
            )

        shares = []
        member_ids = []
        for item in split_data:
            m_id = item["member_id"]
            pct = float(item.get("percentage", 0.0))
            share = round((total_amount * pct) / 100.0, 2)
            shares.append(share)
            member_ids.append(m_id)

        drift = round(total_amount - sum(shares), 2)
        shares[-1] = round(shares[-1] + drift, 2)
        return list(zip(member_ids, shares))

    elif split_type == "shares":
        # Expecting [{"member_id": 1, "shares": 2}, ...]
        total_shares = sum(float(item.get("shares", 0.0)) for item in split_data)
        if total_shares <= 0:
            raise HTTPException(status_code=400, detail="Total shares must be greater than zero")

        shares = []
        member_ids = []
        for item in split_data:
            m_id = item["member_id"]
            sh = float(item.get("shares", 0.0))
            share_amt = round((total_amount * sh) / total_shares, 2)
            shares.append(share_amt)
            member_ids.append(m_id)

        drift = round(total_amount - sum(shares), 2)
        shares[-1] = round(shares[-1] + drift, 2)
        return list(zip(member_ids, shares))

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported split_type: '{split_type}'. Choose from equal, exact, percentage, shares.")
