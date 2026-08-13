import { useLocation, useNavigate } from 'react-router-dom';

export function useRouter(): { push: (to: string) => void; replace: (to: string) => void; back: () => void } {
  const navigate = useNavigate();
  return { push: (to) => navigate(to), replace: (to) => navigate(to, { replace: true }), back: () => navigate(-1) };
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(useLocation().search);
}