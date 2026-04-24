import { FormEvent, useRef, useState, useCallback } from 'react';
import { Link, useForm } from '@inertiajs/react';
import PortalLayout from '../Layout';

type Category = { id: number; name: string; slug: string };

type Props = {
    categories: Category[];
    priorities: string[];
};

const priorityLabel: Record<string, string> = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

const MAX_ATTACHMENTS = 5;

export default function PortalTicketCreate({ categories, priorities }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        category_id: '',
        title: '',
        description: '',
        priority: 'medium',
        attachments: [] as File[],
    });

    const [cameraOpen, setCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const startCamera = useCallback(async () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch {
            alert('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
            setCameraOpen(false);
        }
    }, [facingMode]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    const openCamera = () => {
        setCameraOpen(true);
        setTimeout(() => startCamera(), 100);
    };

    const closeCamera = () => {
        stopCamera();
        setCameraOpen(false);
    };

    const switchCamera = () => {
        stopCamera();
        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
                const currentFiles = [...data.attachments, file];
                if (currentFiles.length > MAX_ATTACHMENTS) {
                    alert(`Maksimal ${MAX_ATTACHMENTS} lampiran.`);
                    return;
                }
                setData('attachments', currentFiles);

                const url = URL.createObjectURL(blob);
                setPreviews((prev) => [...prev, url]);
                showToast('Foto berhasil diambil!');
            },
            'image/jpeg',
            0.85
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        const currentFiles = [...data.attachments, ...files];
        if (currentFiles.length > MAX_ATTACHMENTS) {
            alert(`Maksimal ${MAX_ATTACHMENTS} lampiran.`);
            return;
        }
        setData('attachments', currentFiles);

        files.forEach((f) => {
            if (f.type.startsWith('image/')) {
                setPreviews((prev) => [...prev, URL.createObjectURL(f)]);
            }
        });
        showToast(`${files.length} file berhasil ditambahkan!`);
    };

    const removeAttachment = (index: number) => {
        const newFiles = [...data.attachments];
        newFiles.splice(index, 1);
        setData('attachments', newFiles);

        const newPreviews = [...previews];
        if (newPreviews[index]) {
            URL.revokeObjectURL(newPreviews[index]);
            newPreviews.splice(index, 1);
        }
        setPreviews(newPreviews);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/portal/tickets');
    };

    return (
        <PortalLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Buat Tiket Baru</h1>
                <p className="text-sm text-slate-500">Laporkan masalah atau permintaan kepada tim IT</p>
            </div>

            <form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
                    <select
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={data.category_id}
                        onChange={(e) => setData('category_id', e.target.value)}
                    >
                        <option value="">Pilih kategori</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.category_id && <p className="mt-1 text-xs text-rose-600">{errors.category_id}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Judul</label>
                    <input
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="Deskripsi singkat masalah Anda"
                    />
                    {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi Lengkap</label>
                    <textarea
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        rows={6}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Jelaskan masalah atau permintaan Anda secara detail..."
                    />
                    {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Prioritas</label>
                    <select
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={data.priority}
                        onChange={(e) => setData('priority', e.target.value)}
                    >
                        {priorities.map((p) => <option key={p} value={p}>{priorityLabel[p] ?? p}</option>)}
                    </select>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Lampiran ({data.attachments.length}/{MAX_ATTACHMENTS})
                    </label>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={openCamera}
                            disabled={data.attachments.length >= MAX_ATTACHMENTS}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Ambil Foto
                        </button>

                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            Pilih File
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf"
                                className="sr-only"
                                onChange={handleFileChange}
                                disabled={data.attachments.length >= MAX_ATTACHMENTS}
                            />
                        </label>
                    </div>
                    {errors.attachments && <p className="mt-1 text-xs text-rose-600">{errors.attachments}</p>}

                    {data.attachments.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                            {data.attachments.map((file, i) => (
                                <div key={i} className="group relative overflow-hidden rounded-lg border border-slate-200">
                                    {previews[i] ? (
                                        <img src={previews[i]} alt={file.name} className="h-24 w-full object-cover" />
                                    ) : (
                                        <div className="flex h-24 w-full items-center justify-center bg-slate-50">
                                            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(i)}
                                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs text-white opacity-0 transition group-hover:opacity-100"
                                    >
                                        ✕
                                    </button>
                                    <p className="truncate px-1 py-0.5 text-[10px] text-slate-500">{file.name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50" disabled={processing}>
                        Kirim Tiket
                    </button>
                    <Link href="/portal/tickets" className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Batal
                    </Link>
                </div>
            </form>

            {cameraOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black" onClick={(e) => { if (e.target === e.currentTarget) closeCamera(); }}>
                    <div className="flex items-center justify-between bg-black p-3">
                        <h3 className="text-sm font-medium text-white">Ambil Foto Masalah</h3>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={switchCamera}
                                className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30"
                            >
                                {facingMode === 'environment' ? '📷 Depan' : '📷 Belakang'}
                            </button>
                            <button
                                type="button"
                                onClick={closeCamera}
                                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>

                    <div className="relative flex flex-1 items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="max-h-[70vh] w-full object-contain"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex items-center justify-center gap-4 bg-black p-4">
                        <button
                            type="button"
                            onClick={switchCamera}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0V9a8 8 0 0115.356 2m-2.2-2.2A5.001 5.001 0 006.582 9m10.176 4.2A5.001 5.001 0 006.582 9" /></svg>
                        </button>
                        <button
                            type="button"
                            onClick={capturePhoto}
                            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 hover:bg-white/30"
                        >
                            <div className="h-12 w-12 rounded-full bg-white" />
                        </button>
                        <button
                            type="button"
                            onClick={closeCamera}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-[fadeUp_0.3s_ease-out] rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {toast}
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}