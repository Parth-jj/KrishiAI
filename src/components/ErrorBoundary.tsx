import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  declare state: ErrorBoundaryState;
  declare props: { children: React.ReactNode };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || "An unexpected error occurred.",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Application ErrorBoundary caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendlyMessage = "Something went wrong while loading your workspace.";
      if (this.state.message.includes("Quota exceeded")) {
        friendlyMessage =
          "Daily database quota exceeded. Quota resets tomorrow.";
      } else if (this.state.message.includes("Missing or insufficient permissions")) {
        friendlyMessage =
          "Database permission error. Please sign out and sign in again.";
      }

      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E0D8] shadow-lg p-6 text-center space-y-4">
            <h2 className="text-lg font-black text-[#1B3F23]">
              KrishiAI Workspace Notice
            </h2>
            <p className="text-xs text-[#5C725E] font-medium">
              {friendlyMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#256030] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#1E4D2B] transition"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
