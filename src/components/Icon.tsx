type Props = { name: string; className?: string };

const paths: Record<string, React.ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5 10v10h14V10" />,
  check: <path d="M20 6 9 17l-5-5" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  food: (
    <>
      <path d="M4 3v18M8 3v6a2 2 0 0 1-4 0" />
      <path d="M16 3c-1.5 0-3 1.5-3 5s1.5 5 3 5v8" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-3.5-5.5" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15v3M12 9v9M17 5v13" />
    </>
  ),
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />,
  pencil: <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M16 14h2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  clipboard: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
};

export default function Icon({ name, className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? null}
    </svg>
  );
}
