import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { cn } from "../../utils/cn";
import Button from "./button";
import { ChevronDownIcon, CheckIcon, CloseIcon, SpinnerIcon } from "./icons";

export interface SelectOption<T = any> {
  /** Unique value of the option */
  value: T;
  /** Primary label displayed for the option */
  label: ReactNode;
  /** Optional secondary subtitle or description */
  description?: ReactNode;
  /** Optional leading icon for the option */
  icon?: ReactNode;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Optional keywords used for search filtering */
  keywords?: string[];
  /** Any custom metadata */
  [key: string]: any;
}

export interface SelectGroup<T = any> {
  /** Group title */
  group: string;
  /** Options in this group */
  options: SelectOption<T>[];
}

export type RawSelectOption<T = any> =
  SelectOption<T> | SelectGroup<T> | string | number;

export interface SelectProps<T = any> {
  /** Current selected value (single or array if multiple) */
  value?: any;
  /** Initial selected value for uncontrolled state */
  defaultValue?: any;
  /** Change callback with new value and matched option(s) */
  onChange?: (value: any, option?: any) => void;
  /** Array of options, grouped options, or primitive strings/numbers */
  options?: RawSelectOption<T>[];
  /** Async function to load or search options dynamically */
  loadOptions?: (
    query: string,
  ) => Promise<Array<SelectOption<T> | SelectGroup<T>>>;
  /** Loading state indicator */
  loading?: boolean;
  /** Alias for loading */
  isLoading?: boolean;
  /** Debounce delay in ms for async loadOptions (default: 250) */
  debounceMs?: number;
  /** Loading text placeholder in dropdown */
  loadingText?: ReactNode;
  /** Text shown when no options match the query */
  emptyText?: ReactNode;
  /** Custom filter function for client-side search */
  filterOption?: (option: SelectOption<T>, query: string) => boolean;
  /** Enables combobox mode: direct typing into the trigger filters options */
  searchable?: boolean;
  /** Enables virtual windowing on dropdown options (loads in batches of 50 on scroll). Defaults to true if options > 50. */
  virtual?: boolean;
  /** Search query change callback */
  onSearchChange?: (query: string) => void;
  /** Enables multiple item selection */
  multiple?: boolean;
  /** Shows a clear button (x) when a value is selected */
  clearable?: boolean;
  /** Leading icon inside the select trigger */
  startIcon?: ReactNode;
  /** Trailing icon (defaults to ChevronDown) */
  endIcon?: ReactNode;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Invalid / error state styling */
  invalid?: boolean;
  /** Size variant */
  sizeVariant?: "sm" | "md" | "lg";
  /** Form name attribute */
  name?: string;
  /** ID attribute for the input/trigger */
  id?: string;
  /** Container class name */
  containerClassName?: string;
  /** Trigger input class name */
  className?: string;
  /** Dropdown menu class name */
  dropdownClassName?: string;
  /** Custom render function for option items */
  renderOption?: (
    option: SelectOption<T>,
    state: { selected: boolean; active: boolean; disabled: boolean },
  ) => ReactNode;
  /** Custom render function for selected value in trigger */
  renderValue?: (
    value: any,
    selectedOption: SelectOption<T> | SelectOption<T>[] | null,
  ) => ReactNode;
  /** Custom children for compound options rendering */
  children?: ReactNode;
  /** Anchor positioning for the dropdown menu (e.g. "bottom start", { to: "bottom start", gap: 4 }). When provided, portals the menu and uses Floating UI. */
  anchor?: ComponentPropsWithoutRef<typeof ComboboxOptions>["anchor"];
}

function isGroup<T>(item: RawSelectOption<T>): item is SelectGroup<T> {
  return typeof item === "object" && "group" in item;
}

function normalizeOption<T>(
  item: RawSelectOption<T>,
): SelectOption<T> | SelectGroup<T> {
  if (typeof item === "string" || typeof item === "number") {
    return {
      value: item as unknown as T,
      label: String(item),
    };
  }
  return item;
}

const sizeClasses = {
  sm: "min-h-8 text-xs py-1 px-2.5 gap-1.5",
  md: "min-h-9 text-sm py-1.5 px-3 gap-2",
  lg: "min-h-10 text-base py-2 px-3.5 gap-2.5",
};

