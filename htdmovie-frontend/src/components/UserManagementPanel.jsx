import React from 'react';

const UserManagementPanel = ({
  busy,
  systemUsers,
  userFormData,
  setUserFormData,
  handleCreateUser,
  handlePromoteToStaff,
  resetUserForm,
  formatDateTime
}) => {
  return (
    <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Them tai khoan</h2>
          <p className="mt-2 text-sm text-gray-400">
            Tao tai khoan moi cho user hoac nhan vien ngay trong khu vuc quan tri.
          </p>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-200">Ten dang nhap</label>
            <input
              value={userFormData.username}
              onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
              placeholder="nhap username"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-200">Ho ten</label>
            <input
              value={userFormData.fullName}
              onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
              placeholder="Nhap ho ten"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-200">Email</label>
            <input
              type="email"
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-200">Mat khau</label>
            <input
              type="password"
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
              placeholder="Toi thieu 6 ky tu"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-200">Vai tro</label>
            <select
              value={userFormData.role}
              onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
            >
              <option value="user">user</option>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-500 disabled:opacity-60"
            >
              Tao tai khoan
            </button>
            <button
              type="button"
              onClick={resetUserForm}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Dat lai
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Quan ly tai khoan</h2>
            <p className="mt-2 text-sm text-gray-400">
              Admin co the tao tai khoan moi va nang quyen nguoi dung thong thuong thanh nhan vien.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gray-300">
            {systemUsers.length} tai khoan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-gray-400">
              <tr className="border-b border-white/10">
                <th className="pb-3 pr-4">Ten dang nhap</th>
                <th className="pb-3 pr-4">Nguoi dung</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Vai tro</th>
                <th className="pb-3 pr-4">Ngay tao</th>
                <th className="pb-3 text-right">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {systemUsers.map((account) => (
                <tr key={account.id} className="border-b border-white/5 text-gray-100">
                  <td className="py-4 pr-4 font-semibold">{account.username}</td>
                  <td className="py-4 pr-4">{account.full_name || '--'}</td>
                  <td className="py-4 pr-4">{account.email}</td>
                  <td className="py-4 pr-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        account.role === 'admin'
                          ? 'bg-red-500/15 text-red-200'
                          : account.role === 'staff'
                            ? 'bg-sky-500/15 text-sky-200'
                            : 'bg-white/10 text-gray-200'
                      }`}
                    >
                      {account.role}
                    </span>
                  </td>
                  <td className="py-4 pr-4">{formatDateTime(account.created_at)}</td>
                  <td className="py-4 text-right">
                    {account.role === 'user' ? (
                      <button
                        disabled={busy}
                        onClick={() => handlePromoteToStaff(account.id)}
                        className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                      >
                        Nang len staff
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {account.role === 'staff' ? 'Da la staff' : 'Admin'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPanel;
