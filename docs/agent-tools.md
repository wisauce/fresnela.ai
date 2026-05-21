# Agent Tools

Implemented tools:

- `proposeSourceUrls`: creates workspace-scoped source candidates.
- `approveSourceCandidate`: marks a candidate approved.
- `rejectSourceCandidate`: marks a candidate rejected.
- `ingestApprovedSource`: marks a candidate ingested.
- `runRDTIIMapping`: runs provider-backed structured mapping, or records a truthful failed job when AI mapping is not configured.

The chat API accepts `workspaceId`, so user requests are interpreted inside the active workspace.
