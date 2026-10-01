import "./styles/main.css";

export * from "./components/admin-layout";
export { default as SideBar } from "./components/sidebar";
export { default as NavItem } from "./components/ui/nav-item";
export { default as Input, InputPassword } from "./components/ui/input";
export type { InputProps, InputPasswordProps } from "./components/ui/input";
export {
  default as Textarea,
  Textarea as CoreTextarea,
} from "./components/ui/textarea";
export type { TextareaProps } from "./components/ui/textarea";
export { default as Button } from "./components/ui/button";
export { default as Checkbox } from "./components/ui/checkbox";
export type { CheckboxProps } from "./components/ui/checkbox";
export { default as Tooltip } from "./components/ui/tooltip";
export type { TooltipProps } from "./components/ui/tooltip";
export { Toaster, toast } from "./components/ui/toaster";
export * from "./components/ui/field";
export * from "./components/ui/command-search";
export * from "./hooks/active-url";
export * from "./hooks/theme";
export * from "./hooks/use-debounce";
export * from "./hooks/use-query-filters";
export * from "./hooks/use-table-query";
export * from "./types";
export * from "./auth";
export * from "./components/ui/chart";
export * from "./components/ui/data-table";
export { default as Drawer } from "./components/ui/drawer";
export type { DrawerProps } from "./components/ui/drawer";
export { default as NativeSelect } from "./components/ui/native-select";
export type {
  NativeSelectProps,
  NativeSelectOption,
} from "./components/ui/native-select";
export { default as Select } from "./components/ui/select";
export type {
  SelectProps,
  SelectOption,
  SelectGroup,
  RawSelectOption,
  SelectOptionProps,
} from "./components/ui/select";
export { default as Pagination } from "./components/ui/pagination";
export type { PaginationProps } from "./components/ui/pagination";
export {
  default as WorkspaceTabs,
  useWorkspaceTabsContext,
} from "./components/workspace-tabs";
export type {
  WorkspaceTabsProps,
  WorkspaceTabItem,
  WorkspaceTabsContextValue,
  ContextMenuState,
} from "./components/workspace-tabs";
export { useWorkspaceTabsStore } from "./store/workspace-tabs";
export type { WorkspaceTabsState } from "./store/workspace-tabs";
export {
  default as Avatar,
  SimpleAvatar1,
  SimpleAvatar2,
  AVATAR_1,
  AVATAR_2,
  DEFAULT_AVATAR,
} from "./components/ui/avatar";
export type { AvatarProps } from "./components/ui/avatar";
export { default as Keyboard } from "./components/ui/keyboard";
export {
  default as Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "./components/ui/modal";
export type {
  ModalProps,
  ModalHeaderProps,
  ModalBodyProps,
  ModalFooterProps,
} from "./components/ui/modal";
export { default as ConfirmModal } from "./components/ui/confirm-modal";
export type { ConfirmModalProps } from "./components/ui/confirm-modal";
export type {
  ModifierKey,
  SpecialKey,
  KbdKey,
  KeyboardProps,
} from "./components/ui/keyboard";
export {
  default as ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "./components/ui/context-menu";
export type {
  ContextMenuProps,
  ContextMenuItemProps,
  ContextMenuSeparatorProps,
  ContextMenuLabelProps,
  ContextMenuPosition,
} from "./components/ui/context-menu";
export * from "./components/ui/icons";
export {
  default as Tag,
  colorVariants,
  TAILWIND_COLORS,
} from "./components/ui/tag";
export type { TagProps, Color, Color as TagColor } from "./components/ui/tag";
export {
  default as NumberStepper,
  Stepper,
} from "./components/ui/number-stepper";
export type {
  NumberStepperProps,
  StepperProps,
} from "./components/ui/number-stepper";
export { default as NotFound } from "./components/ui/not-found";
export type { NotFoundProps } from "./components/ui/not-found";
export { default as ErrorState } from "./components/ui/error-state";
export type { ErrorStateProps } from "./components/ui/error-state";
export { default as Unauthorized } from "./components/ui/unauthorized";
export type { UnauthorizedProps } from "./components/ui/unauthorized";
export {
  default as Switch,
  Switch as CoreSwitch,
} from "./components/ui/switch";
export type { SwitchProps, SwitchSize } from "./components/ui/switch";
export {
  default as Skeleton,
  Skeleton as CoreSkeleton,
} from "./components/ui/skeleton";
export type { SkeletonProps } from "./components/ui/skeleton";
export {
  default as Card,
  CardRoot,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardBody,
  CardFooter,
  cardVariants,
} from "./components/ui/card";
export type {
  CardProps,
  CardVariant,
  CardPadding,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardActionProps,
  CardContentProps,
  CardFooterProps,
} from "./components/ui/card";
export {
  default as Upload,
  FileUpload,
  UploadLinkInput,
  UploadArea,
  UploadFileList,
  UploadItem,
  useUploadContext,
  FILE_PRESETS,
  normalizeAccept,
} from "./components/ui/upload";
export type {
  UploadProps,
  UploadLinkInputProps,
  UploadAreaProps,
  UploadFileListProps,
  UploadItemProps,
  UploadContextValue,
  UploadFileItem,
  UploadAccept,
  UploadAcceptItem,
  FilePresetKey,
} from "./components/ui/upload";
export {
  default as Collapsible,
  Collapsible as CoreCollapsible,
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
  useCollapsibleContext,
} from "./components/ui/collapsible";
export type {
  CollapsibleProps,
  CollapsibleTriggerProps,
  CollapsibleContentProps,
  CollapsibleContextValue,
} from "./components/ui/collapsible";
export {
  default as RouteProgressBar,
  RouteProgressBar as CoreRouteProgressBar,
} from "./components/ui/route-progress-bar";
export type { RouteProgressBarProps } from "./components/ui/route-progress-bar";
export {
  default as PageLoadingSkeleton,
  PageLoadingSkeleton as CorePageLoadingSkeleton,
} from "./components/ui/page-loading-skeleton";
export type { PageLoadingSkeletonProps } from "./components/ui/page-loading-skeleton";
export * from "./utils";
