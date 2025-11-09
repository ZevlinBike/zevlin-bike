import MainLayout from "@/app/components/layouts/MainLayout";
import AnalyticsClient from "./Client";

export default function AnalyticsPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-black dark:text-white">
        <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Views, uniques, referrers. Choose timespan and filter by type.</p>
          </div>
          <AnalyticsClient />
        </div>
      </div>
    </MainLayout>
  );
}
