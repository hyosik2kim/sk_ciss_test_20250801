from __future__ import annotations
"""High-level database operations for monitoring data.

This module replaces the former front-end MongoDB queries with Python
implementations so that the SCARAnalysis service can provide the same
monitoring data via its API.
"""


from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from bson import ObjectId

from mongodb import get_collection, is_db_enabled


def _parse_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _start_of_day(dt: datetime) -> datetime:
    return datetime(dt.year, dt.month, dt.day)


def _start_of_next_day(dt: datetime) -> datetime:
    return _start_of_day(dt) + timedelta(days=1)


def _map_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(doc)
    result["_id"] = str(doc.get("_id", ObjectId()))
    generated = doc.get("generatedAt")
    if isinstance(generated, datetime):
        result["generatedAt"] = generated.isoformat()
    elif generated is not None:
        result["generatedAt"] = str(generated)
    return result


def _build_common_query(
    serial_nos: Optional[List[str]], start: Optional[str], end: Optional[str]
) -> Dict[str, Any]:
    query: Dict[str, Any] = {}
    if serial_nos:
        query["serialNo"] = {"$in": serial_nos}
    start_dt = _parse_date(start)
    end_dt = _parse_date(end)
    if start_dt or end_dt:
        query["generatedAt"] = {}
        if start_dt:
            query["generatedAt"]["$gte"] = _start_of_day(start_dt)
        if end_dt:
            query["generatedAt"]["$lt"] = _start_of_next_day(end_dt)
    return query


