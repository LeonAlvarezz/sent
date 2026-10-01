import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Button,
  CloseIcon,
  ConfirmModal,
  DataTable,
  Input,
  NativeSelect,
  PlusIcon,
  SearchIcon,
  Select,
  toast,
  UploadCloudIcon,
  useDebounce,
} from "@z3/admin-core";
import type { PaginationState } from "@z3/admin-core";
import type {
  Email,
  EmailList,
  CreateEmail,
  ImportEmailsPayload,
} from "@z3/types";
import {
  useEmailListsQuery,
  useEmailsQuery,
  useJobTitlesQuery,
  useCreateEmailListMutation,
  useCreateEmailMutation,
  useDeleteEmailMutation,
  useImportEmailsMutation,
  useUpdateEmailMutation,
} from "./outreach.api";
import { createEmailColumn } from "./components/email.column";
import { ContactModal as EmailModal } from "./components/email-modal";
import { CreateListModal } from "./components/create-list-modal";
import { ImportEmailModal } from "./components/import-email-modal";

export function EmailPage() {
  const navigate = useNavigate();
  const [selectedListId, setSelectedListId] = useState<number | undefined>(
    undefined,
  );
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm.trim(), 300);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<number>>(
    new Set(),
  );

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const [isNewListOpen, setIsNewListOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<Email | null>(null);

  // Queries
  const { data: emailLists = [] } = useEmailListsQuery();
  const { data: jobTitles = [] } = useJobTitlesQuery();

  const jobTitleOptions = React.useMemo(
    () => [
      { value: "all", label: "All Job Titles" },
      ...jobTitles.map((jt) => ({
        value: jt.title,
        label: `${jt.title} (${jt.count})`,
      })),
    ],
    [jobTitles],
  );

  const { data: emailData, isLoading } = useEmailsQuery({
    listId: selectedListId,
    title: selectedJobTitle !== "all" ? selectedJobTitle : undefined,
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
  });

  const emails = emailData?.emails ?? [];
  const totalEmailsCount = emailData?.meta.total_count ?? 0;
  const pageCount = emailData?.meta.page_count;
  // Mutations
  const createEmailMutation = useCreateEmailMutation();
  const updateEmailMutation = useUpdateEmailMutation();
  const deleteEmailMutation = useDeleteEmailMutation();
  const createListMutation = useCreateEmailListMutation();
  const importMutation = useImportEmailsMutation();

  // Email CRUD Handlers
  const handleSaveEmail = async (data: any) => {
    try {
      if (selectedEmail) {
        await updateEmailMutation.mutateAsync({
          id: selectedEmail.id,
          data,
        });
        toast.success(`Updated "${data.email}" successfully`);
      } else {
        await createEmailMutation.mutateAsync(data as CreateEmail);
        toast.success(`Added "${data.email}" to emails`);
      }
      setIsEmailModalOpen(false);
      setSelectedEmail(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save email");
      throw err;
    }
  };

  const handleDeleteEmail = async () => {
    if (!emailToDelete) return;
    try {
      await deleteEmailMutation.mutateAsync(emailToDelete.id);
      toast.warning(`Deleted email "${emailToDelete.email}"`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete email");
    } finally {
      setEmailToDelete(null);
      setIsDeleteOpen(false);
    }
  };

  // Create List Handler
  const handleCreateList = async (data: {
    name: string;
    description?: string;
  }) => {
    try {
      const newList = await createListMutation.mutateAsync(data);
      toast.success(`Audience list "${newList.name}" created`);
      setSelectedListId(newList.id);
      setIsNewListOpen(false);
      return newList;
    } catch (err: any) {
      toast.error(err.message || "Failed to create audience list");
      throw err;
    }
  };

  // CSV Import Handler
  const handleImportEmails = async (data: ImportEmailsPayload) => {
    try {
      const imported = await importMutation.mutateAsync(data);
      toast.success(`Imported ${imported.length} emails successfully!`);
      if (data.listId) {
        setSelectedListId(data.listId);
      }
      setIsImportOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to import emails");
      throw err;
    }
  };

  // Quick outreach action
  const handleQuickOutreach = (item?: Email) => {
    if (!item) return;
    toast.info(`Opening Quick Outreach for ${item.email}`);
    navigate({ to: "/outreach" });
  };

  const isAllSelected =
    emails.length > 0 && emails.every((e) => selectedEmailIds.has(e.id));

  const toggleSelectAll = () => {
    setSelectedEmailIds((prev) => {
      if (isAllSelected) return new Set();
      return new Set(emails.map((e) => e.id));
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedEmailIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns = createEmailColumn({
    emailLists,
    isAllSelected,
    onToggleSelectAll: toggleSelectAll,
    selectedIds: selectedEmailIds,
    onToggleSelect: toggleSelect,
    onEdit: (c) => {
      if (!c) return;
      setSelectedEmail(c);
      setIsEmailModalOpen(true);
    },
    onDelete: (c) => {
      if (!c) return;
      setEmailToDelete(c);
      setIsDeleteOpen(true);
    },
    onQuickOutreach: handleQuickOutreach,
  });

  const isFiltered = Boolean(
    searchTerm || selectedListId !== undefined || selectedJobTitle !== "all",
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="gap-1 flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Emails & Audiences
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage recipient directories, organize audience lists, and import
            CSV lead sheets.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedEmailIds.size > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                const ids = Array.from(selectedEmailIds).join(",");
                navigate({ to: "/bulk-send", search: { selected: ids } });
              }}
              className="h-8 px-3 text-xs flex items-center gap-1.5"
            >
              <span>🚀 Bulk Send to Selected ({selectedEmailIds.size})</span>
            </Button>
          )}
          {selectedEmailIds.size === 0 &&
            selectedJobTitle !== "all" &&
            totalEmailsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate({
                    to: "/bulk-send",
                    search: { jobTitle: selectedJobTitle },
                  });
                }}
                className="h-8 px-3 text-xs flex items-center gap-1.5"
              >
                <span>
                  🎯 Bulk Send to "{selectedJobTitle}" ({totalEmailsCount})
                </span>
              </Button>
            )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsNewListOpen(true)}
            className="h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <PlusIcon />
            <span>New List</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <UploadCloudIcon />
            <span>Import Emails</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setSelectedEmail(null);
              setIsEmailModalOpen(true);
            }}
            className="h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <PlusIcon />
            <span>Add Email</span>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={emails}
        loading={isLoading}
        rowCount={totalEmailsCount}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageSizeOptions={[10, 20, 30, 50]}
        toolbar={(table) => (
          <DataTable.Toolbar>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Input
                placeholder="Search emails by address, name, or company..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination((prev) =>
                    prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
                  );
                }}
                startIcon={<SearchIcon />}
                containerClassName="h-8"
                className="w-56 sm:w-72"
              />
              <Select
                value={selectedJobTitle}
                onChange={(val) => {
                  setSelectedJobTitle(val || "all");
                  setSelectedEmailIds(new Set());
                  setPagination((prev) =>
                    prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
                  );
                }}
                options={jobTitleOptions}
                searchable
                virtual
                clearable={selectedJobTitle !== "all"}
                sizeVariant="sm"
                placeholder="Filter by Job Title..."
                containerClassName="w-48 sm:w-56 shrink-0"
                dropdownClassName="min-w-64"
              />
              <NativeSelect
                value={selectedListId ? String(selectedListId) : "all"}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedListId(val === "all" ? undefined : Number(val));
                  setPagination((prev) =>
                    prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
                  );
                }}
                className="h-8 text-xs w-44"
              >
                <option value="all">
                  All Lists (
                  {totalEmailsCount > 0 ? totalEmailsCount : emails.length})
                </option>
                {emailLists.map((l: EmailList) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.emailCount})
                  </option>
                ))}
              </NativeSelect>
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedListId(undefined);
                    setSelectedJobTitle("all");
                    setSelectedEmailIds(new Set());
                    setPagination((prev) =>
                      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
                    );
                  }}
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

      {/* Email Add / Edit Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        setIsOpen={setIsEmailModalOpen}
        contact={selectedEmail}
        emailLists={emailLists}
        defaultListId={selectedListId}
        onSave={handleSaveEmail}
      />

      {/* New Audience List Modal */}
      <CreateListModal
        isOpen={isNewListOpen}
        setIsOpen={setIsNewListOpen}
        onSave={async (data) => {
          await handleCreateList(data);
        }}
      />

      {/* CSV / Excel Import Modal */}
      <ImportEmailModal
        isOpen={isImportOpen}
        setIsOpen={setIsImportOpen}
        emailLists={emailLists}
        defaultListId={selectedListId}
        onImport={handleImportEmails}
        onCreateList={handleCreateList}
      />

      {/* Confirm Delete Email Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        title={`Delete "${emailToDelete?.email}"?`}
        description="Are you sure you want to delete this email? This action cannot be undone."
        confirmText="Delete Email"
        variant="destructive"
        onConfirm={handleDeleteEmail}
      />
    </div>
  );
}

export default EmailPage;
