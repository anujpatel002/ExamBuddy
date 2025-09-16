'use client';
import { useSearchParams } from 'next/navigation';
import NotebookWorkspace from '@/components/notebook/NotebookWorkspace';

export default function NotebookPage() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get('subjectId') || 'default';

  return (
    <div className="h-screen overflow-hidden">
      <NotebookWorkspace subjectId={subjectId} />
    </div>
  );
}