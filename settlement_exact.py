"""
Exact backtracking/DFS settlement algorithm.

Finds the TRUE minimum number of transactions needed to zero out all
balances. This is the "Optimal Account Balancing" problem, which is
NP-hard in general (it reduces to partitioning members into subsets that
each sum to zero, then settling within each subset independently).

For hostel/trip-sized groups (roughly <= 20-25 non-zero balances) this
is still fast in practice thanks to two pruning rules:
  1. At each recursion depth we always resolve the *first* remaining
     non-zero balance (never try alternate orderings for it) — this is
     the standard trick that collapses the search space enormously
     without losing optimality.
  2. Any branch whose transaction count already reaches the best count
     found so far is pruned immediately.

Use this to verify/benchmark the greedy algorithm, or when group size is
small enough that you want the guaranteed minimum instead of a
good-enough approximation.
"""

from dataclasses import dataclass

from settlement_greedy import settle_greedy


@dataclass
class Settlement:
    from_member_id: str
    to_member_id: str
    amount: float


def settle_exact(balances: dict[str, float], epsilon: float = 0.01) -> list[Settlement]:
    members = [m for m, b in balances.items() if abs(b) > epsilon]
    amounts = [round(balances[m], 2) for m in members]
    n = len(amounts)

    # Branch-and-bound: seed the upper bound with the greedy result instead
    # of the trivial bound of n. Greedy is O(n log n) and usually close to
    # optimal, so this prunes the vast majority of the search space before
    # it's ever explored -- the difference between this and a trivial bound
    # is what keeps exact search usable up to ~18-20 members instead of ~10.
    greedy_upper_bound = settle_greedy(balances, epsilon=epsilon)
    best_count = [len(greedy_upper_bound) if greedy_upper_bound else n]
    best_settlements: list[Settlement] = list(greedy_upper_bound)

    def dfs(start: int, count: int, path: list[Settlement]) -> None:
        # Skip already-settled positions.
        while start < n and abs(amounts[start]) <= epsilon:
            start += 1

        if start == n:
            if count < best_count[0]:
                best_count[0] = count
                best_settlements.clear()
                best_settlements.extend(path)
            return

        if count + 1 >= best_count[0]:
            return  # even one more transaction can't beat the current best

        for i in range(start + 1, n):
            if abs(amounts[i]) <= epsilon:
                continue
            if amounts[start] * amounts[i] >= 0:
                continue  # must be opposite signs to settle against each other

            original_i = amounts[i]
            amounts[i] = round(amounts[i] + amounts[start], 2)

            if amounts[start] < 0:
                # members[start] owes; members[i] (a creditor) receives payment.
                amount_paid = round(-amounts[start], 2)
                path.append(Settlement(members[start], members[i], amount_paid))
            else:
                # members[start] is owed; members[i] (a debtor) pays them.
                amount_paid = round(amounts[start], 2)
                path.append(Settlement(members[i], members[start], amount_paid))

            dfs(start + 1, count + 1, path)

            path.pop()
            amounts[i] = original_i  # undo

    dfs(0, 0, [])
    return best_settlements
