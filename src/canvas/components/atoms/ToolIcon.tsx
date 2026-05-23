"use client";

type ToolIconProps = {
  name: "brush" | "bucket" | "eraser" | "eyedropper";
};

function BrushIcon() {
  return (
    <path d="M6 16c2.8 0 4.5-1.3 5.5-3l2.2-3.8c.3-.5.9-.7 1.4-.5l1.7.8c.5.2 1.1 0 1.4-.5l1.4-2.4c.4-.6.2-1.5-.4-1.9l-2.2-1.4c-.6-.4-1.5-.2-1.9.4l-2.4 4c-.2.3-.5.5-.9.4l-2-.5c-.4-.1-.8.1-1 .5L5.5 12.2C4.8 13.4 4 14 2.5 14" />
  );
}

function BucketIcon() {
  return (
    <path d="M6 8.5 10.5 4l7.5 7.5-4.5 4.5H8.5l-2 2H4.2l-1.7-1.7L6 8.5Zm1.6 1.6 5.8 5.8" />
  );
}

function EraserIcon() {
  return (
    <path d="M15.5 5.5 18.5 8.5 11 16H6L3.5 13.5l9-9c.8-.8 2.2-.8 3 0ZM7 16l-2.5 2.5H19" />
  );
}

function EyedropperIcon() {
  return (
    <path d="M14.5 4.5 19.5 9.5 10.5 18.5H5.5V13.5l9-9Zm-8 9 4 4M15.8 3.2l5 5" />
  );
}

export function ToolIcon({ name }: ToolIconProps) {
  const icon = {
    brush: <BrushIcon />,
    bucket: <BucketIcon />,
    eraser: <EraserIcon />,
    eyedropper: <EyedropperIcon />,
  }[name];

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      {icon}
    </svg>
  );
}
