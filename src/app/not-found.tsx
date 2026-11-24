import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-5xl font-extrabold text-brand-700">404</p>
        <p className="mt-2 text-stone-600">Halaman tidak dijumpai.</p>
        <Link href="/" className="btn-primary mt-6">Kembali ke laman utama</Link>
      </div>
    </div>
  );
}
