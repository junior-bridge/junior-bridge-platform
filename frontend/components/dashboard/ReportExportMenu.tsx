"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Download } from "lucide-react";
import Swal from "sweetalert2";
import Loader from "@/components/ui/Loader";
import { downloadReports } from "@/services/report.service";
import type {
    ReportExportFilters,
    ReportExportFormat,
} from "@/types/reportTypes";

const formats: { format: ReportExportFormat; label: string }[] = [
    { format: "xlsx", label: "Descargar Excel" },
    { format: "pdf", label: "Descargar PDF" },
    { format: "csv", label: "Descargar CSV" },
];

type Props = {
    filters: ReportExportFilters;
    count: number;
    disabledReason?: string;
};

export default function ReportExportMenu({
    filters,
    count,
    disabledReason,
}: Props) {
    const [open, setOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const inFlight = useRef(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const menu = useRef<HTMLDivElement>(null);
    const id = useId();
    const reason =
        disabledReason ||
        (count === 0 ? "No hay reportes para exportar con estos filtros." : "");

    function focusOption(index: number) {
        menu.current
            ?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
            [index]?.focus();
    }

    function openMenu(last = false) {
        setOpen(true);
        window.requestAnimationFrame(() =>
            focusOption(last ? formats.length - 1 : 0),
        );
    }

    function handleMenuKey(event: KeyboardEvent<HTMLDivElement>) {
        const items = Array.from(
            menu.current?.querySelectorAll('[role="menuitem"]') ?? [],
        );
        const index = items.indexOf(document.activeElement as Element);
        if (
            ["ArrowDown", "ArrowUp", "Home", "End", "Escape"].includes(
                event.key,
            )
        ) {
            event.preventDefault();
            if (event.key === "Escape") {
                setOpen(false);
                trigger.current?.focus();
            } else {
                const next =
                    event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? items.length - 1
                          : (index +
                                (event.key === "ArrowDown" ? 1 : -1) +
                                items.length) %
                            items.length;
                focusOption(next);
            }
        }
    }

    async function handleExport(format: ReportExportFormat) {
        if (inFlight.current || reason) return;
        inFlight.current = true;
        setExporting(true);
        setOpen(false);
        try {
            await downloadReports(format, { ...filters }, count);
        } catch (error) {
            await Swal.fire({
                title: "No se pudo exportar",
                text:
                    error instanceof Error
                        ? error.message
                        : "Revisá tu conexión e intentá nuevamente.",
                icon: "error",
                confirmButtonText: "Aceptar",
            });
        } finally {
            inFlight.current = false;
            setExporting(false);
            window.requestAnimationFrame(() => trigger.current?.focus());
        }
    }

    return (
        <div
            className="relative flex flex-col items-start sm:items-end"
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                    setOpen(false);
            }}
        >
            <button
                ref={trigger}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open && !reason}
                aria-controls={`${id}-menu`}
                aria-describedby={`${id}-hint`}
                aria-busy={exporting}
                disabled={Boolean(reason) || exporting}
                onClick={() => (open ? setOpen(false) : openMenu())}
                onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                        event.preventDefault();
                        openMenu(event.key === "ArrowUp");
                    }
                }}
                className="flex items-center gap-2 rounded-full border border-brand-green px-4 py-2 text-sm font-semibold text-brand-green hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {exporting ? (
                    <Loader size={16} color="#2d6a4f" />
                ) : (
                    <Download size={16} aria-hidden="true" />
                )}
                <span aria-live="polite">
                    {exporting ? "Exportando..." : "Exportar"}
                </span>
                <ChevronDown size={15} aria-hidden="true" />
            </button>
            <p
                id={`${id}-hint`}
                className="mt-1 max-w-64 text-xs text-gray-600"
            >
                {reason ||
                    `${count} reporte${count === 1 ? "" : "s"} según los filtros activos`}
            </p>
            {open && !reason && !exporting && (
                <div
                    ref={menu}
                    id={`${id}-menu`}
                    role="menu"
                    aria-label="Formato de exportación"
                    onKeyDown={handleMenuKey}
                    className="absolute left-0 sm:left-auto sm:right-0 top-full z-20 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-1 shadow-lg"
                >
                    {formats.map(({ format, label }) => (
                        <button
                            key={format}
                            type="button"
                            role="menuitem"
                            tabIndex={-1}
                            onClick={() => void handleExport(format)}
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-green-50 focus:bg-green-50 focus:outline-none cursor-pointer"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
