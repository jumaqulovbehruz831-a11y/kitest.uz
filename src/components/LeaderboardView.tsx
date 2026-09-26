import React, { useState } from 'react';
import { User, ADMIN_EMAIL } from '../types';
import { Search, Trophy } from 'lucide-react';

interface LeaderboardViewProps {
  users: User[];
  currentUser: User | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  users,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const uniqueRegions = Array.from(
    new Set(users.map((u) => u.region).filter(Boolean))
  );

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.institution &&
        u.institution.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRegion =
      selectedRegion === 'all' || u.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const getRoleDisplay = (u: User) => {
    if (u.email.toLowerCase() === ADMIN_EMAIL) return 'Bosh Admin';
    if (u.role === 'creator') return 'Yaratuvchi';
    return u.ratingTitle;
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Umumiy Reyting Jadvali (Leaderboard)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ro'yxatdan o'tgan ishtirokchilarning CHSB testlari va olimpiadalardagi ko'rsatkichlari
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ishtirokchi ismi, username yoki ta'lim muassasasi..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Barcha hududlar</option>
            {uniqueRegions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="text-sm font-medium text-slate-300">
              {users.length === 0
                ? "Hozircha hech kim ro'yxatdan o'tmagan."
                : 'Qidiruv bo‘yicha ishtirokchi topilmadi.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/60">
                  <th className="py-3.5 px-4 font-medium">O'rin</th>
                  <th className="py-3.5 px-4 font-medium">Ishtirokchi</th>
                  <th className="py-3.5 px-4 font-medium">Hudud / Muassasa</th>
                  <th className="py-3.5 px-4 font-medium">Daraja / Rol</th>
                  <th className="py-3.5 px-4 font-medium">Yechilgan testlar</th>
                  <th className="py-3.5 px-4 font-medium">Jami ball</th>
                  <th className="py-3.5 px-4 font-medium text-right">Reyting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filteredUsers.map((u, idx) => {
                  const isMe = Boolean(currentUser) && currentUser!.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className={
                        isMe ? 'bg-emerald-950/25' : 'hover:bg-slate-800/30'
                      }
                    >
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs font-bold text-slate-300">
                        #{u.rank || idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {u.name}
                          {isMe && (
                            <span className="ml-2 text-xs text-emerald-400 font-normal">
                              (Siz)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          @{u.username}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        <div>{u.region || '—'}</div>
                        {u.institution && (
                          <div className="text-slate-400">{u.institution}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {getRoleDisplay(u)}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-200">
                        {u.solvedCount} ta ({u.submissionsCount} urinish)
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-sky-400 font-semibold">
                        {u.totalScore} ball
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-sm font-bold text-emerald-400">
                        {u.rating}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
