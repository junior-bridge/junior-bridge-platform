import Container from "@/components/landing/Container";
import LandingButton from "@/components/landing/LandingButton";
import LoginHint from "@/components/landing/LoginHint";

export default function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="py-[84px]">
      <Container className="text-center">
        <h2
          id="final-cta-heading"
          className="mx-auto mb-3 max-w-[14em] text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.8px]"
        >
          De cualquier lado del puente, el primer paso es el mismo
        </h2>
        <p className="mx-auto mb-7 max-w-[36em] text-lg text-(--lp-mute)">
          Crea tu cuenta gratis y elige si quieres probar proyectos o publicar el
          tuyo.
        </p>
        <LandingButton href="/register">Crear mi cuenta gratis</LandingButton>
        <LoginHint />
      </Container>
    </section>
  );
}
