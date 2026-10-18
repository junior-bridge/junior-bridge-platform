import { Briefcase, Rocket, type LucideIcon } from "lucide-react";
import Container from "@/components/landing/Container";
import SectionHeading from "@/components/landing/SectionHeading";

interface AudienceNeed {
  title: string;
  icon: LucideIcon;
  need: string;
}

const AUDIENCE_NEEDS: AudienceNeed[] = [
  {
    title: "Tester junior",
    icon: Briefcase,
    need: "Necesita experiencia demostrable para conseguir su primer trabajo.",
  },
  {
    title: "Emprendedor",
    icon: Rocket,
    need: "Necesita que alguien pruebe su producto antes de lanzarlo.",
  },
];

const CHECK_BULLET_CLASSES =
  "relative py-[7px] pl-7 text-lg before:absolute before:left-0 before:top-[14px] before:h-2 before:w-3.5 before:-rotate-45 before:border-b-[3px] before:border-l-[3px] before:border-[#ffb48c] before:content-['']";

export default function ProblemSection() {
  return (
    <section aria-labelledby="problem-heading" className="bg-brand-green py-[72px] text-white">
      <Container>
        <SectionHeading
          id="problem-heading"
          title="Sin experiencia no hay trabajo. Sin trabajo no hay experiencia."
          tone="dark"
        >
          <p>
            Si buscas tu primer trabajo como tester, conoces el círculo: piden
            experiencia que todavía no tienes. Si emprendes, sabes que un equipo
            de QA rara vez entra en el presupuesto, y el producto sale sin que
            nadie lo haya probado a fondo. Son dos necesidades que, curiosamente,
            se resuelven entre sí.
          </p>
        </SectionHeading>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {AUDIENCE_NEEDS.map(({ title, icon: Icon, need }) => (
            <article
              key={title}
              className="rounded-[18px] border-2 border-white/22 bg-white/8 p-6 sm:p-[30px]"
            >
              <div className="mb-3.5 flex items-center gap-3">
                <Icon aria-hidden="true" className="h-7 w-7 text-[#ffb48c]" />
                <h3 className="text-[1.6rem] font-extrabold leading-tight">{title}</h3>
              </div>
              <ul>
                <li className={CHECK_BULLET_CLASSES}>{need}</li>
              </ul>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
