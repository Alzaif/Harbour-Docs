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

export function IconStrikethrough() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 11h18v2H3v-2zm6.5-2A2.5 2.5 0 0112 7c1 0 1.8.4 2.3 1l1.6-1.2C15 5.7 13.6 5 12 5c-2.5 0-4.5 1.6-4.5 3.7 0 .1 0 .2.02.3H9.5zm5 6c0 1.4-1.1 2-2.5 2-1.2 0-2.2-.5-2.7-1.4l-1.7 1C7.4 18.2 9.5 19 12 19c2.6 0 4.5-1.4 4.5-3.7 0-.1 0-.2-.02-.3H14.5z" />
    </svg>
  );
}

export function IconTextColor() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11 3L5.5 17h2.25l1.12-3h6.25l1.13 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z" />
    </svg>
  );
}

export function IconHighlight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15.6 5.3l3.1 3.1c.4.4.4 1 0 1.4l-7 7-3.5.6-2 2-1.5-1.5 2-2 .6-3.5 7-7c.4-.4 1-.4 1.4 0zM4 20h7v2H4z" />
    </svg>
  );
}

export function IconSubscript() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 6h2.2l2 3.2L11.2 6H13.4l-3 4.6 3.2 5H11.3l-2.1-3.4L7 15.6H4.8l3.3-5L5 6zm15.5 13.5h-3v-1l1.4-1.2c.6-.5.9-.9.9-1.3 0-.3-.2-.5-.6-.5-.4 0-.7.2-1 .5l-.8-.7c.4-.6 1-.9 1.9-.9 1 0 1.8.5 1.8 1.4 0 .7-.4 1.2-1.1 1.8l-.7.5h1.9v.9z" />
    </svg>
  );
}

export function IconSuperscript() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 8h2.2l2 3.2L11.2 8H13.4l-3 4.6 3.2 5H11.3l-2.1-3.4L7 17.6H4.8l3.3-5L5 8zm15.5 1.5h-3v-1l1.4-1.2c.6-.5.9-.9.9-1.3 0-.3-.2-.5-.6-.5-.4 0-.7.2-1 .5l-.8-.7c.4-.6 1-.9 1.9-.9 1 0 1.8.5 1.8 1.4 0 .7-.4 1.2-1.1 1.8l-.7.5h1.9v.9z" />
    </svg>
  );
}

export function IconCode() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChecklist() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10 6h11v2H10V6zm0 10h11v2H10v-2zM3 5.5l1.5-1.5 1.5 1.5L4.5 9 2 6.5 3 5.5zm0 10L4.5 14l1.5 1.5L4.5 19 2 16.5l1-1z" />
    </svg>
  );
}

export function IconTable() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M3 15h18M9 4v16M15 4v16" />
    </svg>
  );
}

export function IconHorizontalRule() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 11h16v2H4z" />
    </svg>
  );
}

export function IconClearFormat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h12v2h-4.2l-1 7.2-1.9-1.9.7-5.3H9.7L6 3.3 7.4 2 20 14.6 18.6 16 6 5zm-.7 12.6L9 13.9 9.4 17H8l-.2 1.5L5 21l-1.3-1.3 1.6-2.1z" />
    </svg>
  );
}

export function IconLineSpacing() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 4l3 3H8v10h2l-3 3-3-3h2V7H4l3-3zm5 2h9v2h-9V6zm0 5h9v2h-9v-2zm0 5h9v2h-9v-2z" />
    </svg>
  );
}

export function IconWrapNone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="12" height="6" rx="1" />
      <path d="M4 14h16v1.5H4zm0 3h16v1.5H4z" />
    </svg>
  );
}

export function IconWrapLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="4" y="5" width="8" height="8" rx="1" />
      <path d="M14 6h6v1.5h-6zm0 3h6v1.5h-6zm-10 6h16v1.5H4zm0 3h16v1.5H4z" />
    </svg>
  );
}

export function IconWrapRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="12" y="5" width="8" height="8" rx="1" />
      <path d="M4 6h6v1.5H4zm0 3h6v1.5H4zm0 6h16v1.5H4zm0 3h16v1.5H4z" />
    </svg>
  );
}

export function IconFindReplace() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="10" cy="10" r="5" />
      <path d="M14 14l5 5" strokeLinecap="round" />
    </svg>
  );
}

export function IconBlockquote() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 7h4v4c0 2-1.3 3.5-3.5 4l-.5-1.2c1.2-.4 2-1.1 2-2.3H7V7zm7 0h4v4c0 2-1.3 3.5-3.5 4l-.5-1.2c1.2-.4 2-1.1 2-2.3H14V7z" />
    </svg>
  );
}
