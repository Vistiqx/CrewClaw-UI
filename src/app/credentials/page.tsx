"use client";

import { useEffect, useReducer } from "react";
import { Loader2 } from "lucide-react";
import { CredentialsHeader } from "./components/CredentialsHeader";
import { CredentialsTable } from "./components/CredentialsTable";
import { AddCredentialDialog } from "./components/AddCredentialDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

type Credential = {
  id: number;
  assistant_id: number;
  type: string;
  name: string;
  masked_value: string;
  assistant_name: string;
  created_at: string;
};

type Assistant = {
  id: number;
  name: string;
};

interface CredentialsState {
  credentials: Credential[];
  assistants: Assistant[];
  loading: boolean;
  error: string | null;
  isAddDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedCredential: Credential | null;
  submitting: boolean;
  formData: {
    assistant_id: string;
    type: string;
    name: string;
    value: string;
  };
  formError: string | null;
}

type CredentialsAction =
  | { type: "SET_CREDENTIALS"; payload: Credential[] }
  | { type: "SET_ASSISTANTS"; payload: Assistant[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_ADD_DIALOG_OPEN"; payload: boolean }
  | { type: "SET_EDIT_DIALOG_OPEN"; payload: boolean }
  | { type: "SET_DELETE_DIALOG_OPEN"; payload: boolean }
  | { type: "SET_SELECTED_CREDENTIAL"; payload: Credential | null }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_FORM_DATA"; payload: Partial<CredentialsState["formData"]> }
  | { type: "SET_FORM_ERROR"; payload: string | null }
  | { type: "RESET_FORM" };

const initialState: CredentialsState = {
  credentials: [],
  assistants: [],
  loading: true,
  error: null,
  isAddDialogOpen: false,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,
  selectedCredential: null,
  submitting: false,
  formData: {
    assistant_id: "",
    type: "",
    name: "",
    value: "",
  },
  formError: null,
};

function credentialsReducer(state: CredentialsState, action: CredentialsAction): CredentialsState {
  switch (action.type) {
    case "SET_CREDENTIALS":
      return { ...state, credentials: action.payload };
    case "SET_ASSISTANTS":
      return { ...state, assistants: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_ADD_DIALOG_OPEN":
      return { ...state, isAddDialogOpen: action.payload };
    case "SET_EDIT_DIALOG_OPEN":
      return { ...state, isEditDialogOpen: action.payload };
    case "SET_DELETE_DIALOG_OPEN":
      return { ...state, isDeleteDialogOpen: action.payload };
    case "SET_SELECTED_CREDENTIAL":
      return { ...state, selectedCredential: action.payload };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.payload };
    case "SET_FORM_DATA":
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case "SET_FORM_ERROR":
      return { ...state, formError: action.payload };
    case "RESET_FORM":
      return { ...state, formData: initialState.formData, formError: null };
    default:
      return state;
  }
}

export default function CredentialsPage() {
  const [state, dispatch] = useReducer(credentialsReducer, initialState);
  const { credentials, assistants, loading, error, isAddDialogOpen, isEditDialogOpen, isDeleteDialogOpen, selectedCredential, submitting, formData, formError } = state;

  useEffect(() => {
    fetchCredentials();
  }, []);

  async function fetchCredentials() {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await fetch("/api/credentials");
      if (!response.ok) {
        throw new Error("Failed to fetch credentials");
      }
      const data = await response.json();
      dispatch({ type: "SET_CREDENTIALS", payload: data.credentials });
      dispatch({ type: "SET_ASSISTANTS", payload: data.assistants });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  async function handleAddCredential(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "SET_FORM_ERROR", payload: null });
    dispatch({ type: "SET_SUBMITTING", payload: true });

    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistant_id: parseInt(formData.assistant_id),
          type: formData.type,
          name: formData.name,
          value: formData.value,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add credential");
      }

      dispatch({ type: "RESET_FORM" });
      dispatch({ type: "SET_ADD_DIALOG_OPEN", payload: false });
      fetchCredentials();
    } catch (err) {
      dispatch({ type: "SET_FORM_ERROR", payload: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }

  async function handleEditCredential(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCredential) return;
    
    dispatch({ type: "SET_FORM_ERROR", payload: null });
    dispatch({ type: "SET_SUBMITTING", payload: true });

    try {
      const response = await fetch("/api/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCredential.id,
          assistant_id: parseInt(formData.assistant_id),
          name: formData.name,
          value: formData.value || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update credential");
      }

      dispatch({ type: "RESET_FORM" });
      dispatch({ type: "SET_EDIT_DIALOG_OPEN", payload: false });
      dispatch({ type: "SET_SELECTED_CREDENTIAL", payload: null });
      fetchCredentials();
    } catch (err) {
      dispatch({ type: "SET_FORM_ERROR", payload: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }

  async function handleDeleteCredential() {
    if (!selectedCredential) return;
    dispatch({ type: "SET_SUBMITTING", payload: true });

    try {
      const response = await fetch("/api/credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCredential.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete credential");
      }

      dispatch({ type: "SET_DELETE_DIALOG_OPEN", payload: false });
      dispatch({ type: "SET_SELECTED_CREDENTIAL", payload: null });
      fetchCredentials();
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }

  function openDeleteDialog(credential: Credential) {
    dispatch({ type: "SET_SELECTED_CREDENTIAL", payload: credential });
    dispatch({ type: "SET_DELETE_DIALOG_OPEN", payload: true });
  }

  function openEditDialog(credential: Credential) {
    dispatch({ type: "SET_SELECTED_CREDENTIAL", payload: credential });
    dispatch({ type: "SET_FORM_DATA", payload: {
      assistant_id: String(credential.assistant_id),
      type: credential.type,
      name: credential.name,
      value: "",
    }});
    dispatch({ type: "SET_EDIT_DIALOG_OPEN", payload: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--night)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--tropical-indigo)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--night)] p-8">
      <div className="mx-auto max-w-6xl">
        <CredentialsHeader
          isAddDialogOpen={isAddDialogOpen}
          onAddDialogOpenChange={(v) => dispatch({ type: "SET_ADD_DIALOG_OPEN", payload: v })}
        >
          <AddCredentialDialog
            formData={formData}
            formError={formError}
            assistants={assistants}
            submitting={submitting}
            onAssistantChange={(v) => dispatch({ type: "SET_FORM_DATA", payload: { assistant_id: v } })}
            onTypeChange={(v) => dispatch({ type: "SET_FORM_DATA", payload: { type: v } })}
            onNameChange={(v) => dispatch({ type: "SET_FORM_DATA", payload: { name: v } })}
            onValueChange={(v) => dispatch({ type: "SET_FORM_DATA", payload: { value: v } })}
            onSubmit={handleAddCredential}
            onCancel={() => dispatch({ type: "SET_ADD_DIALOG_OPEN", payload: false })}
          />
        </CredentialsHeader>

        {error && (
          <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--error)]/10 p-4 text-[var(--error)]">
            {error}
          </div>
        )}

        {credentials.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--night-light)] p-8 text-center">
            <p className="text-[var(--lavender-muted)]">No credentials found.</p>
            <p className="text-sm text-[var(--dim-gray)]">
              Click &quot;Add Credential&quot; to add your first credential.
            </p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--night-light)]">
            <CredentialsTable credentials={credentials} onDelete={openDeleteDialog} onEdit={openEditDialog} />
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={(v) => {
          dispatch({ type: "SET_EDIT_DIALOG_OPEN", payload: v });
          if (!v) dispatch({ type: "RESET_FORM" });
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Credential</DialogTitle>
              <DialogDescription>
                Update the credential &quot;{selectedCredential?.name}&quot;
              </DialogDescription>
            </DialogHeader>
            <AddCredentialDialog
              formData={formData}
              formError={formError}
              assistants={assistants}
              submitting={submitting}
              onAssistantChange={(v) => dispatch({ type: "SET_FORM_DATA", payload: { assistant_id: v } })}
              onTypeChange={(v) => dispatch({ type: "SET_FORM_DATA", payload: { type: v } })}
              onNameChange={(v) => dispatch({ type: "SET_FORM_DATA", payload: { name: v } })}
              onValueChange={(v) => dispatch({ type: "SET_FORM_DATA", payload: { value: v } })}
              onSubmit={handleEditCredential}
              onCancel={() => dispatch({ type: "SET_EDIT_DIALOG_OPEN", payload: false })}
              isEdit={true}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={(v) => dispatch({ type: "SET_DELETE_DIALOG_OPEN", payload: v })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Credential</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{selectedCredential?.name}&quot;? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => dispatch({ type: "SET_DELETE_DIALOG_OPEN", payload: false })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteCredential}
                disabled={submitting}
                className="bg-[var(--error)] hover:bg-[var(--error)]/90"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
