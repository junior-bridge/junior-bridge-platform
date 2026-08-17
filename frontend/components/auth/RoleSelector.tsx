export type RegistrationRole =
  | "tester"
  | "emprendedor";

interface RoleSelectorProps {
  value: RegistrationRole;
  onChange: (role: RegistrationRole) => void;
}

export default function RoleSelector({
  value,
  onChange,
}: RoleSelectorProps) {
  return (
    <div className="flex flex-col gap-2 mb-5">
      <span className="text-sm text-gray-700">
        Soy...
      </span>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange("tester")}
          className={`rounded-md border py-2.5 text-sm font-semibold transition ${
            value === "tester"
              ? "bg-[#2f7f70] border-[#2f7f70] text-white"
              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
          }`}
        >
          Tester Junior
        </button>

        <button
          type="button"
          onClick={() => onChange("emprendedor")}
          className={`rounded-md border py-2.5 text-sm font-semibold transition ${
            value === "emprendedor"
              ? "bg-[#2f7f70] border-[#2f7f70] text-white"
              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
          }`}
        >
          Emprendedor
        </button>
      </div>
    </div>
  );
}