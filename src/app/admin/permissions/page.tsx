import { prisma } from "@/lib/prisma";
import { updateUserRoleAction } from "../actions";

export default async function PermissionsPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { sub: true, email: true, name: true, role: true, createdAt: true },
  });

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-slate-100">Permissions</h2>
      <p className="mt-1 text-xs text-slate-400">
        Promote or demote users. Admins have full access to the console; regular users are limited to storefront actions.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-xs text-slate-300">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Joined</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {users.map((user) => (
              <tr key={user.sub}>
                <td className="py-2 pr-3 text-slate-200">{user.name ?? 'N/A'}</td>
                <td className="py-2 pr-3 text-slate-300">{user.email ?? 'N/A'}</td>
                <td className="py-2 pr-3 text-slate-300">{user.role}</td>
                <td className="py-2 pr-3 text-slate-400">{user.createdAt.toLocaleDateString()}</td>
                <td className="py-2 pr-3">
                  <form action={updateUserRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="sub" value={user.sub} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
