import { getCustomers } from "./actions";
import CustomerTable from "./components/CustomerTable";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Customers</h1>
      <CustomerTable customers={customers} />
    </div>
  );
}
