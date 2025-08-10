import { getStoreSettings } from "./actions";
import StoreSettingsForm from "./page-content";

export default async function StoreSettingsPage() {
  const settings = await getStoreSettings();
  return <StoreSettingsForm settings={settings} />;
}