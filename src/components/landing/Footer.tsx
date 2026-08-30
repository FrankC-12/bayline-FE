export default function Footer() {
  return (
    <footer className="bg-ash py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-steel sm:flex-row">
        <span className="font-display font-bold text-navy">Bayline</span>
        <span>© {new Date().getFullYear()} Bayline. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}