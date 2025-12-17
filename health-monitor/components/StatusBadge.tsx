import React from 'react';

export function StatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' | 'skipped' }) {
  const map: Record<typeof status, { bg: string; text: string; label: string }> = {
    pass: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'PASS' },
    warn: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'WARN' },
    fail: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'FAIL' },
    skipped: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'SKIPPED' },
  };
  const s = map[status];
  return (
    <span className={[
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border',
      s.bg,
      s.text,
    ].join(' ')}>
      {s.label}
    </span>
  );
}

