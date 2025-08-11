"""MongoDB connection utilities for SCARAnalysis.

This module mirrors the connection logic used in the front-end project and
allows other Python modules in :mod:`ciss-python-SCARAnalysis` to easily obtain
MongoDB clients, databases and collections.

Environment variables:
    ``MONGODB_URI``            - connection string (required)
    ``MONGODB_DATABASE_NAME``  - database name (default: ``ciss``)
    ``MONGODB_COLLECTION_NAME``- default collection (default: ``monitoring_status``)
"""

from __future__ import annotations

import os
from typing import Optional

from pymongo import MongoClient

_client: Optional[MongoClient] = None


def get_client() -> MongoClient:
    """Return a cached :class:`~pymongo.mongo_client.MongoClient` instance.

    Raises
    ------
    RuntimeError
        If the ``MONGODB_URI`` environment variable is not defined.
    """

    global _client

    if _client is None:
        uri = os.getenv("MONGODB_URI")
        if not uri:
            raise RuntimeError(
                "Please define the MONGODB_URI environment variable"
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

    coll_name = name or os.getenv("MONGODB_COLLECTION_NAME", "monitoring_status")
    return get_database()[coll_name]


__all__ = ["get_client", "get_database", "get_collection"]
