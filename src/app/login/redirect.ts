const localOrigin = 'https://library.invalid';

export function loginRedirectPath(value: string | null): string {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) {
    return '/';
  }

  try {
    const url = new URL(value, localOrigin);
    if (url.origin !== localOrigin || url.pathname.startsWith('//')) return '/';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
}
