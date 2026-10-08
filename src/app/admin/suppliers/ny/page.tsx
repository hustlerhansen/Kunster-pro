import { PageHeader, Panel } from "@/components/admin/ui";
import { SupplierForm } from "@/components/admin/supplier-form";

export const metadata = { title: "Ny leverandør" };

export default function NewSupplier() {
  return (
    <div>
      <PageHeader title="Ny leverandør" />
      <Panel>
        <SupplierForm />
      </Panel>
    </div>
  );
}
