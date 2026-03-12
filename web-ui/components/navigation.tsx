"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GitHubLogoIcon, HamburgerMenuIcon, Cross2Icon, PersonIcon } from "@radix-ui/react-icons";
import { useState, useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getLoginUrl } from "@/lib/auth";
import { useRepoFilter } from "@/lib/repo-filter-context";
import { repoApi, type Repository } from "@/lib/api-client";
import { Building2, ChevronDown, Globe } from "lucide-react";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { selectedRepo, setSelectedRepo } = useRepoFilter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const repoDropdownRef = useRef<HTMLDivElement>(null);

  const navigationLinks = [
    { href: "/skills", label: "Skills" },
    { href: "/subagents", label: "Subagents" },
    { href: "/commands", label: "Commands" },
    { href: "/mcp-servers", label: "MCP Servers" },
  ];

  useEffect(() => {
    if (user?.sub) {
      repoApi.listMy(user.sub)
        .then(res => setRepos(res.repositories || []))
        .catch(() => {});
    }
  }, [user?.sub]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (repoDropdownRef.current && !repoDropdownRef.current.contains(e.target as Node)) {
        setRepoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-medium text-foreground hover:text-primary transition-colors shrink-0">
                Build with Claude
              </Link>

              {/* Repo switcher */}
              {user && (
                <div className="relative hidden sm:block" ref={repoDropdownRef}>
                  <button
                    onClick={() => setRepoDropdownOpen(v => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 text-sm hover:bg-muted/60 transition-colors"
                  >
                    {selectedRepo ? (
                      <><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="max-w-[120px] truncate">{selectedRepo.displayName || selectedRepo.name}</span></>
                    ) : (
                      <><Globe className="h-3.5 w-3.5 text-muted-foreground" /><span>All</span></>
                    )}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>

                  {repoDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-md border border-border bg-popover shadow-md py-1">
                      <button
                        onClick={() => { setSelectedRepo(null); setRepoDropdownOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors",
                          !selectedRepo && "bg-muted/30 font-medium"
                        )}
                      >
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        All
                      </button>
                      {repos.map(repo => (
                        <button
                          key={repo.id}
                          onClick={() => { setSelectedRepo(repo); setRepoDropdownOpen(false); }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors",
                            selectedRepo?.id === repo.id && "bg-muted/30 font-medium"
                          )}
                        >
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate">{repo.displayName || repo.name}</span>
                        </button>
                      ))}
                      {repos.length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No repositories</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="hidden lg:flex items-center gap-1">
                {navigationLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "px-3 py-1.5 text-sm transition-colors rounded-md",
                        isActive
                          ? "text-primary bg-primary/10 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-8 w-8 p-0"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <HamburgerMenuIcon className="h-4 w-4" />
              </Button>
              {!loading && (
                user ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard"
                      className={cn(
                        "px-3 py-1.5 text-sm transition-colors rounded-md hidden sm:block",
                        pathname === '/dashboard'
                          ? "text-primary bg-primary/10 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {user.preferred_username || user.name}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={logout}
                    >
                      <PersonIcon className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">Logout</span>
                    </Button>
                  </div>
                ) : (
                  <a href={getLoginUrl(pathname)}>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                      <PersonIcon className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">Login</span>
                    </Button>
                  </a>
                )
              )}
              <a
                href="https://github.com/davepoon/buildwithclaude"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                  <GitHubLogoIcon className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">GitHub</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <DialogPrimitive.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          />
          <DialogPrimitive.Content
            className={cn(
              "fixed inset-y-0 right-0 z-50 h-full w-full max-w-xs bg-background border-l border-border duration-200",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
            )}
          >
            <DialogPrimitive.Title className="sr-only">Navigation Menu</DialogPrimitive.Title>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border p-4">
                <Link
                  href="/"
                  className="font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Build with Claude
                </Link>
                <DialogPrimitive.Close className="rounded-sm opacity-70 hover:opacity-100">
                  <Cross2Icon className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              </div>

              {/* Mobile repo switcher */}
              {user && (
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-2">Repository</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedRepo(null)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-colors",
                        !selectedRepo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Globe className="h-3.5 w-3.5" /> All
                    </button>
                    {repos.map(repo => (
                      <button
                        key={repo.id}
                        onClick={() => setSelectedRepo(repo)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-colors",
                          selectedRepo?.id === repo.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        {repo.displayName || repo.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <nav className="flex-1 p-4">
                <div className="space-y-1">
                  {navigationLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block px-3 py-2 text-sm rounded-md transition-colors",
                          isActive
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="border-t border-border p-4 space-y-3">
                {user && (
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard ({user.preferred_username || user.name})
                  </Link>
                )}
                <a
                  href="https://github.com/davepoon/buildwithclaude"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-center gap-2">
                    <GitHubLogoIcon className="h-4 w-4" />
                    View on GitHub
                  </Button>
                </a>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
