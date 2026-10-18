import { Star, UserRound } from "lucide-react";
import Container from "@/components/landing/Container";
import SectionHeading from "@/components/landing/SectionHeading";

interface TopTester {
  name: string;
  specialty: string;
  rating: number;
  completedProjects: number;
}

const LANDING_STATS: { label: string; value: string }[] = [
  { label: "Testers registrados", value: "250+" },
  { label: "Proyectos publicados", value: "80+" },
  { label: "Postulaciones enviadas", value: "600+" },
  { label: "Reportes entregados", value: "1.200+" },
];

const TOP_TESTERS: TopTester[] = [
  { name: "Valentina Ríos", specialty: "Pruebas funcionales web", rating: 5, completedProjects: 12 },
  { name: "Mateo Herrera", specialty: "Testing de apps móviles", rating: 5, completedProjects: 9 },
  { name: "Camila Ortega", specialty: "Usabilidad y accesibilidad", rating: 4, completedProjects: 7 },
];

const MAX_RATING = 5;
const CARD_CLASSES = "rounded-2xl border-2 border-(--lp-line) bg-(--lp-card) p-5";

interface StarRatingProps {
  rating: number;
}

function StarRating({ rating }: StarRatingProps) {
  return (
    <div
      role="img"
      aria-label={`Valoración: ${rating} de ${MAX_RATING} estrellas`}
      className="flex gap-0.5"
    >
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={`h-4 w-4 ${
            index < rating ? "fill-brand-orange text-brand-orange" : "text-(--lp-line)"
          }`}
        />
      ))}
    </div>
  );
}

interface TesterCardProps {
  tester: TopTester;
}

function TesterCard({ tester }: TesterCardProps) {
  return (
    <article className={CARD_CLASSES}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--lp-mint) text-brand-green"
        >
          <UserRound className="h-5 w-5" />
        </span>
        <div>
          <h4 className="text-lg font-bold leading-tight">{tester.name}</h4>
          <p className="text-[0.95rem] text-(--lp-mute)">{tester.specialty}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <StarRating rating={tester.rating} />
        <p className="text-[0.95rem] text-(--lp-mute)">
          {tester.completedProjects} proyectos
        </p>
      </div>
    </article>
  );
}

export default function ReputationSection() {
  return (
    <section aria-labelledby="reputation-heading" className="py-[72px]">
      <Container>
        <SectionHeading id="reputation-heading" title="Experiencia que se puede demostrar">
          <p className="font-semibold text-brand-green">
            Cada proyecto completado suma valoraciones visibles en tu perfil.
          </p>
          <p className="mt-3">
            Las valoraciones las dejan los emprendedores con los que trabajaste.
            Así, tu perfil muestra algo concreto para tu próxima entrevista. Y si
            emprendes, puedes elegir testers según su historial, no a ciegas.
          </p>
        </SectionHeading>

        <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {LANDING_STATS.map((stat) => (
            <div key={stat.label} className={`flex flex-col-reverse ${CARD_CLASSES}`}>
              <dt className="text-[0.95rem] text-(--lp-mute)">{stat.label}</dt>
              <dd className="text-[clamp(1.8rem,5vw,2.3rem)] font-extrabold leading-[1.1]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-14 text-[1.3rem] font-extrabold">Testers mejor valorados</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {TOP_TESTERS.map((tester) => (
            <TesterCard key={tester.name} tester={tester} />
          ))}
        </div>
      </Container>
    </section>
  );
}
