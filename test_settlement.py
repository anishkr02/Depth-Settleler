"""
Correctness tests for both settlement algorithms.

The key invariant tested: applying every returned settlement transaction
must leave every member's balance at exactly zero. This is checked
generically (not hardcoded to one example) so it catches bugs in either
algorithm regardless of the input balances.
"""

import random
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from settlement_greedy import settle_greedy
from settlement_exact import settle_exact


def apply_settlements(balances: dict[str, float], settlements) -> dict[str, float]:
    result = dict(balances)
    for s in settlements:
        result[s.from_member_id] = round(result[s.from_member_id] + s.amount, 2)
        result[s.to_member_id] = round(result[s.to_member_id] - s.amount, 2)
    return result


def assert_fully_settled(balances, settlements):
    result = apply_settlements(balances, settlements)
    for member_id, bal in result.items():
        assert abs(bal) < 0.01, f"{member_id} still has balance {bal} after settlement"


def test_trip_example_greedy():
    balances = {"A": 100.0, "B": 2100.0, "C": -300.0, "D": -1900.0}
    settlements = settle_greedy(balances)
    assert_fully_settled(balances, settlements)


def test_trip_example_exact():
    balances = {"A": 100.0, "B": 2100.0, "C": -300.0, "D": -1900.0}
    settlements = settle_exact(balances)
    assert_fully_settled(balances, settlements)
    # For this specific example, 3 is the known minimum.
    assert len(settlements) == 3


def test_exact_is_never_worse_than_greedy():
    """Exact must always find a settlement with <= transactions than greedy."""
    random.seed(42)
    for _ in range(20):
        n = random.randint(3, 8)
        values = [round(random.uniform(-1000, 1000), 2) for _ in range(n - 1)]
        values.append(round(-sum(values), 2))  # force sum to zero
        balances = {f"member_{i}": v for i, v in enumerate(values)}

        greedy_result = settle_greedy(balances)
        exact_result = settle_exact(balances)

        assert_fully_settled(balances, greedy_result)
        assert_fully_settled(balances, exact_result)
        assert len(exact_result) <= len(greedy_result), (
            f"exact ({len(exact_result)}) should never exceed "
            f"greedy ({len(greedy_result)}) for balances {balances}"
        )


def test_already_settled_group_needs_no_transactions():
    balances = {"A": 0.0, "B": 0.0}
    assert settle_greedy(balances) == []
    assert settle_exact(balances) == []


def test_two_person_group():
    balances = {"A": 500.0, "B": -500.0}
    greedy_result = settle_greedy(balances)
    exact_result = settle_exact(balances)
    assert len(greedy_result) == 1
    assert len(exact_result) == 1
    assert_fully_settled(balances, greedy_result)
    assert_fully_settled(balances, exact_result)


if __name__ == "__main__":
    test_trip_example_greedy()
    test_trip_example_exact()
    test_exact_is_never_worse_than_greedy()
    test_already_settled_group_needs_no_transactions()
    test_two_person_group()
    print("All tests passed.")
