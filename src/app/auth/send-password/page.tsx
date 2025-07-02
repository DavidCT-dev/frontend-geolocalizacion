import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { GuestGuard } from '@/components/auth/guest-guard';
import { Layout } from '@/components/auth/layout';
import { SendPasswordForm } from '@/components/auth/send-password-form';

export const metadata = { title: `Reiniciar contraseña | Auth | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <Layout>
      <GuestGuard>
        <SendPasswordForm />
      </GuestGuard>
    </Layout>
  );
}
