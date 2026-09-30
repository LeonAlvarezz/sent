import React from "react";
import type { NavGroupConfig } from "@z3/admin-core";
import { MailIcon, SearchIcon, UserIcon, UsersIcon } from "@z3/admin-core";
import { USER_ROLE } from "@z3/types";

import DashboardIcon from "~icons/boxicons/dashboard-filled";
import TimeIcon from "~icons/mingcute/time-fill";
import GearIcon from "~icons/solar/settings-bold";
import CompassIcon from "~icons/solar/compass-bold";
import GlobeIcon from "~icons/lucide/globe";
import SendIcon from "~icons/lucide/send";

export const navGroups: NavGroupConfig[] = [
  {
    id: "main",
    title: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        path: "/",
        icon: <DashboardIcon />,
      },
    ],
  },
  {
    id: "campaigns",
    title: "Outreach",
    items: [
      {
        id: "seo",
        label: "SEO",
        icon: <CompassIcon />,
        defaultOpen: true,
        roles: [USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
        items: [
          {
            id: "seo-partners",
            label: "Partners",
            path: "/seo-partners",
            icon: <GlobeIcon />,
            roles: [USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
          },
          {
            id: "seo-backlink-research",
            label: "Backlink Research",
            path: "/backlink-research",
            icon: <SearchIcon />,
            roles: [USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
          },
          {
            id: "seo-quick-outreach",
            label: "Quick Outreach",
            path: "/outreach",
            icon: <TimeIcon />,
            roles: [USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
          },
        ],
      },
      {
        id: "email",
        label: "Email",
        icon: <MailIcon />,
        defaultOpen: true,
        items: [
          {
            id: "email-audiences",
            label: "Audiences",
            path: "/emails",
            icon: <UsersIcon />,
          },
          {
            id: "email-bulk-send",
            label: "Bulk Send",
            path: "/bulk-send",
            icon: <SendIcon />,
          },
          {
            id: "email-queue",
            label: "Queue",
            path: "/campaign-queue",
            icon: <TimeIcon />,
          },
        ],
      },
    ],
  },
  {
    id: "system",
    title: "System",
    items: [
      {
        id: "users",
        label: "Users",
        icon: <UsersIcon />,
        path: "/users",
        roles: [USER_ROLE.SUPER_ADMIN],
      },
      {
        id: "settings",
        label: "Settings",
        icon: <GearIcon />,
        defaultOpen: true,
        items: [
          {
            id: "settings-account",
            label: "Account",
            path: "/settings/account",
            icon: <UserIcon />,
          },
          {
            id: "settings-mail",
            label: "Mail",
            path: "/settings/mail",
            icon: <MailIcon />,
          },
        ],
      },
    ],
  },
];
