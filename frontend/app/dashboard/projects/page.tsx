"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Plus, ChevronRight, Search } from "lucide-react";
import {
  getProjects,
  updateProjectStatus,
  type AdminProject,
  type ProjectState,
} from "@/lib/api";

const clientProjects = [
  { id: "PRJ-001", name: "SaaS Dashboard", description: "Plataforma de gestión empresarial", testers: 3, bugs: 8, progress: 65, status: "IN PROGRESS", created: "01 Ago 2026" },
  { id: "PRJ-002", name: "App Fintech", description: "Aplicación de pagos móviles", testers: 1, bugs: 2, progress: 90, status: "IN REVIEW", created: "15 Jul 2026" },
  { id: "PRJ-003", name: "E-commerce Platform", description: "Tienda online con carrito y checkout", testers: 2, bugs: 15, progress: 100, status: "PUBLISHED", created: "10 Jun 2026" },
];

const testerProjects = [
  { id: "PRJ-004", name: "CRM Empresarial", owner: "Martin Díaz", skills: ["Web", "CRM"], deadline: "18 Ago 2026", status: "ABIERTO" },
  { id: "PRJ-005", name: "App de Salud", owner: "Laura Sosa", skills: ["Mobile", "iOS"], deadline: "22 Ago 2026", status: "ABIERTO" },
  { id: "PRJ-006", name: "Plataforma Educativa", owner: "Carlos Ruiz", skills: ["Web", "UX"], deadline: "10 Ago 2026", status: "CERRADO" },
];

const statusColors: Record<string, string> = {
  "PENDING": "bg-yellow-100 text-yellow-700",
  "OPEN": "bg-teal-100 text-teal-700",
  "IN_PROGRESS": "bg-green-100 text-green-700",
  "IN_REVIEW": "bg-orange-100 text-orange-600",
  "COMPLETED": "bg-blue-100 text-blue-700",
  "REJECTED": "bg-red-100 text-red-700",
  "IN PROGRESS": "bg-green-100 text-green-700",
  "IN REVIEW": "bg-orange-100 text-orange-600",
  "PUBLISHED": "bg-teal-100 text-teal-700",
  "ABIERTO": "bg-green-100 text-green-700",
  "CERRADO": "bg-gray-100 text-gray-400",
};

const projectStateLabels: Record<ProjectState, string> = {
  PENDING: "Pendiente",
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  COMPLETED: "Completado",
  REJECTED: "Rechazado",
};

type ProjectFilter = ProjectState | "ALL";

type PendingAction = {
  project: AdminProject;
  state: "OPEN" | "REJECTED";
};

