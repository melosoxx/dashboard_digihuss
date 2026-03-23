export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-screen w-full items-center justify-center"
      style={{ backgroundColor: "#202124" }}
    >
      {children}
    </div>
  );
}
