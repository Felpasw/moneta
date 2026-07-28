"use client";

import { motion, type Variants } from "motion/react";
import { ChevronRight } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

interface NavItem {
  icon: ReactNode;
  label: string;
  href: string;
  isSeparator?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

const initialsFromName = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0][0].toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

interface LogoutItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

interface AppSidebarProps {
  user: UserProfile;
  navItems: NavItem[];
  logoutItem: LogoutItem;
  className?: string;
  ref?: Ref<HTMLElement>;
}

const sidebarVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export function AppSidebar({
  ref,
  user,
  navItems,
  logoutItem,
  className,
}: AppSidebarProps) {
  return (
    <motion.aside
      ref={ref}
      className={cn(
        "flex h-full w-full max-w-xs flex-col rounded-xl border bg-card p-4 text-card-foreground shadow-sm",
        className,
      )}
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      aria-label="User Profile Menu"
    >
      <motion.div
        variants={itemVariants}
        className="flex items-center space-x-4 p-2"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.name}'s avatar`}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
          >
            {initialsFromName(user.name)}
          </div>
        )}
        <div className="flex flex-col truncate">
          <span className="text-lg font-semibold">{user.name}</span>
          <span className="truncate text-sm text-muted-foreground">
            {user.email}
          </span>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="my-4 border-t border-border"
      />

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Fragment key={item.href}>
            {item.isSeparator ? (
              <motion.div variants={itemVariants} className="h-6" />
            ) : null}
            <motion.a
              href={item.href}
              variants={itemVariants}
              className="group flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="mr-3 h-5 w-5">{item.icon}</span>
              <span>{item.label}</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.a>
          </Fragment>
        ))}
      </nav>

      <motion.div variants={itemVariants} className="mt-4">
        <button
          type="button"
          onClick={logoutItem.onClick}
          className="group flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <span className="mr-3 h-5 w-5">{logoutItem.icon}</span>
          <span>{logoutItem.label}</span>
        </button>
      </motion.div>
    </motion.aside>
  );
}

export default AppSidebar;
