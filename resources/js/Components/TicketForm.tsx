import React, { FormEvent, useRef, useState, useCallback, useEffect } from 'react';
import { priorityLabel } from '../Utils/badges';

export type Category = { id: number; name: string; slug: string };

export type TicketFormData = {
    category_id: string;
    title: string;
    description: string;
    priority: string;
    attachments: File[];
};

type TicketFormProps = {
    categories: Category[];
    priorities: string[];
    onSubmit: (data: TicketFormData) => void;
    processing?: boolean;
    errors?: Record<string, string>;
};

const MAX_ATTACHMENTS = 5;

export default React.memo(function TicketForm({
    categories,
    priorities,
    onSubmit,
    processing = false,
    errors = {},
}: TicketFormProps) {
    const [data, setData] = useState<TicketFormData>({
        category_id: '',
        title: '',
        description: '',
        priority: 'medium',
        attachments: [],
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
        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    };

    useEffect(() => {
        if (cameraOpen) {
            startCamera();
        }
    }, [facingMode, cameraOpen, startCamera]);

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
                setData((prev) => ({ ...prev, attachments: currentFiles }));

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
        setData((prev) => ({ ...prev, attachments: currentFiles }));

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
        setData((prev) => ({ ...prev, attachments: newFiles }));

        const newPreviews = [...previews];
        if (newPreviews[index]) {
            URL.revokeObjectURL(newPreviews[index]);
            newPreviews.splice(index, 1);
        }
        setPreviews(newPreviews);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(data);
    };

    const setField = (field: keyof TicketFormData, value: string | File[]) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Kategori</label>
                    <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        value={data.category_id}
                        onChange={(e) => setField('category_id', e.target.value)}
                    >
                        <option value="">Pilih kategori</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.category_id && <p className="mt-1 text-xs text-rose-600">{errors.category_id}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Judul</label>
                    <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        value={data.title}
                        onChange={(e) => setField('title', e.target.value)}
                        placeholder="Deskripsi singkat masalah Anda"
                    />
                    {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi Lengkap</label>
                    <textarea
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        rows={6}
                        value={data.description}
                        onChange={(e) => setField('description', e.target.value)}
                        placeholder="Jelaskan masalah atau permintaan Anda secara detail..."
                    />
                    {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Prioritas</label>
                    <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        value={data.priority}
                        onChange={(e) => setField('priority', e.target.value)}
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
                            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_camera</span>
                            Ambil Foto
                        </button>

                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>attach_file</span>
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
                                <div key={i} className="group relative overflow-hidden rounded-md border border-slate-200">
                                    {previews[i] ? (
                                        <img src={previews[i]} alt={file.name} className="h-24 w-full object-cover" />
                                    ) : (
                                        <div className="flex h-24 w-full items-center justify-center bg-slate-50">
                                            <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '32px' }}>description</span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(i)}
                                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white opacity-0 transition group-hover:opacity-100"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                                    </button>
                                    <p className="truncate px-1 py-0.5 text-[10px] text-slate-400">{file.name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="submit" className="rounded-md bg-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50" disabled={processing}>
                        Kirim Tiket
                    </button>
                    <a href="/portal/tickets" className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Batal
                    </a>
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
                                className="rounded-md bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30"
                            >
                                {facingMode === 'environment' ? 'Depan' : 'Belakang'}
                            </button>
                            <button
                                type="button"
                                onClick={closeCamera}
                                className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
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
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>cameraswitch</span>
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
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
                        </button>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-[fadeUp_0.3s_ease-out] rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        {toast}
                    </div>
                </div>
            )}
        </>
    );
});
