import Container from "@/components/landing/Container";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-(--lp-line) py-7 text-[0.95rem] text-(--lp-mute)">
      <Container className="flex flex-wrap justify-center gap-4">
        <span>© {year} Junior Bridge. Todos los derechos reservados.</span>
      </Container>
    </footer>
  );
}
