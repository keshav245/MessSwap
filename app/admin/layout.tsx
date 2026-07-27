import AdminSidebar from '@/components/admin/Sidebar';

// TODO: guard every /admin/* route with private.has_role(auth.uid(), 'owner')
// server-side (middleware or a layout-level redirect) — this layout has no
// auth check yet, it's presentation only.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <div className="flex gap-6">
        <AdminSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
