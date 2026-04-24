import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">
                        H
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Helpdesk Ticketing</h1>
                    <p className="mt-1 text-sm text-slate-500">Masuk ke akun Anda</p>
                </div>

                <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="nama@perusahaan.com"
                        />
                        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Masukkan password"
                        />
                        {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
                    </div>

                    <div className="mb-6 flex items-center">
                        <input
                            type="checkbox"
                            id="remember"
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <label htmlFor="remember" className="ml-2 text-sm text-slate-600">Ingat saya</label>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        disabled={processing}
                    >
                        Masuk
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Belum punya akun?{' '}
                    <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Daftar sekarang
                    </Link>
                </p>
            </div>
        </div>
    );
}