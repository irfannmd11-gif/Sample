"""Detect the approved PII and sensitive-data patterns in a prompt."""

from __future__ import annotations

import re
from collections import Counter


class PIIScanner:
    """Pattern-based scanner that returns types/counts, never matched values."""

    # This is the approved detection set. Do not add categories without review.
    PII_PATTERNS = {
        "email": (
            re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
        ),
        "phone": (
            re.compile(r"(?<!\d)(?:\+1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)"),
        ),
        "ssn": (
            re.compile(r"(?<!\d)\d{3}-\d{2}-\d{4}(?!\d)"),
        ),
        "credit_card": (
            re.compile(r"(?<!\d)\d{16}(?!\d)"),
            re.compile(r"(?<!\d)\d{4}-\d{4}-\d{4}-\d{4}(?!\d)"),
            re.compile(r"(?<!\d)\d{4} \d{4} \d{4} \d{4}(?!\d)"),
        ),
        "dob": (
            re.compile(r"\b(0?[1-9]|1[0-2])[/-](0?[1-9]|[12]\d|3[01])[/-](19|20)\d{2}\b"),
        ),
        "zip_code": (
            re.compile(r"\b\d{5}(?:-\d{4})?\b"),
        ),
        "routing_number": (
            re.compile(r"(?<!\d)\d{9}(?!\d)"),
        ),
        "bank_account": (
            re.compile(r"(?<!\d)\d{8,18}(?!\d)"),
        ),
        "url": (
            re.compile(r"https?://[^\s]+", re.I),
            re.compile(r"www\.[^\s]+", re.I),
        ),
        "ipv4": (
            re.compile(r"\b(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\b"),
        ),
        "uuid": (
            re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b"),
        ),
    }

    # Prefer specific patterns over generic numeric patterns so one value is
    # flagged once, for example as credit_card rather than bank_account.
    SCAN_ORDER = (
        "email", "ssn", "credit_card", "url", "ipv4", "uuid", "phone",
        "dob", "zip_code", "routing_number", "bank_account",
    )

    def scan(self, text: str) -> dict:
        findings = Counter()
        occupied: list[tuple[int, int]] = []

        for label in self.SCAN_ORDER:
            for pattern in self.PII_PATTERNS[label]:
                for match in pattern.finditer(text):
                    if not self._overlaps(match.span(), occupied):
                        findings[label] += 1
                        occupied.append(match.span())

        types = dict(sorted(findings.items()))
        return {"has_pii": bool(types), "count": sum(types.values()), "types": types}

    @staticmethod
    def _overlaps(span: tuple[int, int], occupied: list[tuple[int, int]]) -> bool:
        return any(span[0] < end and start < span[1] for start, end in occupied)
