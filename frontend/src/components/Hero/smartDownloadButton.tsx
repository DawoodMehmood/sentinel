'use client';

import Link from 'next/link';

export default function SmartDownloadButton({ className }: { className?: string }) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isMac = ua.includes('mac os x') || ua.includes('macintosh');
  const isLinux = ua.includes('linux');
  const href = isMac
    ? '/installers/macos.dmg'
    : isLinux
    ? '/installers/linux.AppImage'
    : '/installers/windows.exe';

  const label = isMac ? 'Download for macOS' : isLinux ? 'Download for Linux' : 'Download for Windows';

  return (
      <Link href={href} className={className}>{label}</Link>
  );
}
