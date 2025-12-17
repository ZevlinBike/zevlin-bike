import React from 'react';
import type { CheckResult } from '../config/checks';
import { StatusBadge } from './StatusBadge';

export function HealthCard({ title, items }: { title: string; items: CheckResult[] }) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{title}</h3>
        <div className="ml-auto text-xs text-neutral-500">{items.length} checks</div>
      </div>
      <div className="divide-y">
        {items.map((i) => (
          <div key={i.key} className="py-2 flex items-start gap-2">
            <StatusBadge status={i.status} />
            <div>
              <div className="text-sm font-medium">{i.title}</div>
              {i.summary && <div className="text-xs text-neutral-600">{i.summary}</div>}
              {i.remediateUrl && (
                <a className="text-xs underline" href={i.remediateUrl} target="_blank" rel="noreferrer">Remediate</a>
              )}
            </div>
            <div className="ml-auto text-xs text-neutral-500">
              {typeof i.durationMs === 'number' ? `${i.durationMs} ms` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

