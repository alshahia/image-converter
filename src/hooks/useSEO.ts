import { useEffect } from 'react';

const SITE_NAME = 'Drift';

export function useSEO(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} · ${SITE_NAME}`;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content') ?? '';

    if (description) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle;
      if (meta && description) {
        meta.setAttribute('content', prevDesc);
      }
    };
  }, [title, description]);
}
