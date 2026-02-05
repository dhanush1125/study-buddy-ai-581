 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
 import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
 import { TrendingUp, Loader2 } from 'lucide-react';
 import { GoalHistoryData } from '@/hooks/useGoalHistory';
 
 interface GoalHistoryChartProps {
   data: GoalHistoryData[];
   isLoading?: boolean;
 }
 
 const chartConfig = {
   topicsRate: {
     label: 'Topics',
     color: 'hsl(var(--chart-1))',
   },
   quizzesRate: {
     label: 'Quizzes',
     color: 'hsl(var(--chart-2))',
   },
   studyDaysRate: {
     label: 'Study Days',
     color: 'hsl(var(--chart-3))',
   },
   overallRate: {
     label: 'Overall',
     color: 'hsl(var(--chart-4))',
   },
 };
 
 export const GoalHistoryChart = ({ data, isLoading }: GoalHistoryChartProps) => {
   if (isLoading) {
     return (
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-sm flex items-center gap-2">
             <TrendingUp className="h-4 w-4 text-primary" />
             Weekly Goal Completion History
           </CardTitle>
         </CardHeader>
         <CardContent className="flex items-center justify-center h-[250px]">
           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </CardContent>
       </Card>
     );
   }
 
   if (!data.length) {
     return (
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-sm flex items-center gap-2">
             <TrendingUp className="h-4 w-4 text-primary" />
             Weekly Goal Completion History
           </CardTitle>
         </CardHeader>
         <CardContent className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
           No history data yet. Goal completion will be tracked weekly.
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-2">
         <CardTitle className="text-sm flex items-center gap-2">
           <TrendingUp className="h-4 w-4 text-primary" />
           Weekly Goal Completion History
         </CardTitle>
       </CardHeader>
       <CardContent>
         <ChartContainer config={chartConfig} className="h-[250px] w-full">
           <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
             <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
             <XAxis 
               dataKey="weekLabel" 
               tick={{ fontSize: 12 }} 
               tickLine={false}
               axisLine={false}
             />
             <YAxis 
               domain={[0, 100]} 
               tick={{ fontSize: 12 }} 
               tickLine={false}
               axisLine={false}
               tickFormatter={(value) => `${value}%`}
             />
             <ChartTooltip 
               content={<ChartTooltipContent />}
               formatter={(value: number) => [`${value}%`, '']}
             />
             <Legend 
               wrapperStyle={{ fontSize: '12px' }}
               iconType="circle"
               iconSize={8}
             />
             <Line
               type="monotone"
               dataKey="topicsRate"
               name="Topics"
               stroke="var(--color-topicsRate)"
               strokeWidth={2}
               dot={{ r: 3 }}
               activeDot={{ r: 5 }}
             />
             <Line
               type="monotone"
               dataKey="quizzesRate"
               name="Quizzes"
               stroke="var(--color-quizzesRate)"
               strokeWidth={2}
               dot={{ r: 3 }}
               activeDot={{ r: 5 }}
             />
             <Line
               type="monotone"
               dataKey="studyDaysRate"
               name="Study Days"
               stroke="var(--color-studyDaysRate)"
               strokeWidth={2}
               dot={{ r: 3 }}
               activeDot={{ r: 5 }}
             />
             <Line
               type="monotone"
               dataKey="overallRate"
               name="Overall"
               stroke="var(--color-overallRate)"
               strokeWidth={3}
               strokeDasharray="5 5"
               dot={{ r: 4 }}
               activeDot={{ r: 6 }}
             />
           </LineChart>
         </ChartContainer>
       </CardContent>
     </Card>
   );
 };