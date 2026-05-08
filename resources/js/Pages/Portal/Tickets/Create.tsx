import React from 'react';
import { router } from '@inertiajs/react';
import PortalLayout from '../Layout';
import TicketForm, { Category, TicketFormData } from '../../../Components/TicketForm';
import { useState } from 'react';

type Props = {
    categories: Category[] | null;
    priorities: string[] | null;
};

export default React.memo(function PortalTicketCreate({ categories = [], priorities = [] }: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (data: TicketFormData) => {
        console.log('Form data received:', data);
        setProcessing(true);
        setErrors({});
        
        // Create FormData manually for proper file handling
        const formData = new FormData();
        formData.append('category_id', data.category_id);
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('priority', data.priority);
        
        // Append files properly
        data.attachments.forEach((file, index) => {
            formData.append(`attachments[${index}]`, file);
        });
        
        // Use router.post with FormData
        router.post('/portal/tickets', formData as any, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (errors) => {
                console.log('Errors:', errors);
                setErrors(errors as Record<string, string>);
                setProcessing(false);
            },
        });
    };

    return (
        <PortalLayout>
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-900">Buat Tiket Baru</h1>
                <p className="text-sm text-slate-500">Laporkan masalah atau permintaan kepada tim IT</p>
            </div>

            <TicketForm
                categories={Array.isArray(categories) ? categories : []}
                priorities={Array.isArray(priorities) ? priorities : []}
                onSubmit={handleSubmit}
                processing={processing}
                errors={errors}
            />
        </PortalLayout>
    );
});
