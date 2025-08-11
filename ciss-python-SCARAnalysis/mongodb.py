"""MongoDB connection utilities for SCARAnalysis.

This module mirrors the connection logic used in the front-end project and
allows other Python modules in :mod:`ciss-python-SCARAnalysis` to easily obtain
MongoDB clients, databases and collections.

Environment variables:
    ``MONGODB_URI``            - connection string (default: ``mongodb://localhost:27017``)
    ``MONGODB_DATABASE_NAME``  - database name (default: ``ciss``)
    ``MONGODB_COLLECTION_NAME``- default collection (default: ``monitoring_status``)
    ``SCAR_DISABLE_DB``        - disable database access when set to a truthy value
"""

from __future__ import annotations

import os
import warnings
from typing import Optional

from pymongo import MongoClient

_client: Optional[MongoClient] = None
_db_disabled = False


def get_client() -> MongoClient:
    """Return a cached :class:`~pymongo.mongo_client.MongoClient` instance.

    This function supports two development conveniences:

    * If ``MONGODB_URI`` is unset, the client will attempt to connect to a
      local MongoDB instance using ``mongodb://localhost:27017`` and emit a
      warning.
    * Setting ``SCAR_DISABLE_DB`` to a truthy value disables all database
      operations and raises a :class:`RuntimeError`.
    """

    global _client, _db_disabled

    if _client is None:
        if os.getenv("SCAR_DISABLE_DB", "").lower() in {"1", "true", "yes"}:
            _db_disabled = True
            raise RuntimeError(
                "Database operations are disabled because SCAR_DISABLE_DB is set.",
            )

        uri = os.getenv("MONGODB_URI")
        if not uri:
            uri = "mongodb://localhost:27017"
            warnings.warn(
                "MONGODB_URI not set. Falling back to mongodb://localhost:27017",
                RuntimeWarning,
            )
        _client = MongoClient(uri)

    return _client


def get_database(name: Optional[str] = None):
    """Return a database object.

    Parameters
    ----------
    name:
        Explicit database name.  If ``None``, uses ``MONGODB_DATABASE_NAME``
        or defaults to ``ciss``.
    """

    if _db_disabled:
        raise RuntimeError("Database operations are disabled")
    db_name = name or os.getenv("MONGODB_DATABASE_NAME", "ciss")
    return get_client()[db_name]


def get_collection(name: Optional[str] = None):
    """Return a collection from the configured database.

    Parameters
    ----------
    name:
        Explicit collection name.  If ``None``, uses
        ``MONGODB_COLLECTION_NAME`` or defaults to ``monitoring_status``.
    """

    if _db_disabled:
        raise RuntimeError("Database operations are disabled")
    coll_name = name or os.getenv("MONGODB_COLLECTION_NAME", "monitoring_status")
    return get_database()[coll_name]


def is_db_enabled() -> bool:
    """Return ``True`` if database operations are permitted."""

    return not _db_disabled


__all__ = ["get_client", "get_database", "get_collection", "is_db_enabled"]

