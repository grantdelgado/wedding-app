#!/bin/bash

echo "🧠 Generating codebase + types snapshot..."

rm -rf snapshot
mkdir -p snapshot/reference

# Copy codebase
cp -r app components lib types snapshot/ 2>/dev/null || true

# Generate types
supabase gen types typescript --project-id wvhtbqvnamerdkkjknuv --schema public > snapshot/reference/supabase.types.ts

# Archive
zip -r snapshot-latest.zip snapshot > /dev/null
echo "✅ Snapshot complete: snapshot-latest.zip"