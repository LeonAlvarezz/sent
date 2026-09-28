import React, { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Button,
  CloseIcon,
  ConfirmModal,
  DataTable,
  Input,
  MailIcon,
  NativeSelect,
  PageLoadingSkeleton,
  PlusIcon,
  SearchIcon,
  toast,
  Unauthorized,
  UploadCloudIcon,
  useAuth,
} from "@z3/admin-core";
import { SEO_PARTNER_STATUS, USER_ROLE } from "@z3/types";
import type { CreateSeoPartner, SeoPartner, UpdateSeoPartner } from "@z3/types";
import {
  useCreateSeoPartnerMutation,
  useDeleteSeoPartnerMutation,
  useImportSeoPartnersMutation,
  useSeoPartnersQuery,
  useSeoPartnerTargetsQuery,
  useUpdateSeoPartnerMutation,
} from "./seo-partner.api";
import { createSeoPartnerColumns } from "./components/seo-partner.column";
import { SeoPartnerModal } from "./components/seo-partner-modal";
import { ImportSeoPartnerModal } from "./components/import-seo-partner-modal";
import { SeoPartnerOutreachDrawer } from "./components/seo-partner-outreach-drawer";

export function SeoPartnerPage() {
  const navigate = useNavigate();
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const isAuthorized =
    currentUser?.role === USER_ROLE.SUPER_ADMIN ||
    currentUser?.role === USER_ROLE.ADMIN;

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    SEO_PARTNER_STATUS | "all"
  >("all");
  const [selectedTarget, setSelectedTarget] = useState<string>("all");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<SeoPartner | null>(
    null,
  );
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<SeoPartner | null>(
    null,
  );
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  const [outreachPartner, setOutreachPartner] = useState<SeoPartner | null>(
    null,
  );

  // Queries
  const { data: targets = [] } = useSeoPartnerTargetsQuery({
    enabled: isAuthorized,
  });
  const { data: partners = [], isLoading } = useSeoPartnersQuery(
    {
      search: searchTerm.trim() || undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      backlinkFor: selectedTarget !== "all" ? selectedTarget : undefined,
    },
    { enabled: isAuthorized },
  );

  // Mutations
  const createMutation = useCreateSeoPartnerMutation();
  const updateMutation = useUpdateSeoPartnerMutation();
  const deleteMutation = useDeleteSeoPartnerMutation();
  const importMutation = useImportSeoPartnersMutation();

  const handleSavePartner = async (
    data: CreateSeoPartner | UpdateSeoPartner,
  ) => {
    if (selectedPartner) {
      await updateMutation.mutateAsync({
        id: selectedPartner.id,
        data,
      });
      toast.success(`Updated "${data.website}" successfully`);
    } else {
      await createMutation.mutateAsync(data as CreateSeoPartner);
      toast.success(`Added "${data.website}" to SEO partners`);
    }
    setIsModalOpen(false);
    setSelectedPartner(null);
  };

  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;
    try {
      await deleteMutation.mutateAsync(partnerToDelete.id);
      toast.warning(`Deleted "${partnerToDelete.website}"`);
      setIsDeleteOpen(false);
      setPartnerToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete partner");
    }
  };

  const handleImportPartners = async (newPartners: CreateSeoPartner[]) => {
    await importMutation.mutateAsync({ partners: newPartners });
  };

  const handleQuickOutreach = (partner: SeoPartner) => {
    setOutreachPartner(partner);
    setIsOutreachOpen(true);
  };

  const handleStartColdOutreach = () => {
    const firstUncontacted = partners.find(
      (p) => p.outreachStatus === SEO_PARTNER_STATUS.NOT_STARTED,
    );
    if (!firstUncontacted) {
      toast.info("No partners found to outreach");
      return;
    }
    setOutreachPartner(firstUncontacted);
    setIsOutreachOpen(true);
  };

  const isFiltered =
    Boolean(searchTerm.trim()) ||
    selectedStatus !== "all" ||
    selectedTarget !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedTarget("all");
  };

  const columns = useMemo(
    () =>
      createSeoPartnerColumns({
        onDelete: (partner) => {
          setPartnerToDelete(partner);
          setIsDeleteOpen(true);
        },
        onEdit: (partner) => {
          setSelectedPartner(partner);
          setIsModalOpen(true);
        },
        onQuickOutreach: handleQuickOutreach,
      }),
    [],
  );

  if (isAuthLoading || !currentUser) {
    return <PageLoadingSkeleton />;
  }

  if (!isAuthorized) {
    return (
      <Unauthorized description="You do not have administrator permissions to view or manage SEO partners. Contact a system administrator for access." />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            SEO Partners
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Directory of publisher websites, domain rating metrics, pricing, and
            outreach pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleStartColdOutreach}
            className="gap-1.5"
          >
            <MailIcon className="size-4" />
            <span>Cold Outreach</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="gap-1.5"
          >
            <UploadCloudIcon className="size-4" />
            <span>Import Sheet</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPartner(null);
              setIsModalOpen(true);
            }}
            className="gap-1.5"
          >
            <PlusIcon className="size-4" />
            <span>Add Partner</span>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={partners}
        loading={isLoading}
        toolbar={(table) => (
          <DataTable.Toolbar>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Input
                placeholder="Search website, URL, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startIcon={
                  <SearchIcon className="size-4 text-muted-foreground" />
                }
                containerClassName="h-8"
                className="w-64 sm:w-80"
              />

              <NativeSelect
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value as SEO_PARTNER_STATUS | "all",
                  )
                }
                className="h-8 text-xs w-36"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="outreached">Outreached</option>
                <option value="overbudget">Overbudget</option>
                <option value="in_progress">In Progress</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </NativeSelect>

              {targets.length > 0 && (
                <NativeSelect
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="h-8 text-xs w-36"
                >
                  <option value="all">All Clients</option>
                  {targets.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </NativeSelect>
              )}

              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <CloseIcon className="size-3.5" />
                  <span>Reset</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <DataTable.ViewOptions table={table} />
            </div>
          </DataTable.Toolbar>
        )}
      />

      {/* Add / Edit Partner Modal */}
      <SeoPartnerModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        partner={selectedPartner}
        onSave={handleSavePartner}
        existingTargets={targets}
      />

      {/* Import Spreadsheet Modal */}
      <ImportSeoPartnerModal
        isOpen={isImportOpen}
        setIsOpen={setIsImportOpen}
        onImport={handleImportPartners}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setPartnerToDelete(null);
        }}
        onConfirm={handleDeletePartner}
        title="Delete SEO Partner"
        description={`Are you sure you want to delete "${partnerToDelete?.website}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />

      {/* In-Table Cold Outreach Drawer */}
      <SeoPartnerOutreachDrawer
        open={isOutreachOpen}
        onClose={() => {
          setIsOutreachOpen(false);
          setOutreachPartner(null);
        }}
        partner={outreachPartner}
        partners={partners}
        onSelectPartner={(partner) => setOutreachPartner(partner)}
      />
    </div>
  );
}
