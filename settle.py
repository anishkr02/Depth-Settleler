"""
Public entry point for settlement: picks the right algorithm automatically.

Why a hybrid dispatcher, not "always exact":
Benchmarking (see benchmark.py) shows the exact backtracking algorithm's
runtime is fine up to ~10-12 non-zero balances, but grows fast beyond
that for adversarial/random inputs -- expected, since Optimal Account
Balancing is NP-hard in general. Real hostel/mess data tends to have more
structure (repeated equal-split amounts that cancel cleanly), so it often
runs faster in practice than the worst case -- but it isn't safe to bet
production behavior on that. So:

  - <= EXACT_THRESHOLD non-zero balances -> run exact (guaranteed minimum)
  - >  EXACT_THRESHOLD non-zero balances -> run greedy (fast, near-optimal)

This threshold is a genuine engineering trade-off worth being able to
explain, not just a performance hack.
"""

from settlement_greedy import settle_greedy, Settlement
from settlement_exact import settle_exact

EXACT_THRESHOLD = 12


def settle(balances: dict[str, float], epsilon: float = 0.01) -> tuple[list[Settlement], str]:
    """
    Returns (settlements, algorithm_used) where algorithm_used is
    "exact" or "greedy", so callers/UI can be transparent about which
    guarantee applies to the result shown.
    """
    non_zero_count = sum(1 for b in balances.values() if abs(b) > epsilon)

    if non_zero_count <= EXACT_THRESHOLD:
        return settle_exact(balances, epsilon=epsilon), "exact"
    return settle_greedy(balances, epsilon=epsilon), "greedy"
