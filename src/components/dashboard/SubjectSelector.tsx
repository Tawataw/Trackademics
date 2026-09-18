import { useTrackerStore } from '../../store/useTrackerStore';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

export function SubjectSelector() {
  const { 
    mainSubjects, setMainSubjects, 
    optionalSubject, setOptionalSubject,
    getAvailableMainSubjects, getAvailableOptionalSubjects 
  } = useTrackerStore();

  const availableMain = getAvailableMainSubjects();
  const availableOptional = getAvailableOptionalSubjects();

  const toggleMain = (id: string) => {
    if (mainSubjects.includes(id)) {
      setMainSubjects(mainSubjects.filter(s => s !== id));
      return;
    }
    if (mainSubjects.length < 3) {
      setMainSubjects([...mainSubjects, id]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">
            Main Subjects (Select 3)
          </h2>
          <span className="text-xs font-medium px-2 py-1 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-md">
            {mainSubjects.length} / 3
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {availableMain.map(subj => {
            const isSelected = mainSubjects.includes(subj.id);
            const isDisabled = !isSelected && mainSubjects.length >= 3;
            return (
              <button
                key={subj.id}
                disabled={isDisabled}
                onClick={() => toggleMain(subj.id)}
                className={cn(
                  "p-3 rounded-2xl border text-sm font-medium transition-all text-left",
                  isSelected 
                    ? "bg-brand-600/80 backdrop-blur-md border-brand-500 text-white shadow-lg shadow-brand-900/20" 
                    : isDisabled
                      ? "bg-white/5 border-white/5 text-white/30 cursor-not-allowed"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                )}
              >
                {subj.name}
              </button>
            );
          })}
        </div>
      </Card>

      {mainSubjects.length === 3 && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">
            Fourth / Optional Subject
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {availableOptional.map(subj => {
              const isSelected = optionalSubject === subj.id;
              return (
                <button
                  key={subj.id}
                  onClick={() => setOptionalSubject(isSelected ? null : subj.id)}
                  className={cn(
                    "p-3 rounded-2xl border text-sm font-medium transition-all text-left",
                    isSelected 
                      ? "bg-brand-600/80 backdrop-blur-md border-brand-500 text-white shadow-lg shadow-brand-900/20" 
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  {subj.name}
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
