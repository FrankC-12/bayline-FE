import ModuleCard from "./ModuleCard";
import { modules } from "./modules-data";

export default function ModuleGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {modules.map((m) => (
        <ModuleCard key={m.title} {...m} />
      ))}
    </div>
  );
}