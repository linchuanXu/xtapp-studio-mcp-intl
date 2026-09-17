# Public XTApp catalog

This directory is the public, sanitized catalog consumed by the Codex plugin. It must never be populated by copying private product state wholesale.

To refresh it, maintainers run the catalog exporter against a local source that is never committed here. Only explicitly approved public apps should be exported. User projects, editor internals, keys, and binary caches do not belong here.
