import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import Icon from '@/Components/Icon';

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
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600">
                        <Icon name="support_agent" size={22} className="text-white" />
                    </div>
                    <h1 className="text-lg font-semibold text-slate-900">Helpdesk Ticketing</h1>
                    <p className="mt-1 text-sm text-slate-500">Masuk ke akun Anda</p>
                </div>

                <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6">
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

                    <div className="mb-4">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Masukkan password"
                        />
                        {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
                    </div>

                    <div className="mb-5 flex items-center">
                        <input
                            type="checkbox"
                            id="remember"
                            className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <label htmlFor="remember" className="ml-2 text-sm text-slate-600">Ingat saya</label>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
                        disabled={processing}
                    >
                        Masuk
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-slate-500">
                    Belum punya akun?{' '}
                    <Link href="/register" className="font-medium text-teal-600 hover:text-teal-500">
                        Daftar sekarang
                    </Link>
                </p>
            </div>
        </div>
    );
}
