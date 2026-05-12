'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { invitationsService } from '@/services/invitations';

export default function VerifyInvitationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; code?: string }>({});

  useEffect(() => {
    const e = searchParams.get('email') ?? '';
    const c = searchParams.get('code') ?? '';
    if (e) setEmail(e);
    if (c) setCode(c);
  }, [searchParams]);

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email invalide';
    if (!code.trim()) errs.code = 'Code requis';
    else if (code.trim().length !== 32) errs.code = 'Le code doit contenir 32 caractères';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const data = await invitationsService.verifyAccess(email.trim(), code.trim());

      // Persist for the invitation page (used to verify access)
      try {
        sessionStorage.setItem('invitation_code', data.unique_code);
        sessionStorage.setItem('invitation_email', email.trim());
      } catch {}

      if (data.status === 'completed') {
        toast.success('Cette invitation a déjà été soumise.');
      }
      router.push(`/invitation/${data.unique_code}`);
    } catch (err: any) {
      const msg = err.message || 'Email ou code invalide';
      toast.error(msg);
      if (msg.toLowerCase().includes('expir')) {
        setErrors({ code: 'Cette invitation a expiré' });
      } else {
        setErrors({ code: 'Email ou code invalide' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Background */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/bg0.jpg)' }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-r from-blue-700/80 to-blue-900/80" />

      <div className="relative w-full max-w-md">
        <div className="rounded-xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <Image
              src="/logo2.png"
              alt="Volonté Canada"
              width={150}
              height={50}
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">Accès à mon invitation</h1>
            <p className="mt-2 text-sm text-gray-600">
              Veuillez entrer votre email et le code unique reçu par courriel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Code unique</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="32 caractères"
                maxLength={32}
                className={`w-full rounded-lg border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.code ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Vérification…' : 'Accéder à mon invitation'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-white/80">
          Volonté Canada — Cabinet d&apos;immigration
        </p>
      </div>
    </div>
  );
}
