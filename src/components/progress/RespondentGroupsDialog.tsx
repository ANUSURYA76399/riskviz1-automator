
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface RespondentGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedGroups: string[];
  pendingGroups: string[];
}

export const RespondentGroupsDialog = ({
  open,
  onOpenChange,
  completedGroups = [],
  pendingGroups = [],
}: RespondentGroupsDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Respondent Groups Status</DialogTitle>
        <DialogDescription>
          <div className="space-y-4 mt-3">
            <div>
              <p className="font-medium text-green-700 mb-2">Completed Groups ({completedGroups.length})</p>
              <div className="bg-green-50 border border-green-100 rounded-md p-3">
                <ul className="pl-5 list-disc text-sm text-green-800 space-y-1">
                  {completedGroups.length === 0 ? (
                    <li>None</li>
                  ) : (
                    completedGroups.map((group) => <li key={group}>{group}</li>)
                  )}
                </ul>
              </div>
            </div>
            <div>
              <p className="font-medium text-yellow-700 mb-2">Pending Groups ({pendingGroups.length})</p>
              <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3">
                <ul className="pl-5 list-disc text-sm text-yellow-900 space-y-1">
                  {pendingGroups.length === 0 ? (
                    <li>None</li>
                  ) : (
                    pendingGroups.map((group) => <li key={group}>{group}</li>)
                  )}
                </ul>
              </div>
            </div>
          </div>
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
);
