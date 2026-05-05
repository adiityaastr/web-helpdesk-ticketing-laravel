interface FlashMessageProps {
    success?: string;
    error?: string;
}

export default function FlashMessage({ success, error }: FlashMessageProps) {
    return (
        <>
            {success && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>error</span>
                    {error}
                </div>
            )}
        </>
    );
}
