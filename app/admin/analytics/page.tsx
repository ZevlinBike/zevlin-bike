import MainLayout from "@/app/components/layouts/MainLayout";
import AnalyticsClient from "./Client";

export default function AnalyticsPage() {
  return (
    <MainLayout>
      <div className="pt-32 min-h-screen bg-gray-50 dark:bg-neutral-900 text-black dark:text-white">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Views, uniques, referrers. Choose timespan and filter by type.</p>
          </div>
          <AnalyticsClient />
        </div>
      </div>
    </MainLayout>
  );
}
