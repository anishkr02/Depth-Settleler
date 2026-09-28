"""
End-to-end demo, reconstructing the trip example we worked through:

  - A pays 2000 for lunch (split equally, all 4)
  - B pays 4000 for travel (split equally, all 4)
  - C pays 1600 for room rent (split equally, all 4)
  - D buys a personal cycle for 1500 -> never enters the group ledger

Also demonstrates the "Ishu gave Prince money for chicken" scenario as a
second, separate example using PersonalDebt.

Run with: python demo.py
"""

from models import Member, make_equal_expense, PersonalDebt
from balances import compute_balances
from settlement_greedy import settle_greedy
from settlement_exact import settle_exact
from upi import build_upi_link


def print_settlements(label, settlements, members_by_id):
    print(f"\n{label} ({len(settlements)} transactions):")
    for s in settlements:
        payer = members_by_id[s.from_member_id].name
        payee = members_by_id[s.to_member_id].name
        print(f"  {payer} -> {payee}: Rs.{s.amount}")


def demo_trip_example():
    print("=" * 60)
    print("DEMO 1: The 4-friend trip example")
    print("=" * 60)

    a = Member(id="A", name="A", upi_id="a@upi")
    b = Member(id="B", name="B", upi_id="b@upi")
    c = Member(id="C", name="C", upi_id="c@upi")
    d = Member(id="D", name="D", upi_id="d@upi")
    members_by_id = {m.id: m for m in [a, b, c, d]}
    all_ids = ["A", "B", "C", "D"]

    expenses = [
        make_equal_expense("e1", "Lunch", 2000, paid_by="A", split_among=all_ids),
        make_equal_expense("e2", "Travel", 4000, paid_by="B", split_among=all_ids),
        make_equal_expense("e3", "Room rent", 1600, paid_by="C", split_among=all_ids),
        # D's cycle purchase is personal -> intentionally NOT added here.
    ]

    balances = compute_balances(expenses)
    print("\nNet balances:")
    for member_id, bal in balances.items():
        sign = "is owed" if bal > 0 else "owes"
        print(f"  {members_by_id[member_id].name} {sign} Rs.{abs(bal)}")

    greedy_result = settle_greedy(balances)
    exact_result = settle_exact(balances)

    print_settlements("Greedy algorithm", greedy_result, members_by_id)
    print_settlements("Exact (minimum) algorithm", exact_result, members_by_id)

    print("\nSample UPI links for the exact settlement:")
    for s in exact_result:
        link = build_upi_link(members_by_id[s.to_member_id], s.amount, note="Trip settlement")
        print(f"  {members_by_id[s.from_member_id].name} pays via: {link}")


def demo_chicken_money_example():
    print("\n" + "=" * 60)
    print("DEMO 2: Ishu/Prince chicken money + rest of the trip")
    print("=" * 60)

    ishu = Member(id="ishu", name="Ishu", upi_id="ishu@upi")
    prince = Member(id="prince", name="Prince", upi_id="prince@upi")
    rahul = Member(id="rahul", name="Rahul", upi_id="rahul@upi")
    aman = Member(id="aman", name="Aman", upi_id="aman@upi")
    members_by_id = {m.id: m for m in [ishu, prince, rahul, aman]}
    all_ids = ["ishu", "prince", "rahul", "aman"]

    # Ishu gave Prince 200 for chicken, chicken cost only 150 ->
    # Prince owes Ishu the leftover 50 (a flat IOU, not a split).
    expenses = [
        make_equal_expense("chicken", "Chicken", 150, paid_by="ishu", split_among=all_ids),
        make_equal_expense("travel", "Travel", 800, paid_by="rahul", split_among=all_ids),
        make_equal_expense("room", "Room", 400, paid_by="aman", split_among=all_ids),
    ]
    personal_debts = [
        PersonalDebt(id="d1", from_member_id="prince", to_member_id="ishu",
                     amount=50, note="Leftover chicken cash"),
    ]

    balances = compute_balances(expenses, personal_debts)
    print("\nNet balances:")
    for member_id, bal in balances.items():
        sign = "is owed" if bal > 0 else "owes"
        print(f"  {members_by_id[member_id].name} {sign} Rs.{abs(bal)}")

    exact_result = settle_exact(balances)
    print_settlements("Exact (minimum) algorithm", exact_result, members_by_id)
    print(
        "\nNotice: Prince does not necessarily pay Ishu directly, even though\n"
        "the leftover-cash IOU was specifically between them -- it gets\n"
        "absorbed into the group's overall balances and rerouted to whichever\n"
        "settlement minimizes total transactions."
    )


if __name__ == "__main__":
    demo_trip_example()
    demo_chicken_money_example()
