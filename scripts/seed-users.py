#!/usr/bin/env python3
"""Crea/actualiza los usuarios seed de Soporte Telecom (idempotente).

- Crea la cuenta en Supabase Auth (email confirmado + password) si no existe.
- Crea/actualiza el perfil en public.users con su rol y estado.

Requiere SUPABASE_SERVICE_KEY en .env.local.
Uso: .venv/bin/python scripts/seed-users.py [email ...]
"""

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SEEDS = [
    {"email": "admin@soporte.com", "password": "Admin123!", "full_name": "Jhordam Aguilera", "phone": "+58 412 0000000", "role": "admin"},
    {"email": "agente@soporte.com", "password": "Agente123!", "full_name": "Juan Perez", "phone": "+58 412 0000001", "role": "agent"},
    {"email": "cliente@soporte.com", "password": "Cliente123!", "full_name": "Maria Lopez", "phone": "+58 412 0000002", "role": "customer"},
]


def load_env() -> tuple[str, str]:
    env = {}
    for line in (ROOT / ".env.local").read_text().splitlines():
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k] = v.strip().strip('"')
    return env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_KEY"]


def call(url: str, key: str, method: str, path: str, body=None, prefer="return=representation"):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url + path,
        method=method,
        data=data,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": prefer,
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:200]


def auth_users(url: str, key: str) -> dict:
    _, data = call(url, key, "GET", "/auth/v1/admin/users?per_page=200")
    return {u["email"]: u for u in (data.get("users", []) if isinstance(data, dict) else [])}


def main() -> None:
    url, key = load_env()
    only = set(sys.argv[1:])
    seeds = [s for s in SEEDS if not only or s["email"] in only]
    existing = auth_users(url, key)

    for s in seeds:
        email = s["email"]
        user = existing.get(email)

        if user:
            call(url, key, "PUT", f"/auth/v1/admin/users/{user['id']}",
                 {"password": s["password"], "email_confirm": True,
                  "user_metadata": {"full_name": s["full_name"], "phone": s["phone"]}})
            uid = user["id"]
            action = "auth existe, password/confirm restablecidos"
        else:
            status, res = call(url, key, "POST", "/auth/v1/admin/users",
                               {"email": email, "password": s["password"], "email_confirm": True,
                                "user_metadata": {"full_name": s["full_name"], "phone": s["phone"]}})
            if status >= 300:
                print(f"  {email}: ERROR creando auth ({status}): {res}")
                continue
            uid = res["id"]
            action = "auth creado"
            time.sleep(1)

        body = {"id": uid, "email": email, "full_name": s["full_name"],
                "phone": s["phone"], "role": s["role"], "status": "active"}
        status, res = call(url, key, "POST", "/rest/v1/users?on_conflict=id", body,
                           prefer="resolution=merge-duplicates,return=minimal")
        profile = "perfil OK" if status < 300 else f"perfil ERROR ({status}): {res}"
        print(f"  {email:22} [{s['role']:8}] {action} · {profile}")

    print("\nListo. Credenciales:")
    for s in seeds:
        print(f"  {s['role']:8} {s['email']:22} {s['password']}")


if __name__ == "__main__":
    main()
