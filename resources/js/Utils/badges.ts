export const statusBadge = (status: string) => {
    const map: Record<string, string> = { open: 'bg-blue-50 text-blue-700', in_progress: 'bg-orange-50 text-orange-700', resolved: 'bg-emerald-50 text-emerald-700', closed: 'bg-slate-100 text-slate-600', cancelled: 'bg-rose-50 text-rose-700' };
    return map[status] ?? 'bg-slate-100 text-slate-600';
};

export const priorityBadge = (priority: string) => {
    const map: Record<string, string> = { critical: 'bg-rose-50 text-rose-700', high: 'bg-orange-50 text-orange-700', medium: 'bg-amber-50 text-amber-700', low: 'bg-green-50 text-green-700' };
    return map[priority] ?? 'bg-slate-100 text-slate-600';
};

export const statusLabel: Record<string, string> = { open: 'Terbuka', in_progress: 'Sedang Diproses', resolved: 'Selesai', closed: 'Ditutup', cancelled: 'Dibatalkan' };

export const priorityLabel: Record<string, string> = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };
