import React from 'react';
import { useForm } from '@inertiajs/react';
import PortalLayout from '../Layout';
import TicketForm, { Category, TicketFormData } from '../../../Components/TicketForm';

type Props = {
    categories: Category[];
    priorities: string[];
};

export default React.memo(function PortalTicketCreate({ categories, priorities }: Props) {
    const { post, processing, errors } = useForm({});

    const handleSubmit = (data: TicketFormData) => {
        const formData = new FormData();
        formData.append('category_id', data.category_id);
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('priority', data.priority);
        data.attachments.forEach((file, index) => {
            formData.append(`attachments[${index}]`, file);
        });
        post('/portal/tickets', formData);
    };

    return (
        <PortalLayout>
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-900">Buat Tiket Baru</h1>
                <p className="text-sm text-slate-500">Laporkan masalah atau permintaan kepada tim IT</p>
            </div>

            <TicketForm
                categories={categories}
                priorities={priorities}
                onSubmit={handleSubmit}
                processing={processing}
                errors={errors}
            />
        </PortalLayout>
    );
});
