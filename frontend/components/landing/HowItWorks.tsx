import { FlaskConical, Rocket, type LucideIcon } from "lucide-react";
import Container from "@/components/landing/Container";
import SectionHeading from "@/components/landing/SectionHeading";

interface StepTrackProps {
  title: string;
  icon: LucideIcon;
  steps: string[];
}

const ENTREPRENEUR_STEPS = [
  "Publica tu proyecto y describe qué necesitas probar.",
  "Revisa las postulaciones y elige a tus testers.",
  "Recibe los reportes y lanza con más confianza.",
];

const TESTER_STEPS = [
  "Explora los proyectos y postúlate.",
  "Prueba un producto real y reporta lo que encuentres.",
  "Recibe valoraciones que construyen tu reputación.",
];

// Steps sit on a green line: vertical (left) on mobile, horizontal (top) from md up.
// The negative margins center each 38px counter on the 2px line.
function StepTrack({ title, icon: Icon, steps }: StepTrackProps) {
  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Icon aria-hidden="true" className="h-6 w-6 text-brand-green" />
        <h3 className="text-[1.3rem] font-extrabold">{title}</h3>
      </div>
      <ol className="grid border-l-2 border-brand-green pl-7 md:grid-cols-3 md:border-l-0 md:border-t-2 md:pl-0">
        {steps.map((step, index) => (
          <li key={step} className="pb-7 last:pb-0 md:pb-0 md:pr-7">
            <span
              aria-hidden="true"
              className="-ml-12 mb-2.5 grid h-[38px] w-[38px] place-items-center rounded-full bg-brand-orange font-extrabold text-white md:-mt-5 md:mb-3.5 md:ml-0"
            >
              {index + 1}
            </span>
            <p className="text-lg text-(--lp-mute)">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="py-[72px]">
      <Container>
        <SectionHeading id="how-heading" title="Así funciona Junior Bridge">
          <p>Un mismo puente, dos recorridos.</p>
        </SectionHeading>
        <div className="mt-10 space-y-14">
          <StepTrack title="Si emprendes" icon={Rocket} steps={ENTREPRENEUR_STEPS} />
          <StepTrack title="Si eres tester" icon={FlaskConical} steps={TESTER_STEPS} />
        </div>
      </Container>
    </section>
  );
}
