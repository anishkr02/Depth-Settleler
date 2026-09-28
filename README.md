# Debt-Settle API

FastAPI backend for the Debt-Settle group expense splitter. Wraps the
tested settlement algorithm (greedy + exact backtracking with a hybrid
dispatcher) in a real HTTP API backed by SQLite.

## Run it

```
pip install -r requirements.txt
cd app
uvicorn main:app --reload
```

Then open http://127.0.0.1:8000/docs for interactive API docs (FastAPI
generates this automatically — you can try every endpoint directly from
the browser).

## Structure

- `models.py`, `balances.py`, `settlement_greedy.py`, `settlement_exact.py`,
  `settle.py`, `upi.py` — the pure algorithm layer, framework-agnostic,
  covered by `tests/test_settlement.py`
- `db_models.py`, `db.py` — the SQLite storage layer
- `main.py` — the route layer that connects the two

## Endpoints

- `POST /groups`
- `POST /groups/{id}/members`
- `POST /groups/{id}/expenses/equal`
- `GET  /groups/{id}/expenses`
- `POST /groups/{id}/debts`
- `GET  /groups/{id}/balances`
- `GET  /groups/{id}/settle`

## Not yet built (next steps)

- Multi-payer / unequal-split expense endpoint (algorithm layer already
  supports this — see `models.py` — just needs a request schema + route)
- Recurring expense templates / settlement periods
- React frontend consuming this API (the mockup from earlier used mock
  data; next step is pointing it at these real endpoints)
