"use client";

import { useEffect, useReducer, use } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { BusinessDetailHeader } from "./components/BusinessDetailHeader";
import { BusinessOverviewCards } from "./components/BusinessOverviewCards";
import { BusinessDetailsCard } from "./components/BusinessDetailsCard";
import { AssistantsList } from "./components/AssistantsList";
import { BusinessSettingsCard } from "./components/BusinessSettingsCard";
import { BusinessEditDialog } from "./components/BusinessEditDialog";

type Business = {
  id: string;
  name: string;
  prefix: string;
  industry: string;
  description: string;
  timezone: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type Assistant = {
  id: string;
  business_id: string;
  name: string;
  role: string;
  status: string;
};

interface BusinessDetailState {
  business: Business | null;
  assistants: Assistant[];
  loading: boolean;
  isEditOpen: boolean;
  editData: {
    name: string;
    prefix: string;
    industry: string;
    description: string;
    timezone: string;
    status: string;
  };
  errors: Record<string, string>;
  activeTab: string;
}

type BusinessDetailAction =
  | { type: "SET_BUSINESS"; payload: Business | null }
  | { type: "SET_ASSISTANTS"; payload: Assistant[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_EDIT_OPEN"; payload: boolean }
  | { type: "SET_EDIT_DATA"; payload: Partial<BusinessDetailState["editData"]> }
  | { type: "SET_ERRORS"; payload: Record<string, string> }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "RESET_EDIT_DATA" };

const initialState: BusinessDetailState = {
  business: null,
  assistants: [],
  loading: true,
  isEditOpen: false,
  editData: {
    name: "",
    prefix: "",
    industry: "",
    description: "",
    timezone: "",
    status: "",
  },
  errors: {},
  activeTab: "overview",
};

function businessDetailReducer(state: BusinessDetailState, action: BusinessDetailAction): BusinessDetailState {
  switch (action.type) {
    case "SET_BUSINESS":
      return { ...state, business: action.payload };
    case "SET_ASSISTANTS":
      return { ...state, assistants: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_EDIT_OPEN":
      return { ...state, isEditOpen: action.payload };
    case "SET_EDIT_DATA":
      return { ...state, editData: { ...state.editData, ...action.payload } };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "RESET_EDIT_DATA":
      return { ...state, editData: initialState.editData, errors: {} };
    default:
      return state;
  }
}

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [state, dispatch] = useReducer(businessDetailReducer, initialState);
  const { business, assistants, loading, isEditOpen, editData, errors, activeTab } = state;

  useEffect(() => {
    fetchBusiness();
    fetchAssistants();
  }, [resolvedParams.id]);

  const fetchBusiness = async () => {
    try {
      const res = await fetch(`/api/businesses/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_BUSINESS", payload: data });
        dispatch({
          type: "SET_EDIT_DATA",
          payload: {
            name: data.name,
            prefix: data.prefix,
            industry: data.industry || "",
            description: data.description || "",
            timezone: data.timezone,
            status: data.status,
          },
        });
      }
    } catch (error) {
      console.error("Failed to fetch business:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const fetchAssistants = async () => {
    try {
      const res = await fetch(`/api/businesses/${resolvedParams.id}/assistants`);
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_ASSISTANTS", payload: data });
      }
    } catch (error) {
      console.error("Failed to fetch assistants:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!editData.name.trim()) newErrors.name = "Name is required";
    if (!editData.prefix.trim()) newErrors.prefix = "Prefix is required";
    dispatch({ type: "SET_ERRORS", payload: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    try {
      const res = await fetch(`/api/businesses/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const updated = await res.json();
        dispatch({ type: "SET_BUSINESS", payload: updated });
        dispatch({ type: "SET_EDIT_OPEN", payload: false });
      }
    } catch (error) {
      console.error("Failed to update business:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "inactive":
        return <Badge variant="warning">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--lavender-muted)]">Loading...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-[var(--lavender-muted)]">Business not found</div>
        <Button variant="secondary" onClick={() => router.push("/businesses")}>
          Back to Businesses
        </Button>
      </div>
    );
  }

  const isLocalBusiness = business.created_at !== undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      <BusinessDetailHeader
        business={business}
        isLocalBusiness={isLocalBusiness}
        onEditClick={() => dispatch({ type: "SET_EDIT_OPEN", payload: true })}
      />

      <Tabs value={activeTab} onValueChange={(v) => dispatch({ type: "SET_ACTIVE_TAB", payload: v })} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assistants">Assistants</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <BusinessOverviewCards business={business} />
          <BusinessDetailsCard business={business} getStatusBadge={getStatusBadge} />
        </TabsContent>

        <TabsContent value="assistants" className="space-y-4">
          <AssistantsList assistants={assistants} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <BusinessSettingsCard business={business} isLocalBusiness={isLocalBusiness} />
        </TabsContent>
      </Tabs>

      <BusinessEditDialog
        open={isEditOpen}
        editData={editData}
        errors={errors}
        onOpenChange={(v) => dispatch({ type: "SET_EDIT_OPEN", payload: v })}
        onNameChange={(v) => dispatch({ type: "SET_EDIT_DATA", payload: { name: v } })}
        onPrefixChange={(v) => dispatch({ type: "SET_EDIT_DATA", payload: { prefix: v } })}
        onIndustryChange={(v) => dispatch({ type: "SET_EDIT_DATA", payload: { industry: v } })}
        onTimezoneChange={(v) => dispatch({ type: "SET_EDIT_DATA", payload: { timezone: v } })}
        onStatusChange={(v) => dispatch({ type: "SET_EDIT_DATA", payload: { status: v } })}
        onDescriptionChange={(v) => dispatch({ type: "SET_EDIT_DATA", payload: { description: v } })}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
