import Icon from '@/Components/Icon';

interface FlashMessageProps {
    success?: string;
    error?: string;
}

export default function FlashMessage({ success, error }: FlashMessageProps) {
    return (
        <>
            {success && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <Icon name="check_circle" size={18} filled />
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <Icon name="error" size={18} filled />
                    {error}
                </div>
            )}
        </>
    );
}
