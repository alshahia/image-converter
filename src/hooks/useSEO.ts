import { useEffect, useRef } from 'react';

const SITE_NAME = 'Drift';

export function useSEO(title: string, description?: string) {
  // Monotonic write id. Each effect run increments it on mount and again on
  // cleanup. Pending rAF callbacks check the id and bail if it has changed,
  // so intermediate writes between rapid route changes are discarded.
  const writeIdRef = useRef(0);

  useEffect(() => {
    const myWrite = ++writeIdRef.current;
    const prevTitle = document.title;
    const prevMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = prevMeta?.getAttribute('content') ?? '';

    const apply = () => {
      if (writeIdRef.current !== myWrite) return;
      document.title = `${title} · ${SITE_NAME}`;
      if (description) {
        let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'description';
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', description);
      }
    };

    const revert = () => {
      if (writeIdRef.current !== myWrite) return;
      document.title = prevTitle;
      if (description) {
        const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (meta) meta.setAttribute('content', prevDesc);
      }
    };

    const rafId = requestAnimationFrame(apply);

    return () => {
      cancelAnimationFrame(rafId);
      revert();
    };
  }, [title, description]);
}
