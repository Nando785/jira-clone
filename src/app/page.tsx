"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useCurrent } from '@/features/auth/api/use-current';
import { useLogout } from '@/features/auth/api/use-logout';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const { data, isLoading } = useCurrent();
  const { mutate } = useLogout();

  useEffect(() => {
    if (!isLoading && !data) {
      router.push("/sign-in");
    }
  }, [data]);

  return (
    <div className=''>
      This page is only visible to authenticated users. If you see this, you are authenticated!
      <Button onClick={()=> mutate()}>
        Log Out
      </Button>
    </div>
  );
}
