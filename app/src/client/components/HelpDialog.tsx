import { HelpCircle, BookOpen, FileText, Settings, Users, BarChart3, FolderKanban, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { cn } from '../../lib/utils';

interface HelpDialogProps {
  className?: string;
  iconOnly?: boolean;
}

export function HelpDialog({ className, iconOnly = false }: HelpDialogProps) {
  const [open, setOpen] = useState(false);

  // Keyboard shortcut to open help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={iconOnly ? 'icon' : 'sm'}
          className={cn('text-muted-foreground hover:text-foreground', className)}
        >
          <HelpCircle className={cn('h-5 w-5', !iconOnly && 'mr-1')} />
          {!iconOnly && <span>Help</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Quest Canada Help Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to use the Quest Canada climate action tracking application.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Quick Start */}
          <div className="bg-primary/10 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">Quick Start</h3>
            <p className="text-sm text-muted-foreground">
              Quest Canada helps you track and manage climate action progress across Canadian communities.
              Use assessments to benchmark progress and projects to track initiatives.
            </p>
          </div>

          {/* Feature Sections */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="assessments">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span>Assessments</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-6">
                  <div>
                    <h4 className="font-medium">What are Assessments?</h4>
                    <p className="text-sm text-muted-foreground">
                      Assessments are climate action benchmarks for communities, measuring progress across
                      10 key indicators including Leadership, Energy Management, Transportation, and more.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Creating an Assessment</h4>
                    <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                      <li>Navigate to Assessments and click "New Assessment"</li>
                      <li>Enter community information (name, region, population)</li>
                      <li>Score each of the 10 indicators from 1-10</li>
                      <li>Add strengths and recommendations</li>
                      <li>Save as Draft or Publish</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">AI PDF Import</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the "Import from PDF" feature to automatically extract assessment data from
                      existing PDF reports using AI-powered extraction.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="projects">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  <span>Projects</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-6">
                  <div>
                    <h4 className="font-medium">Managing Projects</h4>
                    <p className="text-sm text-muted-foreground">
                      Track climate action projects including timelines, funding sources, milestones,
                      and partners. Link projects to assessment recommendations for better tracking.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Project Features</h4>
                    <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                      <li>Track project status and progress</li>
                      <li>Manage funding sources and budgets</li>
                      <li>Set and track milestones</li>
                      <li>Document partners and stakeholders</li>
                      <li>Link to assessment recommendations</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dashboards">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span>Dashboards</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-6">
                  <p className="text-sm text-muted-foreground">
                    The Dashboards page displays public climate data visualizations using embedded
                    Grafana dashboards. View trends, comparisons, and analytics across communities.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="admin">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Admin Features</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-6">
                  <p className="text-sm text-muted-foreground">
                    Admin users have access to additional features:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                    <li><strong>Analytics Dashboard:</strong> View application usage statistics</li>
                    <li><strong>User Management:</strong> Manage user accounts and roles</li>
                    <li><strong>Settings:</strong> Configure application settings</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="account">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Account</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-6">
                  <p className="text-sm text-muted-foreground">
                    Manage your account settings by clicking on your profile icon and selecting "Settings":
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                    <li>Update your email address</li>
                    <li>Change your password</li>
                    <li>View your activity</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Keyboard Shortcuts */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">?</kbd>
                <span className="text-muted-foreground">Open this help dialog</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd>
                <span className="text-muted-foreground">Close dialogs</span>
              </div>
            </div>
          </div>

          {/* 10 Indicators Reference */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Assessment Indicators (1-10 Scale)</h3>
            <ol className="grid grid-cols-2 gap-1 text-sm text-muted-foreground list-decimal pl-4">
              <li>Leadership & Governance</li>
              <li>Climate Action Planning</li>
              <li>Energy Management</li>
              <li>Buildings & Infrastructure</li>
              <li>Transportation</li>
              <li>Waste Management</li>
              <li>Water Management</li>
              <li>Land Use & Nature</li>
              <li>Community Engagement</li>
              <li>Economic Development</li>
            </ol>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            Quest Canada - Supporting Canadian Communities on the Pathway to Net-Zero
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
