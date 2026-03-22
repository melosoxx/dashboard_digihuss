import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel - Form */}
      <div className="flex w-full flex-col bg-[#0F1117] lg:w-[55%]">
        {children}
      </div>

      {/* Right panel - Image */}
      <div className="hidden w-[45%] overflow-hidden lg:block">
        <img
          src="/new_login.png"
          alt="Digital Products Dashboard"
          className="h-full w-full object-cover object-top scale-110"
        />
      </div>
    </div>
  );
}
