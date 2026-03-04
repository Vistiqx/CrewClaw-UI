"use client";

import { useState, useEffect, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Save, ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import "easymde/dist/easymde.min.css";

interface SaveStatus {
  type: "success" | "error" | null;
  message: string;
}

const WORKSPACE_FILES = [
  "SOUL.md",
  "AGENTS.md",
  "IDENTITY.md",
  "MEMORY.md",
  "TOOLS.md",
  "HEARTBEAT.md",
  "USER.md",
];

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ assistantId: string }>;
}) {
  const { assistantId } = use(params);
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ type: null, message: "" });
  const [easyMDE, setEasyMDE] = useState<any>(null);

  const { data: files = [] } = useQuery({
    queryKey: ["workspace-files", assistantId],
    queryFn: async () => {
      const res = await fetch(`/api/workspace/${assistantId}/files`);
      const data = await res.json();
      return data.files || [];
    },
  });

  const { data: fileContent, isLoading } = useQuery({
    queryKey: ["workspace-file-content", assistantId, selectedFile],
    queryFn: async () => {
      if (!selectedFile) return null;
      const res = await fetch(`/api/workspace/${assistantId}/files/${selectedFile}`);
      if (!res.ok) {
        if (res.status === 404) {
          return { content: "" };
        }
        throw new Error("Failed to fetch file");
      }
      return res.json();
    },
    enabled: !!selectedFile,
  });

  useEffect(() => {
    if (fileContent && !isLoading) {
      setContent(fileContent.content || "");
      setOriginalContent(fileContent.content || "");
    }
  }, [fileContent, isLoading]);

  // Initialize EasyMDE
  useEffect(() => {
    if (!selectedFile || isLoading) return;

    let mde: any = null;

    const initEditor = async () => {
      const EasyMDE = (await import("easymde")).default;

      mde = new EasyMDE({
        element: document.getElementById("easymde-editor") as HTMLTextAreaElement,
        initialValue: content,
        autofocus: true,
        spellChecker: false,
        autoDownloadFontAwesome: false,
        toolbar: [
          "bold",
          "italic",
          "heading",
          "|",
          "quote",
          "unordered-list",
          "ordered-list",
          "|",
          "link",
          "image",
          "|",
          "preview",
          "side-by-side",
          "fullscreen",
          "|",
          "guide",
        ],
        minHeight: "500px",
        maxHeight: "800px",
        status: ["lines", "words", "cursor"],
        styleSelectedText: false,
        lineWrapping: true,
        tabSize: 2,
        indentWithTabs: false,
      });

      mde.codemirror.on("change", () => {
        const newContent = mde.value();
        setContent(newContent);
      });

      setEasyMDE(mde);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initEditor, 100);

    return () => {
      clearTimeout(timer);
      if (mde) {
        mde.toTextArea();
      }
      setEasyMDE(null);
    };
  }, [selectedFile, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const res = await fetch(`/api/workspace/${assistantId}/files/${selectedFile}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      setOriginalContent(content);
      setSaveStatus({ type: "success", message: "Saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["workspace-file-content", assistantId, selectedFile] });
      setTimeout(() => {
        setSaveStatus({ type: null, message: "" });
      }, 3000);
    },
    onError: (error: Error) => {
      setSaveStatus({ type: "error", message: error.message });
    },
  });

  const handleSave = () => {
    if (!selectedFile) return;
    saveMutation.mutate(content);
  };

  const hasChanges = content !== originalContent;

  return (
    <div className="min-h-screen bg-[var(--night)] p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (window.location.href = "/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-[var(--lavender)]">
            Workspace Editor
          </h1>
          <span className="text-[var(--lavender-muted)]">/ {assistantId}</span>
        </div>

        <div className="grid grid-cols-[280px_1fr] gap-6">
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-[var(--lavender-muted)] uppercase tracking-wider">
              Files
            </h2>
            <div className="space-y-2">
              {WORKSPACE_FILES.map((file) => {
                const isAvailable = files.includes(file);
                const isSelected = selectedFile === file;

                return (
                  <button
                    key={file}
                    onClick={() => isAvailable && setSelectedFile(file)}
                    disabled={!isAvailable}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] transition-all duration-[var(--transition-base)] ${
                      isSelected
                        ? "bg-[var(--tropical-indigo)] text-[var(--night)]"
                        : isAvailable
                        ? "bg-[var(--night-light)] text-[var(--lavender)] hover:bg-[var(--night-lighter)]"
                        : "bg-[var(--night-light)] text-[var(--dim-gray)] cursor-not-allowed opacity-50"
                    }`}
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-mono truncate">{file}</span>
                  </button>
                );
              })}
            </div>

            {files.length === 0 && (
              <p className="text-sm text-[var(--dim-gray)] px-4">
                No workspace files found
              </p>
            )}
          </div>

          <div className="space-y-4">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-medium text-[var(--lavender)]">
                      {selectedFile}
                    </h2>
                    {hasChanges && (
                      <span className="text-xs text-[var(--warning)]">
                        (unsaved changes)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {saveStatus.type && (
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          saveStatus.type === "success"
                            ? "text-[var(--success)]"
                            : "text-[var(--error)]"
                        }`}
                      >
                        {saveStatus.type === "success" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {saveStatus.message}
                      </div>
                    )}
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={!hasChanges || isLoading || saveMutation.isPending}
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 h-[calc(100vh-220px)]">
                  <Card className="overflow-hidden">
                    <CardContent className="p-0 h-full">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full bg-[var(--night-light)]">
                          <Loader2 className="h-8 w-8 animate-spin text-[var(--tropical-indigo)]" />
                        </div>
                      ) : (
                        <textarea
                          id="easymde-editor"
                          className="w-full h-full bg-[var(--night-light)] text-[var(--lavender)] font-mono text-sm p-4"
                          style={{ display: "none" }}
                          defaultValue={content}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="overflow-auto">
                    <CardContent className="p-6 h-full markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content || "*No content*"}
                      </ReactMarkdown>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[calc(100vh-220px)]">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-[var(--dim-gray)] mx-auto mb-4" />
                  <p className="text-[var(--lavender-muted)]">
                    Select a file from the sidebar to edit
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
