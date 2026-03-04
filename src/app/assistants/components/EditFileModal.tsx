"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import "easymde/dist/easymde.min.css";

interface EditFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistantId: number;
  assistantName: string;
  fileName: string;
}

export function EditFileModal({
  isOpen,
  onClose,
  assistantId,
  assistantName,
  fileName,
}: EditFileModalProps) {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const easyMDERef = useRef<any>(null);

  const hasChanges = content !== originalContent;

  useEffect(() => {
    if (isOpen && assistantId && fileName) {
      fetchFileContent();
    }
  }, [isOpen, assistantId, fileName]);

  useEffect(() => {
    // Delay initialization to avoid hydration issues
    const timer = setTimeout(() => {
      if (isOpen && !loading && editorRef.current && !easyMDERef.current) {
        initEasyMDE();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (easyMDERef.current) {
        easyMDERef.current.toTextArea();
        easyMDERef.current = null;
      }
    };
  }, [isOpen, loading, content]);

  const fetchFileContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/${assistantId}/files/${fileName}`);
      if (!res.ok) {
        if (res.status === 404) {
          setContent("");
          setOriginalContent("");
        } else {
          const data = await res.json();
          throw new Error(data.error || "Failed to load file");
        }
      } else {
        const data = await res.json();
        setContent(data.content || "");
        setOriginalContent(data.content || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  const initEasyMDE = () => {
    if (!editorRef.current) return;

    const EasyMDE = require("easymde");
    
    easyMDERef.current = new EasyMDE({
      element: editorRef.current,
      initialValue: content,
      autofocus: true,
      spellChecker: false,
      status: false,
      lineNumbers: true,
      lineWrapping: true,
      toolbar: [
        "bold", "italic", "heading", "|",
        "quote", "unordered-list", "ordered-list", "|",
        "link", "image", "|",
        "preview", "side-by-side", "fullscreen", "|",
        "guide"
      ],
      previewRender: (plainText: string) => {
        setContent(plainText);
        return "";
      },
      theme: "dark",
    });

    // Listen for changes
    easyMDERef.current.codemirror.on("change", () => {
      setContent(easyMDERef.current.value());
    });
  };

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/${assistantId}/files/${fileName}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setOriginalContent(content);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-[80%] h-[80%] bg-[var(--night)] rounded-lg border border-[var(--border)] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--lavender)]">
              Editing {fileName}
            </h2>
            <p className="text-sm text-[var(--dim-gray)]">
              Assistant: {assistantName}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-md text-[var(--lavender-muted)] hover:bg-[var(--night-lighter)] hover:text-[var(--lavender)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-md bg-[var(--error)]/10 text-[var(--error)] text-sm">
            {error}
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 p-6 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--tropical-indigo)]" />
            </div>
          ) : (
            <textarea
              ref={editorRef}
              className="w-full h-full"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <span className="text-sm text-[var(--dim-gray)]">
            {hasChanges ? "Unsaved changes" : "All changes saved"}
          </span>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
