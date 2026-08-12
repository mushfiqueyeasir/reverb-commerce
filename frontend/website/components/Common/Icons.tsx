import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export function CartIcon({ className = "", size = 40 }: IconProps) {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      width={size}
      height={size}
    >
      <path
        d="m15.75 11.8h-3.16l-.77 11.6a5 5 0 0 0 4.99 5.34h7.38a5 5 0 0 0 4.99-5.33l-.78-11.61zm0 1h-2.22l-.71 10.67a4 4 0 0 0 3.99 4.27h7.38a4 4 0 0 0 4-4.27l-.72-10.67h-2.22v.63a4.75 4.75 0 1 1 -9.5 0zm8.5 0h-7.5v.63a3.75 3.75 0 1 0 7.5 0z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function SearchIcon({ className = "", size = 30 }: IconProps) {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      width={size}
      height={size}
    >
      <path
        d="M18 8a10 10 0 1 0 6.32 17.91l5.39 5.39a1 1 0 0 0 1.41-1.41l-5.39-5.39A10 10 0 0 0 18 8zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function MenuIcon({ className = "", size = 18 }: IconProps) {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 18 16"
      fill="none"
      width={size}
      height={size}
    >
      <path
        d="M1 .5a.5.5 0 100 1h15.71a.5.5 0 000-1H1zM.5 8a.5.5 0 01.5-.5h15.71a.5.5 0 010 1H1A.5.5 0 01.5 8zm0 7a.5.5 0 01.5-.5h15.71a.5.5 0 010 1H1a.5.5 0 01-.5-.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FacebookIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
    >
      <path d="M12 2.03998C6.5 2.03998 2 6.52998 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.84998C10.44 7.33998 11.93 5.95998 14.22 5.95998C15.31 5.95998 16.45 6.14998 16.45 6.14998V8.61998H15.19C13.95 8.61998 13.56 9.38998 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C15.9164 21.5878 18.0622 20.3855 19.6099 18.57C21.1576 16.7546 22.0054 14.4456 22 12.06C22 6.52998 17.5 2.03998 12 2.03998Z" />
    </svg>
  );
}

export function InstagramIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

export function YoutubeIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-143 145 512 512"
      fill="currentColor"
      width={size}
      height={size}
    >
      <polygon points="78.9,450.3 162.7,401.1 78.9,351.9 	" />
      <path
        d="M113,145c-141.4,0-256,114.6-256,256s114.6,256,256,256s256-114.6,256-256S254.4,145,113,145z M241,446.8L241,446.8
        c0,44.1-44.1,44.1-44.1,44.1H29.1c-44.1,0-44.1-44.1-44.1-44.1v-91.5c0-44.1,44.1-44.1,44.1-44.1h167.8c44.1,0,44.1,44.1,44.1,44.1
        V446.8z"
      />
    </svg>
  );
}

export function TwitterIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function PinterestIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.05 8.97 7.35 10.6-.1-.85-.18-2.15.04-3.08.19-.82 1.24-5.47 1.24-5.47s-.31-.62-.31-1.53c0-1.43.83-2.5 1.86-2.5.88 0 1.3.66 1.3 1.45 0 .88-.56 2.2-.85 3.42-.24 1.02.51 1.85 1.52 1.85 1.83 0 3.23-1.93 3.23-4.72 0-2.47-1.78-4.2-4.32-4.2-2.94 0-4.67 2.21-4.67 4.5 0 .88.34 1.82.76 2.33.08.1.09.19.07.3-.07.31-.24.98-.27 1.12-.04.18-.13.22-.3.13-1.12-.52-1.82-2.15-1.82-3.46 0-2.83 2.06-5.43 5.95-5.43 3.12 0 5.55 2.22 5.55 5.19 0 3.1-1.95 5.59-4.66 5.59-.91 0-1.77-.47-2.06-1.08l-.56 2.14c-.21.81-.78 1.83-1.16 2.45 1.03.32 2.12.49 3.24.49 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function TikTokIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      width={size}
      height={size}
    >
      <rect x="0" fill="none" width="20" height="20" />
      <g>
        <path d="M16.8 5.7C14.4 2 9.5.9 5.7 3.2 2 5.5.8 10.5 3.2 14.2l.2.3-.8 3 3-.8.3.2c1.3.7 2.7 1.1 4.1 1.1 1.5 0 3-.4 4.3-1.2 3.7-2.4 4.8-7.3 2.5-11.1zm-2.1 7.7c-.4.6-.9 1-1.6 1.1-.4 0-.9.2-2.9-.6-1.7-.8-3.1-2.1-4.1-3.6-.6-.7-.9-1.6-1-2.5 0-.8.3-1.5.8-2 .2-.2.4-.3.6-.3H7c.2 0 .4 0 .5.4.2.5.7 1.7.7 1.8.1.1.1.3 0 .4.1.2 0 .4-.1.5-.1.1-.2.3-.3.4-.2.1-.3.3-.2.5.4.6.9 1.2 1.4 1.7.6.5 1.2.9 1.9 1.2.2.1.4.1.5-.1s.6-.7.8-.9c.2-.2.3-.2.5-.1l1.6.8c.2.1.4.2.5.3.1.3.1.7-.1 1z" />
      </g>
    </svg>
  );
}
