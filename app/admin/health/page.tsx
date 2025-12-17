import type { Metadata } from 'next';
import RunTestsClient from './RunTestsClient';

export const metadata: Metadata = {
  title: 'Health Monitor',
};

export default async function AdminHealthPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Health Monitor</h1>
      </div>
      <RunTestsClient />
    </div>
  );
}
