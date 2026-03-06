"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { generateBusinessPrefix } from "@/lib/path-utils";

type Business = {
  id: string;
  name: string;
  prefix: string;
  industry: string;
  description: string;
  timezone: string;
  status: string;
  business_type?: string;
};

const PRIMARY_ASSISTANTS = [
  "chief-of-staff-1",
  "chief-of-staff-2",
  "director-of-operations",
  "venture-discovery",
  "senior-finance",
  "senior-hr",
  "senior-it",
  "senior-marketing",
  "senior-sales",
  "senior-automation-engineer",
  "senior-cybersecurity",
  "senior-legal",
  "senior-vendor-procurement",
  "senior-qa",
  "senior-web-developer",
  "senior-ui-ux-engineer",
  "senior-software-developer",
  "senior-copywriter",
  "senior-technical-writer",
  "senior-editor"
];

const SUBSIDIARY_ASSISTANTS = [
  "operations",
  "finance",
  "growth",
  "customer-service",
  "product",
  "sales",
  "compliance",
  "reporting",
  "logistics",
  "research",
  "business-intelligence",
  "copywriter",
  "technical-writer",
  "editor"
];

interface BusinessesState {
  businesses: Business[];
  loading: boolean;
  isSubmitting: boolean;
  isCreateOpen: boolean;
  isDeleteOpen: boolean;
  isEditOpen: boolean;
  selectedBusiness: Business | null;
  formData: {
    name: string;
    prefix: string;
    industry: string;
    description: string;
    timezone: string;
    status: string;
    business_type: string;
    selected_assistants: string[];
  };
  errors: Record<string, string>;
}

