export default function KioskTemplate({ children }: { children: React.ReactNode }) {
  return <div className="kiosk-page-transition flex min-h-full flex-col bg-transparent">{children}</div>;
}
