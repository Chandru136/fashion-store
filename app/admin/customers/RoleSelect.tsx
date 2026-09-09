"use client";

export function RoleSelect({ role }: { role: string }) {
  return <select
    id="customer-role"
    name="role"
    defaultValue={role}
    onChange={(event) => event.currentTarget.form?.requestSubmit()}
    className="rounded border border-stone-300 px-3 py-2 text-sm"
  >
    <option value="">Select Customer or Admin</option>
    <option value="CUSTOMER">Customers</option>
    <option value="ADMIN">Admins</option>
  </select>;
}