def get_charging_page_data(
    serial_nos: Optional[List[str]],
    start: Optional[str],
    end: Optional[str],
    page: int = 1,
    limit: int = 15,
) -> Dict[str, Any]:
    """Return paginated monitoring documents along with full data for statistics."""

    if not is_db_enabled():
        return {"entries": [], "totalCount": 0, "allEntriesForStats": []}
    coll = get_collection()
    query = _build_common_query(serial_nos, start, end)
    query["$or"] = [
        {"CP-PINS-SMID": {"$exists": True, "$nin": [None, ""]}},
        {"CP2-PINS-SMID": {"$exists": True, "$nin": [None, ""]}},
        {"CP-PINS-SESSION-ID": {"$exists": True, "$nin": [None, ""]}},
        {"CP2-PINS-SESSION-ID": {"$exists": True, "$nin": [None, ""]}},
        {"DP-STATE": {"$exists": True, "$nin": [None, ""]}},
    ]

    total = coll.count_documents(query)
    cursor = (
        coll.find(query)
        .sort("generatedAt", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    entries = [_map_doc(doc) for doc in cursor]
    all_entries = [_map_doc(doc) for doc in coll.find(query)]
    return {
        "entries": entries,
        "totalCount": total,
        "allEntriesForStats": all_entries,
    }


def get_errors(
    serial_nos: Optional[List[str]],
    start: Optional[str],
    end: Optional[str],
    page: Optional[int] = None,
    limit: Optional[int] = None,
    fetch_all: bool = False,
) -> Dict[str, Any]:
    """Return monitoring documents containing non-zero error codes."""

    if not is_db_enabled():
        return {"errors": [], "totalCount": 0}
    coll = get_collection()
    query = _build_common_query(serial_nos, start, end)
    query["ERR-CODE"] = {"$ne": "0", "$nin": [None, ""]}

    total = coll.count_documents(query)
    cursor = coll.find(query).sort("generatedAt", -1)
    if not fetch_all:
        p = page or 1
        l = limit or 50
        cursor = cursor.skip((p - 1) * l).limit(l)
    errors = [_map_doc(doc) for doc in cursor]
    return {"errors": errors, "totalCount": total}


def get_overall_error_statistics(
    serial_nos: Optional[List[str]],
    start: Optional[str],
    end: Optional[str],
) -> Dict[str, Any]:
    """Aggregate error counts by error code."""

    if not is_db_enabled():
        return {"totalErrors": 0, "uniqueErrorCodes": 0, "errorCodeCounts": {}}
    coll = get_collection()
    match = _build_common_query(serial_nos, start, end)
    match.update({
        "ERR-CODE": {"$ne": "0", "$nin": [None, ""]},
        "DP-STATE": {"$ne": "0", "$nin": [None, ""]},
    })
    pipeline = [
        {"$match": match},
        {
            "$addFields": {
                "cleanedERR-CODE": {
                    "$replaceAll": {
                        "input": "$ERR-CODE",
                        "find": "\u0000",
                        "replacement": "",
                    }
                }
            }
        },
        {"$group": {"_id": "$cleanedERR-CODE", "count": {"$sum": 1}}},
        {
            "$group": {
                "_id": None,
                "totalErrors": {"$sum": "$count"},
                "errorCodeCounts": {"$push": {"k": "$_id", "v": "$count"}},
            }
        },
        {
            "$project": {
                "_id": 0,
                "totalErrors": 1,
                "errorCodeCounts": {"$arrayToObject": "$errorCodeCounts"},
                "uniqueErrorCodes": {"$size": "$errorCodeCounts"},
            }
        },
    ]
    result = list(coll.aggregate(pipeline))
    return result[0] if result else {
        "totalErrors": 0,
        "uniqueErrorCodes": 0,
        "errorCodeCounts": {},
    }


def get_charging_sessions(
    serial_nos: Optional[List[str]],
    start: Optional[str],
    end: Optional[str],
    error_codes: Optional[List[Dict[str, str]]] = None,
) -> List[List[Dict[str, Any]]]:
    """Return session-separated monitoring rows similar to the former front-end implementation."""

    if not is_db_enabled():
        return []
    coll = get_collection()
    query = _build_common_query(serial_nos, start, end)
    raw_entries = list(coll.find(query).sort("generatedAt", 1))
    entries = [_map_doc(doc) for doc in raw_entries]

    sessions: List[List[Dict[str, Any]]] = []
    session_start_l: Optional[int] = None
    session_start_r: Optional[int] = None

    for i, entry in enumerate(entries):
        state = (entry.get("DP-STATE") or "").lower()
        err = (entry.get("ERR-CODE") or "").lower()

        # start sessions
        if session_start_l is None and "ready_start_to_use" in state and state.endswith(" l"):
            session_start_l = i
        if session_start_r is None and "ready_start_to_use" in state and state.endswith(" r"):
            session_start_r = i

        def _finish_session(start_idx: int, is_left: bool) -> None:
            nonlocal sessions
            start_time = datetime.fromisoformat(entries[start_idx]["generatedAt"])
            end_time = datetime.fromisoformat(entry["generatedAt"])
            diff_min = (end_time - start_time).total_seconds() / 60
            flags = {
                f"isUserFail{'L' if is_left else 'R'}": False,
                f"isServerFail{'L' if is_left else 'R'}": False,
                f"isEVFail{'L' if is_left else 'R'}": False,
                f"isEVSEFail{'L' if is_left else 'R'}": False,
            }
            if "fault" in state and error_codes:
                for ec in error_codes:
                    if err == ec.get("code", "").lower():
                        key = {
                            "User": "isUserFail",
                            "Server": "isServerFail",
                            "EV": "isEVFail",
                            "EVSE": "isEVSEFail",
                        }.get(ec.get("type"))
                        if key:
                            flags[f"{key}{'L' if is_left else 'R'}"] = True
            session_rows: List[Dict[str, Any]] = []
            for row in entries[start_idx : i + 1]:
                row_copy = dict(row)
                row_copy["isShortSession"] = diff_min < 5
                row_copy.update(flags)
                session_rows.append(row_copy)
            sessions.append(session_rows)

        # finish L
        if session_start_l is not None and (
            "finish" in state or "thankyou" in state or "fault" in state
        ) and state.endswith(" l"):
            _finish_session(session_start_l, True)
            session_start_l = None

        # finish R
        if session_start_r is not None and (
            "finish" in state or "thankyou" in state or "fault" in state
        ) and state.endswith(" r"):
            _finish_session(session_start_r, False)
            session_start_r = None

    return sessions


__all__ = [
    "get_charging_page_data",
    "get_errors",
    "get_overall_error_statistics",
    "get_charging_sessions",
]