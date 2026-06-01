/** Minimal line icons for the Docs toolbar (Google Docs–style). */

export function IconUndo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 14H4v5M4 14l4.5-4.5a7 7 0 1110 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconRedo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M15 14h5v5M20 14l-4.5-4.5a7 7 0 10-10 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPrint() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M7 9V4h10v5M7 18H5a2 2 0 01-2-2v-5h18v5a2 2 0 01-2 2h-2M7 14h10v6H7v-6z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconImage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M4 16l4-4 3 3 4-5 5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLink() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M10 14a4 4 0 005.66 0l2.12-2.12a4 4 0 00-5.66-5.66L10 7" strokeLinecap="round" />
      <path d="M14 10a4 4 0 00-5.66 0L6.22 12.12a4 4 0 105.66 5.66L14 17" strokeLinecap="round" />
    </svg>
  );
}

export function IconAlignLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5h16v2H4V5zm0 4h10v2H4V9zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" />
    </svg>
  );
}

export function IconAlignCenter() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5h16v2H4V5zm3 4h10v2H7V9zm-3 4h16v2H4v-2zm3 4h10v2H7v-2z" />
    </svg>
  );
}

export function IconAlignRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5h16v2H4V5zm6 4h10v2H10V9zm-6 4h16v2H4v-2zm6 4h10v2H10v-2z" />
    </svg>
  );
}

export function IconAlignJustify() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5h16v2H4V5zm0 4h16v2H4V9zm0 4h16v2H4v-2zm0 4h16v2H4v-2z" />
    </svg>
  );
}

export function IconBulletList() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 6h13v2H8V6zm0 5h13v2H8v-2zm0 5h13v2H8v-2zM5 6h2v2H5V6zm0 5h2v2H5v-2zm0 5h2v2H5v-2z" />
    </svg>
  );
}

export function IconNumberedList() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 6h12v2H9V6zm0 5h12v2H9v-2zm0 5h12v2H9v-2zM5 5h2v1H6v1h1v2H5V5zm0 5h1v1H5v1h1v1H5v-2zm0 4h1.5l-1.5 2h2l-1.5-2 1.5-2H5v2z" />
    </svg>
  );
}

export function IconIndentIncrease() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5h16v2H4V5zm0 4h10v2H4V9zm8 0h8v2h-8V9zm-8 5h16v2H4v-2zm8 0h8v2h-8v-2zM4 19h10v2H4v-2z" />
    </svg>
  );
}

export function IconIndentDecrease() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5h16v2H4V5zm0 4h10v2H4V9zm0 5h16v2H4v-2zm0 4h10v2H4v-2zM20 9v2h-8V9h8z" />
    </svg>
  );
}

export function IconDoc() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285f4" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path fill="#aecbfa" d="M14 2v6h6" />
      <path fill="#fff" d="M8 13h8v1.5H8V13zm0 3h8v1.5H8V16zm0 3h5v1.5H8V19z" />
    </svg>
  );
}

export function IconStar({ filled }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? '#f4b400' : 'none'} stroke={filled ? '#f4b400' : 'currentColor'} strokeWidth="1.75" aria-hidden>
      <path d="M12 3l2.4 5.5 6 .5-4.5 4 1.5 6L12 16.5 6.6 19l1.5-6L3.6 9l6-.5L12 3z" strokeLinejoin="round" />
    </svg>
  );
}
