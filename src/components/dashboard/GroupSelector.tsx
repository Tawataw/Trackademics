import { useTrackerStore } from '../../store/useTrackerStore';
import { useAuth } from '../../contexts/AuthContext';
import { GroupType } from '../../types';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';
import { FlaskConical, Briefcase, BookOpen } from 'lucide-react';

const groups: { id: GroupType; name: string; icon: any }[] = [
  { id: 'SCIENCE', name: 'Science', icon: FlaskConical },
  { id: 'COMMERCE', name: 'Commerce', icon: Briefcase },
  { id: 'ARTS', name: 'Arts / Humanities', icon: BookOpen },
];

export function GroupSelector() {
  const { group, setGroup } = useTrackerStore();
  const { user, updateDbUser } = useAuth();

  const handleGroupSelect = (newGroup: GroupType) => {
    setGroup(newGroup);
    if (user) {
      updateDbUser({ group: newGroup }).catch(err => {
        console.error('Failed to sync group to Firestore profile:', err);
      });
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">Select Group</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {groups.map((g) => {
          const isSelected = group === g.id;
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              onClick={() => handleGroupSelect(g.id)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer",
                isSelected
                  ? "bg-brand-600/30 border-brand-500 text-white backdrop-blur-md shadow-lg shadow-brand-500/10"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white/90"
              )}
            >
              <Icon className={cn("w-5 h-5", isSelected ? "text-brand-300" : "text-white/40")} />
              <span className="font-medium">{g.name}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
