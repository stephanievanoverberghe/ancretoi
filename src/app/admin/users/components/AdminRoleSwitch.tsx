'use client';

import { useCallback, useMemo, useState } from 'react';
import { Shield, User as UserIcon } from 'lucide-react';
import FullscreenModal from '@/components/ui/FullscreenModal';

type Props = {
    currentRole: 'user' | 'admin';
    formId: string; // id du <form> qui pointe sur setRole
};

export default function AdminRoleSwitch({ currentRole, formId }: Props) {
    const [open, setOpen] = useState(false);
    const [pendingRole, setPendingRole] = useState<'user' | 'admin'>(currentRole);

    const isUser = currentRole === 'user';
    const isAdmin = currentRole === 'admin';

    const submitWithRole = useCallback(
        (role: 'user' | 'admin') => {
            const form = document.getElementById(formId) as HTMLFormElement | null;
            if (!form) return;

            // met à jour l’input hidden role
            const roleInput = form.querySelector<HTMLInputElement>('input[name="role"]');
            if (roleInput) roleInput.value = role;

            form.requestSubmit(); // Next server action: setRole
        },
        [formId]
    );

    const onClickUser = useCallback(() => {
        if (isUser) return; // déjà actif
        submitWithRole('user'); // pas de modale pour downgrade
    }, [isUser, submitWithRole]);

    const onClickAdmin = useCallback(() => {
        if (isAdmin) return; // déjà actif
        setPendingRole('admin');
        setOpen(true); // affiche la modale d’avertissement
    }, [isAdmin]);

    const segmentedCls = useMemo(() => 'w-full grid grid-cols-2 sm:inline-flex rounded-2xl border border-brand-200 bg-background p-1 sm:w-auto', []);

    const baseBtn =
        'inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs tracking-[0.14em] uppercase font-semibold transition transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 focus-visible:ring-offset-2';

    return (
        <>
            {/* SWITCH segmenté */}
            <div className={segmentedCls} role="tablist" aria-label="Basculer le rôle">
                {/* Utilisateur */}
                <button
                    type="button"
                    onClick={onClickUser}
                    aria-pressed={isUser}
                    aria-current={isUser ? 'true' : undefined}
                    className={`${baseBtn} ${
                        isUser ? 'bg-brand-600 text-background shadow-sm' : 'cursor-pointer text-brand-700 hover:bg-brand-50 hover:-translate-y-[1px] hover:shadow-sm'
                    }`}
                    title="Basculer en Utilisateur"
                >
                    <UserIcon className="h-4 w-4" aria-hidden />
                    Utilisateur
                </button>

                {/* Admin (protégé par modale) */}
                <button
                    type="button"
                    onClick={onClickAdmin}
                    aria-pressed={isAdmin}
                    aria-current={isAdmin ? 'true' : undefined}
                    className={`${baseBtn} ${
                        isAdmin ? 'bg-brand-600 text-background shadow-sm' : 'cursor-pointer text-brand-700 hover:bg-brand-50 hover:-translate-y-[1px] hover:shadow-sm'
                    }`}
                    title="Basculer en Admin"
                >
                    <Shield className="h-4 w-4" aria-hidden />
                    Admin
                </button>
            </div>

            {/* MODALE d’avertissement (plein écran) */}
            <FullscreenModal open={open} onClose={() => setOpen(false)} title="Donner les droits administrateur" closeOnBackdrop={true} closeOnEsc={true}>
                <div className="space-y-3">
                    <p className="text-sm text-zinc-700">
                        Vous êtes sur le point d’accorder les <strong>droits administrateur</strong> à cet utilisateur.
                    </p>
                    <ul className="list-disc pl-5 text-sm text-zinc-700 space-y-1">
                        <li>Accès complet à l’interface d’administration.</li>
                        <li>Peut modifier/supprimer des contenus et des comptes.</li>
                        <li>Les actions sont potentiellement destructrices.</li>
                    </ul>
                    <p className="text-sm text-zinc-700">
                        Confirmez-vous l’élévation de rôle vers <strong>Admin</strong> ?
                    </p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                    <button type="button" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50" onClick={() => setOpen(false)}>
                        Annuler
                    </button>
                    <button
                        type="button"
                        className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                        onClick={() => {
                            setOpen(false);
                            submitWithRole(pendingRole); // => 'admin'
                        }}
                    >
                        Confirmer
                    </button>
                </div>
            </FullscreenModal>
        </>
    );
}