type BusinessesAction =
  | { type: "SET_BUSINESSES"; payload: Business[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_CREATE_OPEN"; payload: boolean }
  | { type: "SET_DELETE_OPEN"; payload: boolean }
  | { type: "SET_EDIT_OPEN"; payload: boolean }
  | { type: "SET_SELECTED_BUSINESS"; payload: Business | null }
  | { type: "SET_FORM_DATA"; payload: Partial<BusinessesState["formData"]> }
  | { type: "SET_ERRORS"; payload: Record<string, string> }
  | { type: "TOGGLE_ASSISTANT"; payload: string }
  | { type: "SELECT_ALL_ASSISTANTS" }
  | { type: "CLEAR_ASSISTANTS" }
  | { type: "RESET_FORM" };

const initialState: BusinessesState = {
  businesses: [],
  loading: true,
  isSubmitting: false,
  isCreateOpen: false,
  isDeleteOpen: false,
  isEditOpen: false,
  selectedBusiness: null,
  formData: {
    name: "",
    prefix: "",
    industry: "",
    description: "",
    timezone: "UTC",
    status: "active",
    business_type: "",
    selected_assistants: [],
  },
  errors: {},
};

function businessesReducer(state: BusinessesState, action: BusinessesAction): BusinessesState {
  switch (action.type) {
    case "SET_BUSINESSES":
      return { ...state, businesses: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload };
    case "SET_CREATE_OPEN":
      return { ...state, isCreateOpen: action.payload };
    case "SET_DELETE_OPEN":
      return { ...state, isDeleteOpen: action.payload };
    case "SET_EDIT_OPEN":
      return { ...state, isEditOpen: action.payload };
    case "SET_SELECTED_BUSINESS":
      return { ...state, selectedBusiness: action.payload };
    case "SET_FORM_DATA":
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "TOGGLE_ASSISTANT": {
      const assistants = state.formData.selected_assistants.includes(action.payload)
        ? state.formData.selected_assistants.filter(a => a !== action.payload)
        : [...state.formData.selected_assistants, action.payload];
      return { ...state, formData: { ...state.formData, selected_assistants: assistants } };
    }
    case "SELECT_ALL_ASSISTANTS": {
      const templates = state.formData.business_type === "primary" ? PRIMARY_ASSISTANTS : SUBSIDIARY_ASSISTANTS;
      return { ...state, formData: { ...state.formData, selected_assistants: [...templates] } };
    }
    case "CLEAR_ASSISTANTS":
      return { ...state, formData: { ...state.formData, selected_assistants: [] } };
    case "RESET_FORM":
      return { ...state, formData: initialState.formData, errors: {} };
    default:
      return state;
  }
}

export default function BusinessesPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(businessesReducer, initialState);
  const { businesses, loading, isSubmitting, isCreateOpen, isDeleteOpen, isEditOpen, selectedBusiness, formData, errors } = state;
  const { toast } = useToast();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("/api/businesses");
      const data = await res.json();
      dispatch({ type: "SET_BUSINESSES", payload: data });
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const generatePrefix = (name: string) => {
    return generateBusinessPrefix(name);
  };

  const sanitizeBusinessName = (name: string) => {
    return name.replace(/\s+/g, "-");
  };

  const handleNameChange = (value: string) => {
    const sanitizedName = sanitizeBusinessName(value);
    dispatch({
      type: "SET_FORM_DATA",
      payload: { name: sanitizedName, prefix: generatePrefix(sanitizedName) },
    });
  };

  const handleBusinessTypeChange = (value: string) => {
    dispatch({ type: "SET_FORM_DATA", payload: { business_type: value, selected_assistants: [] } });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.business_type) newErrors.business_type = "Business type is required";
    dispatch({ type: "SET_ERRORS", payload: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const checkDuplicateName = (name: string): boolean => {
    const sanitizedName = sanitizeBusinessName(name);
    return businesses.some(business => business.name === sanitizedName);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    
    // Check for duplicate business name
    if (checkDuplicateName(formData.name)) {
      dispatch({ 
        type: "SET_ERRORS", 
        payload: { ...errors, name: "A business with this name already exists" } 
      });
      return;
    }
    
    dispatch({ type: "SET_SUBMITTING", payload: true });
    
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, create_assistants: formData.selected_assistants }),
      });
      const data = await res.json();
      if (res.ok) {
        dispatch({ type: "SET_CREATE_OPEN", payload: false });
        dispatch({ type: "RESET_FORM" });
        fetchBusinesses();
        toast({
          title: "Success",
          description: `Business "${data.business.name}" created successfully with ${data.deployed?.length || 0} assistants`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create business",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Failed to create business:", error);
      toast({
        title: "Error",
        description: "Failed to create business",
        variant: "error",
      });
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  };

  const handleDelete = async () => {
    if (!selectedBusiness) return;
    try {
      const res = await fetch(`/api/businesses/${selectedBusiness.id}`, { method: "DELETE" });
      if (res.ok) {
        dispatch({ type: "SET_DELETE_OPEN", payload: false });
        dispatch({ type: "SET_SELECTED_BUSINESS", payload: null });
        fetchBusinesses();
      }
    } catch (error) {
      console.error("Failed to delete business:", error);
    }
  };

  const handleEditClick = (business: Business) => {
    dispatch({ type: "SET_SELECTED_BUSINESS", payload: business });
    dispatch({ type: "SET_FORM_DATA", payload: {
      name: business.name,
      prefix: business.prefix,
      industry: business.industry || "",
      description: business.description || "",
      timezone: business.timezone || "UTC",
      status: business.status || "active",
      business_type: business.business_type || "",
    }});
    dispatch({ type: "SET_EDIT_OPEN", payload: true });
  };

  const handleEdit = async () => {
    if (!selectedBusiness) return;
    if (!formData.name.trim()) {
      alert("Name is required");
      return;
    }
    try {
      const res = await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          prefix: formData.prefix,
          industry: formData.industry,
          description: formData.description,
          timezone: formData.timezone,
          status: formData.status,
        }),
      });
      if (res.ok) {
        dispatch({ type: "SET_EDIT_OPEN", payload: false });
        dispatch({ type: "SET_SELECTED_BUSINESS", payload: null });
        fetchBusinesses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update business");
      }
    } catch (error) {
      console.error("Failed to update business:", error);
      alert("Failed to update business");
    }
  };

  const assistantTemplates = formData.business_type === "primary" ? PRIMARY_ASSISTANTS :
                            formData.business_type === "subsidiary" ? SUBSIDIARY_ASSISTANTS : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-[var(--tropical-indigo)]" />
          <h1 className="text-3xl font-bold text-[var(--lavender)]">Businesses</h1>
        </div>
        <Button onClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: true })}>
          Add Business
        </Button>
      </div>

      <Card className="bg-night-light border border-border">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-[var(--lavender-muted)]">Loading...</div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-8 text-[var(--lavender-muted)]">No businesses found</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <Card key={business.id} className="bg-night-lighter border border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-[var(--lavender)]">{business.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditClick(business)}
                        >
                          <span className="text-[var(--tropical-indigo)]">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            dispatch({ type: "SET_SELECTED_BUSINESS", payload: business });
                            dispatch({ type: "SET_DELETE_OPEN", payload: true });
                          }}
                        >
                          <span className="text-red-500">Delete</span>
                        </Button>
                        <Badge variant={business.status === "active" ? "success" : "secondary"}>
                          {business.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--lavender-muted)]">Prefix:</span>
                        <span className="text-[var(--lavender)]">{business.prefix}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--lavender-muted)]">Industry:</span>
                        <span className="text-[var(--lavender)]">{business.industry || "N/A"}</span>
                      </div>
                      {business.business_type && (
                        <div className="flex justify-between">
                          <span className="text-[var(--lavender-muted)]">Type:</span>
                          <span className="text-[var(--lavender)] capitalize">{business.business_type}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={(open) => dispatch({ type: "SET_CREATE_OPEN", payload: open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Business</DialogTitle>
            <DialogDescription>Add a new business to your organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Business Name</label>
              <Input
                placeholder="Enter business name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Business Type</label>
              <select
                className="w-full px-3 py-2 rounded-md bg-night text-[var(--lavender)] border border-border"
                value={formData.business_type}
                onChange={(e) => handleBusinessTypeChange(e.target.value)}
              >
                <option value="">Select type...</option>
                <option value="primary">Primary Business</option>
                <option value="subsidiary">Subsidiary Business</option>
              </select>
              {errors.business_type && <p className="text-sm text-red-500">{errors.business_type}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Prefix</label>
              <Input
                placeholder="BUS"
                value={formData.prefix}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { prefix: e.target.value.toUpperCase() } })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Industry</label>
              <Input
                placeholder="Technology, Finance, etc."
                value={formData.industry}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { industry: e.target.value } })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Description</label>
              <Input
                placeholder="Brief description"
                value={formData.description}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { description: e.target.value } })}
              />
            </div>

            {assistantTemplates.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[var(--lavender-muted)]">
                    Select Assistants (prefix: {formData.prefix || "PREFIX"}-)
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch({ type: "SELECT_ALL_ASSISTANTS" })}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch({ type: "CLEAR_ASSISTANTS" })}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-border rounded-md">
                  {assistantTemplates.map((assistant) => (
                    <label
                      key={assistant}
                      className="flex items-center gap-2 p-2 rounded hover:bg-night-lighter cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selected_assistants.includes(assistant)}
                        onChange={() => dispatch({ type: "TOGGLE_ASSISTANT", payload: assistant })}
                        className="rounded"
                      />
                      <span className="text-sm text-[var(--lavender)]">
                        {formData.prefix || "PREFIX"}-{assistant}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: false })}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Business</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={(open) => dispatch({ type: "SET_EDIT_OPEN", payload: open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
            <DialogDescription>Update business details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Business Name</label>
              <Input
                placeholder="Enter business name"
                value={formData.name}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { name: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Prefix (3 letters)</label>
              <Input
                placeholder="ABC"
                value={formData.prefix}
                maxLength={3}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { prefix: e.target.value.toUpperCase().slice(0, 3) } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Industry</label>
              <Input
                placeholder="Technology, Finance, etc."
                value={formData.industry}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { industry: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Description</label>
              <Input
                placeholder="Brief description"
                value={formData.description}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { description: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Timezone</label>
              <select
                className="w-full px-3 py-2 rounded-md bg-night text-[var(--lavender)] border border-border"
                value={formData.timezone}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { timezone: e.target.value } })}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Chicago">America/Chicago</option>
                <option value="America/Denver">America/Denver</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Asia/Shanghai">Asia/Shanghai</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Status</label>
              <select
                className="w-full px-3 py-2 rounded-md bg-night text-[var(--lavender)] border border-border"
                value={formData.status}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { status: e.target.value } })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => dispatch({ type: "SET_EDIT_OPEN", payload: false })}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={(open) => dispatch({ type: "SET_DELETE_OPEN", payload: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Business</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedBusiness?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => dispatch({ type: "SET_DELETE_OPEN", payload: false })}>
              Cancel
            </Button>
            <Button variant="ghost" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
