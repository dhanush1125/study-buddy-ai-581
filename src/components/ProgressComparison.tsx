import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BookOpen, 
  Target, 
  Award,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  subWeeks,
  isWithinInterval,
  format
} from 'date-fns';

interface Topic {
  completed_at: string;
  subject: string;
}

interface Quiz {
  attempted_at: string;
  percentage: number;
  subject: string;
}

interface ProgressComparisonProps {
  topics: Topic[];
  quizzes: Quiz[];
}

type PeriodType = 'month' | 'week';

interface PeriodStats {
  topicsCompleted: number;
  quizzesTaken: number;
  avgScore: number;
  studyDays: number;
  subjectsExplored: number;
}

function calculateStats(
  topics: Topic[],
  quizzes: Quiz[],
  startDate: Date,
  endDate: Date
): PeriodStats {
  const interval = { start: startDate, end: endDate };

  const periodTopics = topics.filter(t => 
    isWithinInterval(new Date(t.completed_at), interval)
  );
  
  const periodQuizzes = quizzes.filter(q => 
    isWithinInterval(new Date(q.attempted_at), interval)
  );

  // Calculate study days
  const studyDates = new Set<string>();
  periodTopics.forEach(t => studyDates.add(new Date(t.completed_at).toDateString()));
  periodQuizzes.forEach(q => studyDates.add(new Date(q.attempted_at).toDateString()));

  // Calculate subjects
  const subjects = new Set<string>();
  periodTopics.forEach(t => subjects.add(t.subject));

  const avgScore = periodQuizzes.length > 0
    ? Math.round(periodQuizzes.reduce((sum, q) => sum + Number(q.percentage), 0) / periodQuizzes.length)
    : 0;

  return {
    topicsCompleted: periodTopics.length,
    quizzesTaken: periodQuizzes.length,
    avgScore,
    studyDays: studyDates.size,
    subjectsExplored: subjects.size,
  };
}

function StatComparison({ 
  label, 
  icon: Icon, 
  current, 
  previous,
  suffix = '',
  higherIsBetter = true
}: { 
  label: string;
  icon: React.ElementType;
  current: number;
  previous: number;
  suffix?: string;
  higherIsBetter?: boolean;
}) {
  const diff = current - previous;
  const percentChange = previous > 0 ? Math.round((diff / previous) * 100) : (current > 0 ? 100 : 0);
  
  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (diff > 0) trend = 'up';
  else if (diff < 0) trend = 'down';

  const isPositive = higherIsBetter ? trend === 'up' : trend === 'down';
  const isNegative = higherIsBetter ? trend === 'down' : trend === 'up';

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="text-muted-foreground text-sm">{previous}{suffix}</span>
        </div>
        
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        
        <div className="text-right min-w-[60px]">
          <span className="font-semibold">{current}{suffix}</span>
        </div>
        
        <Badge 
          variant="secondary"
          className={`min-w-[70px] justify-center ${
            isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
            isNegative ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
            'bg-muted text-muted-foreground'
          }`}
        >
          {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
          {trend === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
          {trend === 'neutral' ? '0%' : `${diff > 0 ? '+' : ''}${percentChange}%`}
        </Badge>
      </div>
    </div>
  );
}

export function ProgressComparison({ topics, quizzes }: ProgressComparisonProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('month');

  const { currentStats, previousStats, currentLabel, previousLabel } = useMemo(() => {
    const now = new Date();
    
    if (periodType === 'month') {
      const currentStart = startOfMonth(now);
      const currentEnd = endOfMonth(now);
      const previousStart = startOfMonth(subMonths(now, 1));
      const previousEnd = endOfMonth(subMonths(now, 1));

      return {
        currentStats: calculateStats(topics, quizzes, currentStart, currentEnd),
        previousStats: calculateStats(topics, quizzes, previousStart, previousEnd),
        currentLabel: format(now, 'MMMM yyyy'),
        previousLabel: format(subMonths(now, 1), 'MMMM yyyy'),
      };
    } else {
      const currentStart = startOfWeek(now, { weekStartsOn: 1 });
      const currentEnd = endOfWeek(now, { weekStartsOn: 1 });
      const previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const previousEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

      return {
        currentStats: calculateStats(topics, quizzes, currentStart, currentEnd),
        previousStats: calculateStats(topics, quizzes, previousStart, previousEnd),
        currentLabel: `This Week`,
        previousLabel: `Last Week`,
      };
    }
  }, [topics, quizzes, periodType]);

  // Calculate overall improvement score
  const improvements = [
    currentStats.topicsCompleted > previousStats.topicsCompleted,
    currentStats.quizzesTaken > previousStats.quizzesTaken,
    currentStats.avgScore > previousStats.avgScore,
    currentStats.studyDays > previousStats.studyDays,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress Comparison
            </CardTitle>
            <CardDescription>
              Compare performance between time periods
            </CardDescription>
          </div>
          <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Labels */}
        <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <span>{previousLabel}</span>
          <ArrowRight className="h-4 w-4" />
          <span className="font-medium text-foreground">{currentLabel}</span>
        </div>

        {/* Stats Comparison */}
        <div>
          <StatComparison 
            label="Topics Completed" 
            icon={BookOpen}
            current={currentStats.topicsCompleted}
            previous={previousStats.topicsCompleted}
          />
          <StatComparison 
            label="Quizzes Taken" 
            icon={Target}
            current={currentStats.quizzesTaken}
            previous={previousStats.quizzesTaken}
          />
          <StatComparison 
            label="Average Score" 
            icon={Award}
            current={currentStats.avgScore}
            previous={previousStats.avgScore}
            suffix="%"
          />
          <StatComparison 
            label="Study Days" 
            icon={Calendar}
            current={currentStats.studyDays}
            previous={previousStats.studyDays}
          />
        </div>

        {/* Summary */}
        <div className={`rounded-lg p-4 text-center ${
          improvements >= 3 ? 'bg-green-50 dark:bg-green-900/20' :
          improvements >= 2 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
          'bg-muted'
        }`}>
          {improvements >= 3 ? (
            <>
              <p className="text-green-700 dark:text-green-400 font-semibold">🎉 Great Progress!</p>
              <p className="text-sm text-green-600 dark:text-green-500">
                Improved in {improvements} out of 4 areas compared to {periodType === 'month' ? 'last month' : 'last week'}
              </p>
            </>
          ) : improvements >= 2 ? (
            <>
              <p className="text-yellow-700 dark:text-yellow-400 font-semibold">📈 Steady Progress</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                Improved in {improvements} out of 4 areas - keep it up!
              </p>
            </>
          ) : improvements === 1 ? (
            <>
              <p className="text-muted-foreground font-semibold">💪 Room to Grow</p>
              <p className="text-sm text-muted-foreground">
                Some improvement shown - let's focus on consistency
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground font-semibold">📊 Getting Started</p>
              <p className="text-sm text-muted-foreground">
                {previousStats.topicsCompleted === 0 && currentStats.topicsCompleted === 0
                  ? 'No activity recorded yet in these periods'
                  : 'Focus on small daily improvements'}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
