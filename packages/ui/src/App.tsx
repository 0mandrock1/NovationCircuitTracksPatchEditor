import { useState } from "react";
import { DeviceStatus } from "./components/common/DeviceStatus.js";

type View = "patch" | "samples" | "library";

export function App() {
  const [activeView, setActiveView] = useState<View>("patch");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-12 bg-panel-surface border-b border-panel-border shrink-0">
        <div className="flex items-center gap-2">
          {/* Logo / app name */}
          <span className="font-mono text-sm font-semibold text-accent-synth tracking-wide">
            CIRCUIT TRACKS
          </span>
          <span className="font-mono text-xs text-gray-500 tracking-widest">PATCH EDITOR</span>
        </div>

        {/* Navigation */}
        <nav className="flex gap-1">
          {(["patch", "samples", "library"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={[
                "px-3 py-1 text-xs font-mono uppercase tracking-wider rounded transition-colors",
                activeView === view
                  ? "bg-accent-synth text-black font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-panel-highlight",
              ].join(" ")}
            >
              {view}
            </button>
          ))}
        </nav>

        {/* Device connection status */}
        <DeviceStatus />
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {activeView === "patch" && <PatchEditorPlaceholder />}
        {activeView === "samples" && <SampleManagerPlaceholder />}
        {activeView === "library" && <LibraryPlaceholder />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placeholder views (replaced in Phase 3/4/5)
// ---------------------------------------------------------------------------

function PatchEditorPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <div className="text-4xl font-mono text-panel-highlight">◈</div>
        <p className="text-gray-500 text-sm font-mono">Patch Editor</p>
        <p className="text-gray-600 text-xs">Coming in Phase 3</p>
      </div>
    </div>
  );
}

function SampleManagerPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <div className="text-4xl font-mono text-panel-highlight">◈</div>
        <p className="text-gray-500 text-sm font-mono">Sample Manager</p>
        <p className="text-gray-600 text-xs">Coming in Phase 5</p>
      </div>
    </div>
  );
}

function LibraryPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <div className="text-4xl font-mono text-panel-highlight">◈</div>
        <p className="text-gray-500 text-sm font-mono">Patch Library</p>
        <p className="text-gray-600 text-xs">Coming in Phase 6</p>
      </div>
    </div>
  );
}
