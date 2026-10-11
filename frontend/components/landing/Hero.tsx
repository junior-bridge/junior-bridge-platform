import Container from "@/components/landing/Container";
import LandingButton from "@/components/landing/LandingButton";

type ProjectStatus = "En progreso" | "En revisión" | "Publicado";
type ReportPriority = "Alta" | "Media";

const HERO_PROJECTS: { name: string; status: ProjectStatus; progress: number }[] = [
  { name: "App de reservas", status: "En progreso", progress: 65 },
  { name: "Tienda online", status: "En revisión", progress: 90 },
  { name: "Portal de clientes", status: "Publicado", progress: 0 },
];

const HERO_REPORTS: { id: string; title: string; priority: ReportPriority }[] = [
  { id: "#BUG-1024", title: "El botón de pago no responde en Android", priority: "Alta" },
  { id: "#BUG-1025", title: "Retraso al cargar las notificaciones", priority: "Media" },
];

// Full class names are listed so Tailwind can detect them at build time.
const STATUS_TAG_CLASSES: Record<ProjectStatus, string> = {
  "En progreso": "bg-(--lp-mint) text-brand-green",
  "En revisión": "bg-(--lp-salmon) text-(--lp-salmon-ink)",
  Publicado: "bg-(--lp-line) text-(--lp-mute)",
};

const PRIORITY_PILL_CLASSES: Record<ReportPriority, string> = {
  Alta: "bg-(--lp-salmon) text-(--lp-salmon-ink)",
  Media: "bg-(--lp-line) text-(--lp-mute)",
};

export default function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="pb-[72px] pt-10 lg:pb-[88px] lg:pt-14">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1
            id="hero-heading"
            className="mb-[18px] text-[clamp(2.4rem,5.4vw,4rem)] font-extrabold leading-[1.02] tracking-[-1.5px]"
          >
            Proyectos reales para testers junior, pruebas reales para
            emprendedores
          </h1>
          <p className="mb-7 max-w-[32em] text-xl text-(--lp-mute)">
            Junior Bridge conecta a emprendedores que necesitan probar su
            producto con testers que buscan su primera experiencia profesional.
            Gratis para ambos.
          </p>
          <LandingButton href="/register">Crear mi cuenta gratis</LandingButton>
          <p className="mt-7 text-[0.95rem] text-(--lp-mute)">
            Sin costo. Al registrarte eliges si eres tester o emprendedor.
          </p>
        </div>

        <HeroDashboardMock />
      </Container>
    </section>
  );
}

// Decorative preview of the dashboard built from simulated data; hidden from screen readers.
function HeroDashboardMock() {
  return (
    <div
      aria-hidden="true"
      className="w-full rounded-[20px] border-2 border-(--lp-line) bg-(--lp-card) p-5 shadow-[0_18px_40px_rgba(45,106,79,0.15)]"
    >
      <p className="mb-3 text-[1.05rem] font-bold">Mis proyectos</p>
      <ul className="space-y-2.5">
        {HERO_PROJECTS.map((project) => (
          <li
            key={project.name}
            className="rounded-xl border-[1.5px] border-(--lp-line) bg-(--lp-bg) px-3.5 py-3"
          >
            <div className="flex items-center justify-between gap-2 font-semibold">
              {project.name}
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${STATUS_TAG_CLASSES[project.status]}`}
              >
                {project.status}
              </span>
            </div>
            <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-(--lp-line)">
              <div
                className="h-full rounded-full bg-brand-green"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mb-2 mt-4 text-[1.05rem] font-bold">Reportes recientes</p>
      <ul>
        {HERO_REPORTS.map((report) => (
          <li
            key={report.id}
            className="flex justify-between gap-2 border-t border-(--lp-line) px-0.5 py-2 text-[0.9rem]"
          >
            <span>
              {report.id} {report.title}
            </span>
            <span
              className={`shrink-0 self-center rounded-full px-2.5 py-px text-[0.7rem] font-bold ${PRIORITY_PILL_CLASSES[report.priority]}`}
            >
              {report.priority}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
