 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
 import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
 import { GoalHistoryData } from '@/hooks/useGoalHistory';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
 
 interface GoalHistoryChartProps {
   data: GoalHistoryData[];
   isLoading?: boolean;
  studentName?: string;
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
 
export const GoalHistoryChart = ({ data, isLoading, studentName = 'Student' }: GoalHistoryChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!chartRef.current || data.length === 0) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(99, 102, 241);
      pdf.text('📚 Study Buddy AI', 14, 15);
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${studentName}'s Goal Progress Report`, 14, 25);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, 14, 32);
      
      // Add chart image
      const imgWidth = pageWidth - 28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 14, 40, imgWidth, Math.min(imgHeight, pageHeight - 60));
      
      // Add summary stats
      if (data.length > 0) {
        const avgOverall = Math.round(data.reduce((sum, d) => sum + d.overallRate, 0) / data.length);
        const latestWeek = data[data.length - 1];
        
        const summaryY = Math.min(40 + imgHeight + 10, pageHeight - 30);
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Summary:', 14, summaryY);
        pdf.setFontSize(10);
        pdf.text(`• Average Overall Completion: ${avgOverall}%`, 14, summaryY + 7);
        pdf.text(`• Latest Week (${latestWeek.weekLabel}): Topics ${latestWeek.topicsRate}%, Quizzes ${latestWeek.quizzesRate}%, Study Days ${latestWeek.studyDaysRate}%`, 14, summaryY + 14);
        pdf.text(`• Weeks Tracked: ${data.length}`, 14, summaryY + 21);
      }
      
      pdf.save(`${studentName.replace(/\s+/g, '_')}_goal_progress_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: 'PDF Exported',
        description: 'Goal progress report has been downloaded.',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

   if (isLoading) {
     return (
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-sm flex items-center gap-2">
             <TrendingUp className="h-4 w-4 text-primary" />
             Weekly Goal Completion History
           </CardTitle>
         </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
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
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
           No history data yet. Goal completion will be tracked weekly.
         </CardContent>
       </Card>
     );
   }
 
   return (
    <Card ref={chartRef}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Weekly Goal Completion History
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={isExporting || data.length === 0}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export PDF
        </Button>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
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