const iconSizes = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-4.5",
};

export function Select<T = any>({
  value: controlledValue,
  defaultValue,
  onChange,
  options: rawOptions = [],
  loadOptions,
  loading = false,
  isLoading = false,
  debounceMs = 250,
  loadingText = "Loading options...",
  emptyText = "No options found.",
  filterOption,
  searchable = false,
  virtual,
  onSearchChange,
  multiple = false,
  clearable = false,
  startIcon,
  endIcon,
  placeholder = "Select an option...",
  disabled = false,
  invalid = false,
  sizeVariant = "md",
  name,
  id: customId,
  containerClassName,
  className,
  dropdownClassName,
  renderOption,
  renderValue,
  anchor,
  children,
}: SelectProps<T>) {
  const autoId = useId();
  const selectId = customId || autoId;

  // Uncontrolled vs Controlled internal value state
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<any>(
    defaultValue !== undefined ? defaultValue : multiple ? [] : null,
  );
  const currentValue = isControlled ? controlledValue : internalValue;

  // Search query & Async state
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);
  const [asyncOptions, setAsyncOptions] = useState<Array<
    SelectOption<T> | SelectGroup<T>
  > | null>(null);
  const [isAsyncLoading, setIsAsyncLoading] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActuallyLoading = loading || isLoading || isAsyncLoading;

  // Normalize static options
  // Normalize static options
  const normalizedOptions = useMemo(() => {
    return rawOptions.map((opt) => normalizeOption<T>(opt));
  }, [rawOptions]);

  // Combined options (async or static)
  const effectiveOptions =
    loadOptions && asyncOptions !== null ? asyncOptions : normalizedOptions;

  // Flattened list and O(1) lookup map
  const { flatOptions, optionsMap } = useMemo(() => {
    const list: SelectOption<T>[] = [];
    const map = new Map<any, SelectOption<T>>();
    effectiveOptions.forEach((item) => {
      if (isGroup(item)) {
        item.options.forEach((opt) => {
          list.push(opt);
          map.set(opt.value, opt);
        });
      } else {
        list.push(item);
        map.set(item.value, item);
      }
    });
    return { flatOptions: list, optionsMap: map };
  }, [effectiveOptions]);

  // Find option helper (O(1) lookup via optionsMap)
  const findOption = useCallback(
    (val: any): SelectOption<T> | null => {
      if (val === null || val === undefined) return null;
      if (typeof val === "object" && "value" in val) {
        return val as SelectOption<T>;
      }
      return optionsMap.get(val) ?? null;
    },
    [optionsMap],
  );

  // Selected Option(s) resolution
  const selectedOptions = useMemo(() => {
    if (multiple) {
      if (!Array.isArray(currentValue)) return [];
      return currentValue
        .map((v) => findOption(v))
        .filter((opt): opt is SelectOption<T> => opt !== null);
    }
    return findOption(currentValue);
  }, [multiple, currentValue, findOption]);

  // Single option label for placeholder when focused in searchable mode
  const currentOptionLabel = useMemo(() => {
    if (multiple) return "";
    if (selectedOptions && !Array.isArray(selectedOptions)) {
      if (typeof selectedOptions.label === "string") return selectedOptions.label;
      if (
        selectedOptions.value !== null &&
        selectedOptions.value !== undefined
      ) {
        return String(selectedOptions.value);
      }
    }
    return "";
  }, [multiple, selectedOptions]);

  // Trigger async fetch with debounce
  const fetchAsyncOptions = useCallback(
    (searchQuery: string) => {
      if (!loadOptions) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setIsAsyncLoading(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await loadOptions(searchQuery);
          setAsyncOptions(res.map((r) => normalizeOption<T>(r)));
        } catch (err) {
          console.error("Failed to load select options:", err);
          setAsyncOptions([]);
        } finally {
          setIsAsyncLoading(false);
        }
      }, debounceMs);
    },
    [loadOptions, debounceMs],
  );

  // Initial load for async options
  useEffect(() => {
    if (loadOptions) {
      fetchAsyncOptions("");
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [loadOptions, fetchAsyncOptions]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setVisibleCount(50);
    if (optionsRef.current) {
      optionsRef.current.scrollTop = 0;
    }
    if (onSearchChange) {
      onSearchChange(newQuery);
    }
    if (loadOptions) {
      fetchAsyncOptions(newQuery);
    }
  };

  // Virtual windowing state for large lists
  const isVirtualized =
    virtual !== undefined ? virtual : flatOptions.length > 50;
  const [visibleCount, setVisibleCount] = useState(50);

  // Single-pass filter, count, and windowing
  const {
    filteredOptions,
    totalFilteredCount,
    displayedOptions,
    displayedCount,
  } = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    // 1. Filter options
    let filtered: Array<SelectOption<T> | SelectGroup<T>>;
    if (!trimmed || loadOptions) {
      filtered = effectiveOptions;
    } else {
      const matchOpt = (opt: SelectOption<T>) => {
        if (filterOption) return filterOption(opt, trimmed);
        const labelStr =
          typeof opt.label === "string" ? opt.label : String(opt.value);
        const descStr =
          typeof opt.description === "string" ? opt.description : "";
        return (
          labelStr.toLowerCase().includes(trimmed) ||
          descStr.toLowerCase().includes(trimmed) ||
          Boolean(
            opt.keywords?.some((k) => k.toLowerCase().includes(trimmed)),
          ) ||
          String(opt.value).toLowerCase().includes(trimmed)
        );
      };

      filtered = [];
      for (const item of effectiveOptions) {
        if (isGroup(item)) {
          const matchingChilds = item.options.filter(matchOpt);
          if (matchingChilds.length > 0) {
            filtered.push({ group: item.group, options: matchingChilds });
          }
        } else if (matchOpt(item)) {
          filtered.push(item);
        }
      }
    }

    // 2. Count total items
    let totalCount = 0;
    for (const item of filtered) {
      totalCount += isGroup(item) ? item.options.length : 1;
    }

    // 3. Slice window if virtualized
    if (!isVirtualized || totalCount <= visibleCount) {
      return {
        filteredOptions: filtered,
        totalFilteredCount: totalCount,
        displayedOptions: filtered,
        displayedCount: totalCount,
      };
    }

    let remaining = visibleCount;
    const displayed: Array<SelectOption<T> | SelectGroup<T>> = [];
    const includedValues = new Set<any>();

    for (const item of filtered) {
      if (remaining <= 0) break;
      if (isGroup(item)) {
        const sliceCount = Math.min(remaining, item.options.length);
        if (sliceCount > 0) {
          const slicedOpts = item.options.slice(0, sliceCount);
          slicedOpts.forEach((o) => includedValues.add(o.value));
          displayed.push({ group: item.group, options: slicedOpts });
          remaining -= sliceCount;
        }
      } else {
        displayed.push(item);
        includedValues.add(item.value);
        remaining -= 1;
      }
    }

    // Guarantee selected value(s) are present in displayed list only when browsing without a search query
    if (!trimmed) {
      const targetValues = multiple
        ? Array.isArray(currentValue)
          ? currentValue
          : []
        : currentValue !== null && currentValue !== undefined
          ? [currentValue]
          : [];

      for (const val of targetValues) {
        if (!includedValues.has(val)) {
          const opt = optionsMap.get(val);
          if (opt) {
            displayed.push(opt);
            includedValues.add(val);
          }
        }
      }
    }

    let currentDisplayedCount = 0;
    for (const item of displayed) {
      currentDisplayedCount += isGroup(item) ? item.options.length : 1;
    }

    return {
      filteredOptions: filtered,
      totalFilteredCount: totalCount,
      displayedOptions: displayed,
      displayedCount: currentDisplayedCount,
    };
  }, [
    effectiveOptions,
    query,
    loadOptions,
    filterOption,
    isVirtualized,
    visibleCount,
    multiple,
    currentValue,
    optionsMap,
  ]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isVirtualized) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      setVisibleCount((prev) => {
        if (prev >= totalFilteredCount) return prev;
        return Math.min(prev + 50, totalFilteredCount);
      });
    }
  };

  const handleChange = (selectedVal: any) => {
    let resolvedVal = selectedVal;
    let resolvedOption: any = null;

    if (multiple) {
      const arr = Array.isArray(selectedVal) ? selectedVal : [selectedVal];
      resolvedVal = arr.map((item) =>
        typeof item === "object" && item !== null && "value" in item
          ? item.value
          : item,
      );
      resolvedOption = resolvedVal.map((v: any) => findOption(v));
    } else {
      resolvedVal =
        typeof selectedVal === "object" &&
        selectedVal !== null &&
        "value" in selectedVal
          ? selectedVal.value
          : selectedVal;
      resolvedOption = findOption(resolvedVal);
    }

    if (!isControlled) {
      setInternalValue(resolvedVal);
    }
    onChange?.(resolvedVal, resolvedOption);
    setQuery("");
    setIsFocused(false);
    if (optionsRef.current) {
      optionsRef.current.scrollTop = 0;
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (query !== "") {
      handleQueryChange("");
      return;
    }
    const emptyVal = multiple ? [] : null;
    if (!isControlled) {
      setInternalValue(emptyVal);
    }
    onChange?.(emptyVal, multiple ? [] : null);
    setQuery("");
    setIsFocused(false);
    if (optionsRef.current) {
      optionsRef.current.scrollTop = 0;
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, tagValue: any) => {
    e.stopPropagation();
    if (!multiple) return;
    const currentArr = Array.isArray(currentValue) ? currentValue : [];
    const nextArr = currentArr.filter((v) => v !== tagValue);
    if (!isControlled) {
      setInternalValue(nextArr);
    }
    const nextOptions = nextArr.map((v) => findOption(v));
    onChange?.(nextArr, nextOptions);
  };

  const hasValue = multiple
    ? Array.isArray(currentValue) && currentValue.length > 0
    : currentValue !== null &&
      currentValue !== undefined &&
      currentValue !== "";

  // Active leading icon: startIcon prop or selected single option icon
  const activeStartIcon =
    startIcon ||
    (!multiple && (selectedOptions as SelectOption<T> | null)?.icon);

  return (
    <Combobox
      value={currentValue}
      onChange={handleChange}
      multiple={multiple}
      disabled={disabled}
      immediate={searchable}
      onClose={() => {
        setQuery("");
        setVisibleCount(50);
        setIsFocused(false);
        if (optionsRef.current) {
          optionsRef.current.scrollTop = 0;
        }
      }}
    >
      <div className={cn("relative w-full", containerClassName)}>
        {searchable ? (
          <div
            className={cn(
              "relative flex w-full items-center rounded-md border border-border text-foreground transition-all input-focus",
              invalid &&
                "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
              disabled && "opacity-50 cursor-not-allowed bg-muted/20",
              sizeClasses[sizeVariant],
              className,
            )}
          >
            {/* Start Icon Slot */}
            {activeStartIcon && (
              <span
                className={cn(
                  "flex items-center text-foreground/60 shrink-0 select-none",
                  iconSizes[sizeVariant],
                )}
              >
                {activeStartIcon}
              </span>
            )}

            {/* Trigger Body: Searchable Input OR Tags */}
            <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0 overflow-hidden">
              {multiple &&
              Array.isArray(selectedOptions) &&
              selectedOptions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1 min-w-0 py-0.5">
                  {selectedOptions.map((opt) => (
                    <span
                      key={String(opt.value)}
                      className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground select-none"
                    >
                      {opt.icon && (
                        <span className="size-3 shrink-0">{opt.icon}</span>
                      )}
                      <span className="truncate max-w-30">
                        {typeof opt.label === "string"
                          ? opt.label
                          : String(opt.value)}
                      </span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveTag(e, opt.value)}
                          className="text-accent-foreground/60 hover:text-accent-foreground cursor-pointer rounded-xs"
                        >
                          <CloseIcon className="size-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              ) : null}

              <ComboboxInput
                id={selectId}
                name={name}
                disabled={disabled}
                placeholder={
                  multiple &&
                  Array.isArray(selectedOptions) &&
                  selectedOptions.length > 0
                    ? ""
                    : isFocused && currentOptionLabel
                      ? currentOptionLabel
                      : placeholder
                }
                displayValue={(val: any) => {
                  if (multiple) return query;
                  if (isFocused && !query) return "";
                  if (renderValue) {
                    const custom = renderValue(val, selectedOptions);
                    if (typeof custom === "string") return custom;
                  }
                  const opt = findOption(val);
                  if (opt) {
                    return typeof opt.label === "string"
                      ? opt.label
                      : String(opt.value);
                  }
                  return "";
                }}
                onFocus={(e) => {
                  setIsFocused(true);
                  if (optionsRef.current) {
                    optionsRef.current.scrollTop = 0;
                  }
                  e.currentTarget.select();
                }}
                onBlur={() => {
                  setIsFocused(false);
                  setQuery("");
                }}
                onClick={(e) => {
                  if (!isFocused) {
                    setIsFocused(true);
                  }
                  if (!query) {
                    (e.target as HTMLInputElement).select();
                  }
                }}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="w-full min-w-15 flex-1 bg-transparent text-foreground placeholder:text-foreground/40 outline-none border-0 p-0 focus:outline-none focus:ring-0 select-text"
              />
            </div>

            {/* End Action Slot: Spinner, Clear Button, Chevron */}
            <div className="flex items-center gap-1.5 shrink-0 text-foreground/50">
              {isActuallyLoading && (
                <SpinnerIcon className={iconSizes[sizeVariant]} />
              )}

              {clearable && (hasValue || query !== "") && !disabled && (
                <Button
                  variant="barebone"
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear selection"
                  className="text-foreground/40 hover:text-foreground cursor-pointer transition-colors p-0.5 rounded"
                >
                  <CloseIcon className={iconSizes[sizeVariant]} />
                </Button>
              )}

              <ComboboxButton className="flex items-center cursor-pointer hover:text-foreground transition-colors">
                {endIcon || (
                  <ChevronDownIcon className={iconSizes[sizeVariant]} />
                )}
              </ComboboxButton>
            </div>
          </div>
        ) : (
          <ComboboxButton
            as="div"
            disabled={disabled}
            className={cn(
              "relative flex w-full items-center justify-between rounded-md border border-border bg-muted/20 text-foreground transition-all input-focus cursor-pointer select-none",
              invalid &&
                "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
              disabled && "opacity-50 cursor-not-allowed bg-muted/20",
              sizeClasses[sizeVariant],
              className,
            )}
          >
            {/* Hidden floating reference input for Headless UI anchor positioning when non-searchable */}
            <ComboboxInput
              aria-hidden="true"
              tabIndex={-1}
              readOnly
              className="absolute inset-0 size-full opacity-0 pointer-events-none -z-10"
              displayValue={() => ""}
            />

            {/* Start Icon Slot */}
            {activeStartIcon && (
              <span
                className={cn(
                  "flex items-center text-foreground/60 shrink-0 select-none",
                  iconSizes[sizeVariant],
                )}
              >
                {activeStartIcon}
              </span>
            )}

            {/* Trigger Body: Selected Value / Multiple Tags */}
            <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0 overflow-hidden py-0.5">
              {multiple &&
              Array.isArray(selectedOptions) &&
              selectedOptions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1 min-w-0 py-0.5">
                  {selectedOptions.map((opt) => (
                    <span
                      key={String(opt.value)}
                      className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground select-none"
                    >
                      {opt.icon && (
                        <span className="size-3 shrink-0">{opt.icon}</span>
                      )}
                      <span className="truncate max-w-30">
                        {typeof opt.label === "string"
                          ? opt.label
                          : String(opt.value)}
                      </span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveTag(e, opt.value)}
                          className="text-accent-foreground/60 hover:text-accent-foreground cursor-pointer rounded-xs"
                        >
                          <CloseIcon className="size-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <span
                  className={cn(
                    "truncate block",
                    !hasValue && "text-foreground/40",
                  )}
                >
                  {renderValue
                    ? renderValue(currentValue, selectedOptions)
                    : !hasValue
                      ? placeholder
                      : multiple
                        ? `${(selectedOptions as SelectOption<T>[]).length} selected`
                        : ((selectedOptions as SelectOption<T> | null)?.label ??
                          String(currentValue))}
                </span>
              )}
            </div>

            {/* End Action Slot: Spinner, Clear Button, Chevron */}
            <div className="flex items-center gap-1.5 shrink-0 text-foreground/50">
              {isActuallyLoading && (
                <SpinnerIcon className={iconSizes[sizeVariant]} />
              )}

              {clearable && hasValue && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear selection"
                  className="text-foreground/40 hover:text-foreground cursor-pointer transition-colors p-0.5 rounded"
                >
                  <CloseIcon className={iconSizes[sizeVariant]} />
                </button>
              )}

              <div className="flex items-center">
                {endIcon || (
                  <ChevronDownIcon className={iconSizes[sizeVariant]} />
                )}
              </div>
            </div>
          </ComboboxButton>
        )}

        {/* Dropdown Options List */}
        <ComboboxOptions
          ref={optionsRef}
          transition
          anchor={anchor}
          onScroll={handleScroll}
          className={cn(
            anchor
              ? "z-50 min-w-36 max-h-60 [--anchor-gap:4px] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-xl outline-none"
              : "absolute top-full left-0 mt-1 z-50 w-full min-w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-xl outline-none",
            "transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0",
            dropdownClassName,
          )}
        >
          {children ? (
            children
          ) : (
            <>
              {isActuallyLoading && displayedOptions.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <SpinnerIcon className="size-4" />
                  <span>{loadingText}</span>
                </div>
              ) : displayedOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground select-none">
                  {emptyText}
                </div>
              ) : (
                <>
                  {displayedOptions.map((item, index) => {
                    if (isGroup(item)) {
                      return (
                        <div key={item.group || index} className="py-1">
                          <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                            {item.group}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {item.options.map((opt) => (
                              <ComboboxOptionItem
                                key={String(opt.value)}
                                option={opt}
                                renderOption={renderOption}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <ComboboxOptionItem
                        key={String(item.value)}
                        option={item}
                        renderOption={renderOption}
                      />
                    );
                  })}
                </>
              )}
            </>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

function ComboboxOptionItem<T>({
  option,
  renderOption,
}: {
  option: SelectOption<T>;
  renderOption?: (
    option: SelectOption<T>,
    state: { selected: boolean; active: boolean; disabled: boolean },
  ) => ReactNode;
}) {
  return (
    <ComboboxOption
      value={option.value}
      disabled={option.disabled}
      className={cn(
        "group/option relative flex cursor-pointer select-none items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-popover-foreground outline-none transition-colors",
        "data-focus:bg-accent data-focus:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
      )}
    >
      {({ selected, focus, disabled }) => {
        if (renderOption) {
          const customNode = renderOption(option, {
            selected,
            active: focus,
            disabled: !!disabled,
          });
          return <>{customNode}</>;
        }

        return (
          <>
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              {option.icon && (
                <span className="shrink-0 size-4 flex items-center justify-center text-muted-foreground group-data-focus/option:text-accent-foreground">
                  {option.icon}
                </span>
              )}
              <div className="flex flex-col min-w-0">
                <span className={cn("truncate", selected && "font-semibold")}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-xs text-muted-foreground group-data-focus/option:text-accent-foreground/70 truncate">
                    {option.description}
                  </span>
                )}
              </div>
            </div>

            <CheckIcon
              className={cn(
                "size-4 shrink-0 text-primary group-data-focus/option:text-accent-foreground",
                selected ? "opacity-100" : "opacity-0",
              )}
            />
          </>
        );
      }}
    </ComboboxOption>
  );
}

export interface SelectOptionProps extends ComponentPropsWithoutRef<
  typeof ComboboxOption
> {}

function SelectOptionWrapper({ className, ...props }: SelectOptionProps) {
  return (
    <ComboboxOption
      className={cn(
        "group/option relative flex cursor-pointer select-none items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-popover-foreground outline-none transition-colors",
        "data-focus:bg-accent data-focus:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function SelectGroupWrapper({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("py-1", className)} {...props} />;
}

function SelectLabelWrapper({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none",
        className,
      )}
      {...props}
    />
  );
}

function SelectSeparatorWrapper({
  className,
  ...props
}: ComponentPropsWithoutRef<"hr">) {
  return (
    <hr
      className={cn("my-1 border-t border-border/50", className)}
      {...props}
    />
  );
}

export const CompoundSelect = Object.assign(Select, {
  Option: SelectOptionWrapper,
  Group: SelectGroupWrapper,
  Label: SelectLabelWrapper,
  Separator: SelectSeparatorWrapper,
});

export default CompoundSelect;
