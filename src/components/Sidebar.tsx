"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllTags, getDrives } from "@/lib/api";
import type { StorageDrive } from "@/types/files";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function DriveIcon({ type }: { type: string }) {
  if (type === "ssd") {
    return (
      <svg className="h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 0 0-.12-1.03l-2.268-9.64a3.375 3.375 0 0 0-3.285-2.602H7.923a3.375 3.375 0 0 0-3.285 2.602l-2.268 9.64a4.5 4.5 0 0 0-.12 1.03v.228m19.5 0a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3m19.5 0a3 3 0 0 0-3-3H5.25a3 3 0 0 0-3 3m16.5 0h.008v.008h-.008v-.008Zm-3 0h.008v.008h-.008v-.008Z" />
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [tags, setTags] = useState<string[]>([]);
  const [drives, setDrives] = useState<StorageDrive[]>([]);

  // ドライブ一覧を読み込み
  useEffect(() => {
    getDrives()
      .then(setDrives)
      .catch((e) => console.error("Failed to load drives:", e));
  }, []);

  // タグ一覧を読み込み
  useEffect(() => {
    getAllTags().then(setTags).catch(() => {});
  }, [pathname]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border
          bg-surface-alt pt-14 transition-transform duration-200 ease-in-out
          lg:static lg:z-auto lg:translate-x-0 lg:pt-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav className="flex h-full flex-col overflow-y-auto p-4">
          {/* ライブラリ */}
          <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Library
          </h2>
          <ul className="mb-4 space-y-0.5">
            <SidebarLink
              href="/favorites"
              label="Favorites"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              }
              isActive={pathname === "/favorites"}
              onClick={onClose}
            />
          </ul>

          {/* タグ */}
          {tags.length > 0 && (
            <>
              <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Tags
              </h2>
              <ul className="mb-4 space-y-0.5">
                {tags.map((tag) => {
                  const href = `/tags/${encodeURIComponent(tag)}`;
                  return (
                    <SidebarLink
                      key={tag}
                      href={href}
                      label={tag}
                      icon={
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                        </svg>
                      }
                      isActive={pathname === `/tags/${encodeURIComponent(tag)}`}
                      onClick={onClose}
                    />
                  );
                })}
              </ul>
            </>
          )}

          {/* ドライブ */}
          <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Drives
          </h2>
          <ul className="space-y-0.5">
            {drives.map((drive) => {
              // 空idのデフォルトドライブは/filesを指す。idありは/files/<id>。
              const href = drive.id ? `/files/${drive.id}` : "/files";
              const isActive =
                pathname === href || (pathname?.startsWith(href + "/") ?? false);
              return (
                <li key={drive.id || "root"}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-text hover:bg-surface-hover"
                    }`}
                  >
                    <DriveIcon type={drive.icon} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{drive.name}</div>
                      {drive.description && (
                        <div className="truncate text-xs text-text-secondary">
                          {drive.description}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-primary/10 font-medium text-primary"
            : "text-text hover:bg-surface-hover"
        }`}
      >
        <span className="text-text-secondary">{icon}</span>
        {label}
      </Link>
    </li>
  );
}
