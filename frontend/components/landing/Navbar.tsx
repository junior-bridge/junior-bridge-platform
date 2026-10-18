import Image from "next/image";
import Link from "next/link";
import Container from "@/components/landing/Container";
import NavbarSession from "@/components/landing/NavbarSession";

export default function Navbar() {
  return (
    <header>
      <Container className="flex items-center justify-between py-5">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
        >
          <Image
            src="/logo.png"
            alt="Junior Bridge"
            width={160}
            height={50}
            priority
            className="h-9 w-auto"
          />
        </Link>
        <NavbarSession />
      </Container>
    </header>
  );
}
