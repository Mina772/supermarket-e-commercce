import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound(): JSX.Element {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-7xl font-black text-primary">404</p>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you are looking for doesn&apos;t exist or has moved.</p>
        <Button asChild className="mt-6">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