export default function ProjectsPage() {
  const { user, isClient, isTester, isAdmin } = useUser();
  const [adminProjects, setAdminProjects] = useState<AdminProject[]>([]);
  const [projectFilter, setProjectFilter] =
    useState<ProjectFilter>("PENDING");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;

    getProjects()
      .then(setAdminProjects)
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar los proyectos.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

  const visibleAdminProjects = adminProjects.filter((project) => {
    const matchesState =
      projectFilter === "ALL" || project.state === projectFilter;
    const normalizedSearch = search.trim().toLowerCase();
    const clientName = `${project.client.name} ${project.client.surname}`
      .toLowerCase();
    const matchesSearch =
      project.title.toLowerCase().includes(normalizedSearch) ||
      clientName.includes(normalizedSearch);

    return matchesState && matchesSearch;
  });

  async function handleStatusChange(
    project: AdminProject,
    state: "OPEN" | "REJECTED",
  ) {
    setPendingAction(null);
    setProcessingId(project.id);
    setMessage("");
    setError("");

    try {
      const response = await updateProjectStatus(project.id, state);

      setAdminProjects((projects) =>
        projects.map((currentProject) =>
          currentProject.id === project.id
            ? { ...currentProject, state: response.state }
            : currentProject,
        ),
      );
      setMessage(
        state === "OPEN"
          ? "Proyecto aprobado correctamente."
          : "Proyecto rechazado correctamente.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar el proyecto.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (!user) return null;

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Proyectos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isClient && "Gestioná tus proyectos publicados"}
            {isTester && "Explorá proyectos disponibles"}
            {isAdmin && "Todos los proyectos de la plataforma"}
          </p>
        </div>
        {isClient && (
          <Link href="/dashboard/projects/new" className="flex items-center gap-2 rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition" style={{ backgroundColor: "#e07b39" }}>
            <Plus size={15} /> Nuevo Proyecto
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-72 border border-gray-200">
          <Search size={15} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar proyecto..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder-gray-400"
          />
        </div>
        {isAdmin && (
          <select
            value={projectFilter}
            onChange={(event) =>
              setProjectFilter(event.target.value as ProjectFilter)
            }
            className="bg-white rounded-full px-4 py-2 text-sm text-gray-600 border border-gray-200 outline-none"
          >
            <option value="ALL">Todos los estados</option>
            {Object.entries(projectStateLabels).map(([state, label]) => (
              <option key={state} value={state}>{label}</option>
            ))}
          </select>
        )}
      </div>

      {isClient && (
        <div className="flex flex-col gap-4">
          {clientProjects.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{p.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>{p.status}</span>
                  </div>
                  <p className="text-sm text-gray-400">{p.description}</p>
                </div>
                <button className="text-xs text-[#2d6a4f] font-medium hover:underline flex items-center gap-1">Ver <ChevronRight size={12} /></button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${p.progress}%`, backgroundColor: "#2d6a4f" }} />
                </div>
                <span className="text-xs text-gray-400">{p.progress}%</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>{p.testers} testers</span>
                <span>{p.bugs} bugs</span>
                <span>Creado: {p.created}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isTester && (
        <div className="flex flex-col gap-4">
          {testerProjects.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{p.name}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>{p.status}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">por {p.owner}</p>
                <div className="flex gap-1">{p.skills.map((s) => <span key={s} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{s}</span>)}</div>
                <p className="text-[10px] text-gray-400 mt-1">Cierre: {p.deadline}</p>
              </div>
              {p.status === "ABIERTO" && (
                <button className="ml-4 shrink-0 rounded-lg px-4 py-2 text-white text-xs font-semibold hover:opacity-90" style={{ backgroundColor: "#2d6a4f" }}>Postularme</button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div>
          {message && (
            <p className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">{message}</p>
          )}
          {error && (
            <p className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</p>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            {isLoading ? (
              <p className="text-center text-sm text-gray-400 py-8">Cargando proyectos...</p>
            ) : visibleAdminProjects.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No hay proyectos para mostrar.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                    {["ID", "Proyecto", "Emprendedor", "Modalidad", "Tecnologías", "Estado", "Creado", "Acciones"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {visibleAdminProjects.map((project) => (
                    <tr key={project.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 text-xs">{project.id}</td>
                      <td className="px-4 py-3 text-xs">
                        <p className="text-gray-700 font-medium">{project.title}</p>
                        <p className="text-gray-400 mt-1">{project.description}</p>
                        <div className="flex gap-3 mt-2">
                          <a
                            href={project.repository}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#2d6a4f] hover:underline"
                          >
                            Repositorio
                          </a>
                          <a
                            href={project.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#2d6a4f] hover:underline"
                          >
                            Demo
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {project.client.name} {project.client.surname}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{project.modality}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{project.technologies}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[project.state]}`}>
                          {projectStateLabels[project.state]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(project.created_at).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-4 py-3">
                        {project.state === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={processingId === project.id}
                              onClick={() => setPendingAction({ project, state: "OPEN" })}
                              className="bg-[#2d6a4f] text-white text-[10px] font-semibold rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              disabled={processingId === project.id}
                              onClick={() => setPendingAction({ project, state: "REJECTED" })}
                              className="border border-red-200 text-red-600 text-[10px] font-semibold rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {pendingAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Confirmar acción
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              ¿Querés {pendingAction.state === "OPEN" ? "aprobar" : "rechazar"} el proyecto &quot;{pendingAction.project.title}&quot;?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg px-4 py-2 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  handleStatusChange(
                    pendingAction.project,
                    pendingAction.state,
                  )
                }
                className={`text-white text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 ${
                  pendingAction.state === "OPEN"
                    ? "bg-[#2d6a4f]"
                    : "bg-red-600"
                }`}
              >
                {pendingAction.state === "OPEN" ? "Aprobar" : "Rechazar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
