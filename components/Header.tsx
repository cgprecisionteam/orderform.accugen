import Image from 'next/image';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Left — logo */}
        <div className="flex items-center">
          <Image
            src="/accugenworkmark_logo.png"
            alt="Accugen Logo"
            width={1200}
            height={400}
            className="h-20 w-auto object-contain"
            priority
          />
        </div>

        {/* Right — support */}
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400 leading-tight">For support</p>
          <p className="text-xs font-medium text-gray-700 leading-tight">orders@accugendental.com</p>
          <p className="text-xs font-medium text-gray-700 leading-tight">+91 7075488757</p>
        </div>
      </div>
    </header>
  );
}
