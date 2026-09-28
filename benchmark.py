"""
Benchmarks greedy vs. exact settlement algorithms across increasing group
sizes: transaction count achieved, and time taken.

This is the evidence behind the "greedy gets close to optimal, much
faster" claim in the project write-up -- run this and drop the output
table into your README or resume talking points.

Run with: python benchmark.py
"""

import random
import time

from settlement_greedy import settle_greedy
from settlement_exact import settle_exact


def random_balances(n: int, seed: int) -> dict[str, float]:
    rng = random.Random(seed)
    values = [round(rng.uniform(-2000, 2000), 2) for _ in range(n - 1)]
    values.append(round(-sum(values), 2))
    rng.shuffle(values)
    return {f"m{i}": v for i, v in enumerate(values)}


def benchmark(sizes: list[int], trials_per_size: int = 5):
    print(f"{'n':>4} | {'greedy tx':>10} | {'exact tx':>9} | {'greedy ms':>10} | {'exact ms':>9}")
    print("-" * 55)

    for n in sizes:
        greedy_tx_total = 0
        exact_tx_total = 0
        greedy_time_total = 0.0
        exact_time_total = 0.0

        for trial in range(trials_per_size):
            balances = random_balances(n, seed=trial * 100 + n)

            t0 = time.perf_counter()
            g = settle_greedy(balances)
            t1 = time.perf_counter()
            e = settle_exact(balances)
            t2 = time.perf_counter()

            greedy_tx_total += len(g)
            exact_tx_total += len(e)
            greedy_time_total += (t1 - t0)
            exact_time_total += (t2 - t1)

        avg_greedy_tx = greedy_tx_total / trials_per_size
        avg_exact_tx = exact_tx_total / trials_per_size
        avg_greedy_ms = (greedy_time_total / trials_per_size) * 1000
        avg_exact_ms = (exact_time_total / trials_per_size) * 1000

        print(f"{n:>4} | {avg_greedy_tx:>10.1f} | {avg_exact_tx:>9.1f} | "
              f"{avg_greedy_ms:>10.3f} | {avg_exact_ms:>9.3f}")


if __name__ == "__main__":
    # Group sizes typical for a hostel mess or trip. Beyond ~18-20 the
    # exact algorithm's runtime starts growing fast (it's NP-hard), which
    # is exactly the trade-off worth showing.
    benchmark(sizes=[4, 6, 8, 10, 12, 15, 18])
