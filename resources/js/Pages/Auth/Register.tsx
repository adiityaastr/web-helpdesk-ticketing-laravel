import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        department: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>support_agent</span>
                    </div>
                    <h1 className="text-lg font-semibold text-slate-900">Buat Akun Baru</h1>
                    <p className="mt-1 text-sm text-slate-500">Daftar untuk mengakses helpdesk</p>
                </div>

                <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="mb-4">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Lengkap</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Nama lengkap"
                        />
                        {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="nama@perusahaan.com"
                        />
                        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                    </div>

                    <div className="mb-4 grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Telepon</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="Opsional"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Departemen</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                value={data.department}
                                onChange={(e) => setData('department', e.target.value)}
                                placeholder="Opsional"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Minimal 8 karakter"
                        />
                        {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
                    </div>

                    <div className="mb-5">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Konfirmasi Password</label>
                        <input
                            type="password"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Ulangi password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
                        disabled={processing}
                    >
                        Daftar
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-slate-500">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="font-medium text-teal-600 hover:text-teal-500">
                        Masuk
                    </Link>
                </p>
            </div>
        </div>
    );
}