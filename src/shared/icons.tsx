export type IconName =
  | "brush"
  | "bucket"
  | "eraser"
  | "eyedropper"
  | "shapes"
  | "eye"
  | "eyeOff"
  | "layers"
  | "plus"
  | "menu"
  | "hand"
  | "fullscreen"
  | "fullscreenExit"
  | "trash"
  | "chevronUp"
  | "chevronDown"
  | "save"
  | "import"
  | "export"
  | "delete"
  | "palette"
  | "undo"
  | "redo"
  | "home";

type IconProps = {
  name: IconName;
  className?: string;
};

const ICON_MAP: Record<IconName, (props: { className?: string }) => React.ReactNode> = {
  brush: () => (
    <IconSvg className="h-5 w-5">
      <path d="M6.5 15.5c1.9 0 3.3-.8 4.4-2l6.2-6.2c.5-.5.5-1.3 0-1.8l-1.6-1.6c-.5-.5-1.3-.5-1.8 0l-6.2 6.2c-1.2 1.2-2 2.6-2 4.4 0 .6-.5 1.1-1.1 1.1H3c0 1.7 1.3 3 3 3 2.5 0 4.2-1.1 5.2-3.1" />
    </IconSvg>
  ),
  bucket: () => (
    <IconSvg className="h-5 w-5">
      <path d="M6 9.5 10.5 5l7 7-4.5 4.5H8.5l-2 2H4l-1.5-1.5L6 9.5Z" />
      <path d="M8 14.5c0 1.2 1 2.2 2.2 2.2h3.1" />
      <path d="M11.5 7.5 14 10" />
    </IconSvg>
  ),
  eraser: () => (
    <IconSvg className="h-5 w-5">
      <path d="M15.8 5.2 19 8.4c.7.7.7 1.8 0 2.5L12 18h-6L3 15l9.8-9.8c1-.9 2.1-.9 3 0Z" />
      <path d="M7 18h12" />
    </IconSvg>
  ),
  eyedropper: () => (
    <IconSvg className="h-5 w-5">
      <path d="M14.5 4.5 19.5 9.5 10.5 18.5H5.5V13.5l9-9Z" />
      <path d="M7.5 16.5 11 20" />
      <path d="M16 3 21 8" />
    </IconSvg>
  ),
  shapes: () => (
    <IconSvg className="h-5 w-5">
      <rect x="3.5" y="6.5" width="7" height="5" rx="0.5" />
      <ellipse cx="16" cy="9" rx="4.5" ry="3" />
      <polygon points="12 16 7 21 17 21" />
    </IconSvg>
  ),
  eye: () => (
    <IconSvg className="h-3.5 w-3.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </IconSvg>
  ),
  eyeOff: () => (
    <IconSvg className="h-3.5 w-3.5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </IconSvg>
  ),
  layers: () => (
    <IconSvg className="h-4 w-4">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </IconSvg>
  ),
  plus: () => (
    <IconSvg className="h-3.5 w-3.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </IconSvg>
  ),
  menu: () => (
    <IconSvg className="h-4 w-4">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </IconSvg>
  ),
  hand: () => (
    <IconSvg className="h-4 w-4">
      <path d="M9 11V6.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M12 11V5.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M15 11V7a1.5 1.5 0 0 1 3 0v6.5c0 3.6-2.9 6.5-6.5 6.5H10c-2.8 0-5.2-1.7-6.2-4.3L2.5 13" />
      <path d="M6 12V8.5a1.5 1.5 0 0 1 3 0V13" />
    </IconSvg>
  ),
  fullscreen: () => (
    <IconSvg className="h-4 w-4">
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M16 21h5v-5" />
    </IconSvg>
  ),
  fullscreenExit: () => (
    <IconSvg className="h-4 w-4">
      <path d="M9 3v5H4" />
      <path d="M15 3v5h5" />
      <path d="M9 21v-5H4" />
      <path d="M15 21v-5h5" />
    </IconSvg>
  ),
  trash: () => (
    <IconSvg className="h-3.5 w-3.5">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </IconSvg>
  ),
  delete: () => (
    <IconSvg className="h-4 w-4">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
    </IconSvg>
  ),
  chevronUp: () => (
    <IconSvg className="h-3 w-3">
      <polyline points="18 15 12 9 6 15" />
    </IconSvg>
  ),
  chevronDown: () => (
    <IconSvg className="h-3 w-3">
      <polyline points="6 9 12 15 18 9" />
    </IconSvg>
  ),
  save: () => (
    <IconSvg className="h-4 w-4">
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v6h8V4" />
      <path d="M8 20v-6h8v6" />
    </IconSvg>
  ),
  import: () => (
    <IconSvg className="h-4 w-4">
      <path d="M12 3v12" />
      <path d="m8 11 4 4 4-4" />
      <path d="M5 21h14" />
    </IconSvg>
  ),
  export: () => (
    <IconSvg className="h-4 w-4">
      <path d="M12 21V9" />
      <path d="m8 13 4-4 4 4" />
      <path d="M5 3h14" />
    </IconSvg>
  ),
  palette: () => (
    <IconSvg className="h-4 w-4">
      <path d="M12 3C7 3 3 6.6 3 11s4 9 9 9c1.6 0 3-.8 3-2.3 0-.9-.7-1.7-1.6-1.7h-1.2c-1.1 0-2-.9-2-2s.9-2 2-2H15c1.7 0 3-1.3 3-3 0-3.3-2.8-6-6-6Z" />
      <circle cx="7.5" cy="10" r="1" />
      <circle cx="11" cy="7.5" r="1" />
      <circle cx="15.5" cy="8.5" r="1" />
    </IconSvg>
  ),
  undo: () => (
    <IconSvg className="h-5 w-5">
      <path d="M9 7H4v5" />
      <path d="M4 12c2-3 5-5 9-5 4.4 0 8 3.6 8 8s-3.6 8-8 8c-2.7 0-5.1-1.3-6.6-3.3" />
    </IconSvg>
  ),
  redo: () => (
    <IconSvg className="h-5 w-5">
      <path d="M15 7h5v5" />
      <path d="M20 12c-2-3-5-5-9-5-4.4 0-8 3.6-8 8s3.6 8 8 8c2.7 0 5.1-1.3 6.6-3.3" />
    </IconSvg>
  ),
  home: () => (
    <IconSvg className="h-5 w-5">
      <path d="M3 12 12 3l9 9" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
    </IconSvg>
  ),
};

function IconSvg({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-5 w-5"}>
      {children}
    </svg>
  );
}

export function Icon({ name, className }: IconProps) {
  const component = ICON_MAP[name];
  if (!component) return null;
  return component({ className });
}
