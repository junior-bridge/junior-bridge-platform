import { getProjectAudit, runProjectAudit } from "@/services/project.service";
import { AuditStrategy, ProjectAudit } from "@/types/projectTypes";
import { useState } from "react";

export type ProjectAuditState = {
    isOpen: boolean;
    hasLoaded: boolean;
    loading: boolean;
    running: boolean;
    audit: ProjectAudit | null;
    strategy: AuditStrategy;
    error: string;
};

const INITIAL_STATE: ProjectAuditState = {
    isOpen: false,
    hasLoaded: false,
    loading: false,
    running: false,
    audit: null,
    strategy: "MOBILE",
    error: "",
};

export const useProjectAudit = () => {
    const [audits, setAudits] = useState<Record<number, ProjectAuditState>>({});

    function getAuditState(projectId: number): ProjectAuditState {
        return audits[projectId] ?? INITIAL_STATE;
    }

    function patchAuditState(
        projectId: number,
        patch: Partial<ProjectAuditState>,
    ) {
        setAudits((prev) => ({
            ...prev,
            [projectId]: { ...(prev[projectId] ?? INITIAL_STATE), ...patch },
        }));
    }

    async function loadAudit(projectId: number) {
        patchAuditState(projectId, { loading: true, error: "" });
        try {
            const audit = await getProjectAudit(projectId);
            patchAuditState(projectId, { audit, hasLoaded: true });
        } catch (err) {
            patchAuditState(projectId, {
                error:
                    err instanceof Error
                        ? err.message
                        : "No se pudo cargar la auditoría.",
            });
        } finally {
            patchAuditState(projectId, { loading: false });
        }
    }

    function toggleAudit(projectId: number) {
        const current = getAuditState(projectId);
        const isOpen = !current.isOpen;
        patchAuditState(projectId, { isOpen });

        if (isOpen && !current.hasLoaded && !current.loading) {
            loadAudit(projectId);
        }
    }

    function setAuditStrategy(projectId: number, strategy: AuditStrategy) {
        patchAuditState(projectId, { strategy });
    }

    async function handleRunAudit(projectId: number) {
        const { strategy } = getAuditState(projectId);
        patchAuditState(projectId, { running: true, error: "" });
        try {
            const audit = await runProjectAudit(projectId, strategy);
            patchAuditState(projectId, { audit, hasLoaded: true });
        } catch (err) {
            patchAuditState(projectId, {
                error:
                    err instanceof Error
                        ? err.message
                        : "No se pudo ejecutar la auditoría.",
            });
        } finally {
            patchAuditState(projectId, { running: false });
        }
    }

    return {
        getAuditState,
        toggleAudit,
        setAuditStrategy,
        handleRunAudit,
    };
};
