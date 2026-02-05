 import jsPDF from 'jspdf';
 import { format } from 'date-fns';
 
 interface TopicData {
   id: string;
   topic_name: string;
   subject: string;
   difficulty: string;
   completed_at: string;
 }
 
 interface QuizData {
   id: string;
   topic_name: string;
   subject: string;
   score: number;
   total_questions: number;
   percentage: number;
   attempted_at: string;
 }
 
 interface WeakArea {
   subject: string;
   avgScore: number;
   attempts: number;
 }
 
 interface GoalProgress {
   weeklyTopicGoal: number;
   weeklyQuizGoal: number;
   studyDaysGoal: number;
   topicsCompleted: number;
   quizzesCompleted: number;
   studyDays: number;
 }
 
 interface StudyConsistency {
   activeDays: number;
   totalDays: number;
   streak: number;
 }
 
 interface GoalHistoryItem {
   weekLabel: string;
   topicsRate: number;
   quizzesRate: number;
   studyDaysRate: number;
   overallRate: number;
 }
 
 interface ReportData {
   studentName: string;
   totalTopics: number;
   totalQuizzes: number;
   avgScore: number;
   subjectCount: number;
   goalProgress: GoalProgress;
   weakAreas: WeakArea[];
   consistency: StudyConsistency;
   recentTopics: TopicData[];
   recentQuizzes: QuizData[];
   goalHistory: GoalHistoryItem[];
 }
 
 export const generateProgressReport = (data: ReportData): void => {
   const pdf = new jsPDF({
     orientation: 'portrait',
     unit: 'mm',
     format: 'a4',
   });
 
   const pageWidth = pdf.internal.pageSize.getWidth();
   const pageHeight = pdf.internal.pageSize.getHeight();
   const margin = 14;
   let yPos = 20;
 
   const addNewPageIfNeeded = (requiredSpace: number) => {
     if (yPos + requiredSpace > pageHeight - 20) {
       pdf.addPage();
       yPos = 20;
       return true;
     }
     return false;
   };
 
   const drawSectionHeader = (title: string, emoji: string) => {
     addNewPageIfNeeded(20);
     pdf.setFillColor(99, 102, 241);
     pdf.rect(margin, yPos - 4, pageWidth - margin * 2, 10, 'F');
     pdf.setTextColor(255, 255, 255);
     pdf.setFontSize(12);
     pdf.setFont('helvetica', 'bold');
     pdf.text(`${emoji} ${title}`, margin + 4, yPos + 3);
     pdf.setTextColor(0, 0, 0);
     pdf.setFont('helvetica', 'normal');
     yPos += 14;
   };
 
   const drawProgressBar = (x: number, y: number, width: number, value: number, label: string) => {
     const barHeight = 6;
     const percentage = Math.min(100, value);
     
     // Background
     pdf.setFillColor(229, 231, 235);
     pdf.roundedRect(x, y, width, barHeight, 2, 2, 'F');
     
     // Progress
     const fillColor = percentage >= 100 ? [34, 197, 94] : percentage >= 50 ? [99, 102, 241] : [239, 68, 68];
     pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
     pdf.roundedRect(x, y, (width * percentage) / 100, barHeight, 2, 2, 'F');
     
     // Label
     pdf.setFontSize(9);
     pdf.setTextColor(100, 100, 100);
     pdf.text(label, x, y - 2);
     pdf.text(`${Math.round(percentage)}%`, x + width - 10, y - 2);
   };
 
   // ===== HEADER =====
   pdf.setFillColor(99, 102, 241);
   pdf.rect(0, 0, pageWidth, 35, 'F');
   
   pdf.setTextColor(255, 255, 255);
   pdf.setFontSize(22);
   pdf.setFont('helvetica', 'bold');
   pdf.text('Study Buddy AI', margin, 18);
   
   pdf.setFontSize(14);
   pdf.setFont('helvetica', 'normal');
   pdf.text(`Progress Report: ${data.studentName}`, margin, 28);
   
   pdf.setFontSize(10);
   pdf.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth - margin - 50, 28);
   
   pdf.setTextColor(0, 0, 0);
   yPos = 45;
 
   // ===== SUMMARY STATS =====
   drawSectionHeader('Progress Summary', '📊');
   
   const statBoxWidth = (pageWidth - margin * 2 - 15) / 4;
   const statBoxHeight = 25;
   const stats = [
     { label: 'Topics Learned', value: data.totalTopics.toString(), color: [59, 130, 246] },
     { label: 'Quizzes Taken', value: data.totalQuizzes.toString(), color: [34, 197, 94] },
     { label: 'Avg Quiz Score', value: `${data.avgScore}%`, color: [168, 85, 247] },
     { label: 'Subjects', value: data.subjectCount.toString(), color: [249, 115, 22] },
   ];
 
   stats.forEach((stat, i) => {
     const x = margin + i * (statBoxWidth + 5);
     pdf.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
     pdf.roundedRect(x, yPos, statBoxWidth, statBoxHeight, 3, 3, 'F');
     
     pdf.setTextColor(255, 255, 255);
     pdf.setFontSize(16);
     pdf.setFont('helvetica', 'bold');
     pdf.text(stat.value, x + statBoxWidth / 2, yPos + 12, { align: 'center' });
     
     pdf.setFontSize(8);
     pdf.setFont('helvetica', 'normal');
     pdf.text(stat.label, x + statBoxWidth / 2, yPos + 20, { align: 'center' });
   });
   
   pdf.setTextColor(0, 0, 0);
   yPos += statBoxHeight + 12;
 
   // ===== WEEKLY GOALS =====
   drawSectionHeader('Weekly Goals Progress', '🎯');
   
   const { goalProgress } = data;
   const goals = [
     { 
       label: 'Topics', 
       current: goalProgress.topicsCompleted, 
       target: goalProgress.weeklyTopicGoal 
     },
     { 
       label: 'Quizzes', 
       current: goalProgress.quizzesCompleted, 
       target: goalProgress.weeklyQuizGoal 
     },
     { 
       label: 'Study Days', 
       current: goalProgress.studyDays, 
       target: goalProgress.studyDaysGoal 
     },
   ];
 
   const allGoalsMet = goals.every(g => g.current >= g.target);
   
   if (allGoalsMet) {
     pdf.setFillColor(220, 252, 231);
     pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 2, 2, 'F');
     pdf.setTextColor(22, 101, 52);
     pdf.setFontSize(10);
     pdf.text('✓ All weekly goals met! Great job!', margin + 4, yPos + 5.5);
     pdf.setTextColor(0, 0, 0);
     yPos += 12;
   }
 
   goals.forEach(goal => {
     const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
     drawProgressBar(margin, yPos + 6, pageWidth - margin * 2, percentage, `${goal.label}: ${goal.current}/${goal.target}`);
     yPos += 16;
   });
   
   yPos += 4;
 
   // ===== GOAL HISTORY =====
   if (data.goalHistory.length > 0) {
     drawSectionHeader('Goal Completion Trend', '📈');
     
     pdf.setFontSize(9);
     pdf.setTextColor(100, 100, 100);
     
     // Draw simple table for history
     const colWidth = (pageWidth - margin * 2) / 5;
     const headers = ['Week', 'Topics', 'Quizzes', 'Study Days', 'Overall'];
     
     headers.forEach((header, i) => {
       pdf.setFont('helvetica', 'bold');
       pdf.text(header, margin + i * colWidth + 2, yPos);
     });
     yPos += 6;
     
     pdf.setDrawColor(200, 200, 200);
     pdf.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
     
     pdf.setFont('helvetica', 'normal');
     data.goalHistory.slice(-6).forEach(week => {
       addNewPageIfNeeded(8);
       pdf.text(week.weekLabel, margin + 2, yPos + 4);
       pdf.text(`${week.topicsRate}%`, margin + colWidth + 2, yPos + 4);
       pdf.text(`${week.quizzesRate}%`, margin + colWidth * 2 + 2, yPos + 4);
       pdf.text(`${week.studyDaysRate}%`, margin + colWidth * 3 + 2, yPos + 4);
       pdf.text(`${week.overallRate}%`, margin + colWidth * 4 + 2, yPos + 4);
       yPos += 7;
     });
     yPos += 6;
   }
 
   // ===== WEAK AREAS =====
   drawSectionHeader('Areas Needing Attention', '⚠️');
   
   if (data.weakAreas.length === 0) {
     pdf.setFillColor(220, 252, 231);
     pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, 'F');
     pdf.setTextColor(22, 101, 52);
     pdf.setFontSize(10);
     pdf.text('✓ All subjects looking good! No areas below 70% average.', margin + 4, yPos + 8);
     pdf.setTextColor(0, 0, 0);
     yPos += 18;
   } else {
     data.weakAreas.forEach(area => {
       addNewPageIfNeeded(18);
       const color = area.avgScore < 50 ? [239, 68, 68] : [234, 179, 8];
       pdf.setFillColor(color[0], color[1], color[2], 0.1);
       pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 14, 2, 2, 'F');
       
       pdf.setFontSize(10);
       pdf.setFont('helvetica', 'bold');
       pdf.setTextColor(0, 0, 0);
       pdf.text(area.subject.charAt(0).toUpperCase() + area.subject.slice(1), margin + 4, yPos + 6);
       
       pdf.setFont('helvetica', 'normal');
       pdf.setTextColor(100, 100, 100);
       pdf.text(`${area.avgScore}% avg (${area.attempts} quiz${area.attempts !== 1 ? 'zes' : ''})`, margin + 4, yPos + 11);
       
       // Mini progress bar
       pdf.setFillColor(229, 231, 235);
       pdf.roundedRect(pageWidth - margin - 60, yPos + 4, 50, 5, 1, 1, 'F');
       pdf.setFillColor(color[0], color[1], color[2]);
       pdf.roundedRect(pageWidth - margin - 60, yPos + 4, (50 * area.avgScore) / 100, 5, 1, 1, 'F');
       
       yPos += 18;
     });
   }
 
   // ===== STUDY CONSISTENCY =====
   addNewPageIfNeeded(40);
   drawSectionHeader('Study Consistency (Last 14 Days)', '📅');
   
   const { consistency } = data;
   const consistencyPercent = (consistency.activeDays / consistency.totalDays) * 100;
   
   pdf.setFontSize(11);
   pdf.setFont('helvetica', 'bold');
   pdf.text(`${consistency.activeDays}/${consistency.totalDays} active study days`, margin, yPos + 4);
   
   if (consistency.streak > 0) {
     pdf.setTextColor(249, 115, 22);
     pdf.text(`🔥 ${consistency.streak} day streak!`, margin + 70, yPos + 4);
     pdf.setTextColor(0, 0, 0);
   }
   
   yPos += 10;
   drawProgressBar(margin, yPos + 6, pageWidth - margin * 2, consistencyPercent, 'Consistency Rate');
   yPos += 20;
 
   // ===== RECENT ACTIVITY =====
   addNewPageIfNeeded(50);
   drawSectionHeader('Recent Activity', '🕐');
   
   // Recent Topics
   if (data.recentTopics.length > 0) {
     pdf.setFontSize(10);
     pdf.setFont('helvetica', 'bold');
     pdf.text('Recent Topics Learned:', margin, yPos + 4);
     yPos += 8;
     
     pdf.setFont('helvetica', 'normal');
     pdf.setFontSize(9);
     data.recentTopics.slice(0, 5).forEach(topic => {
       addNewPageIfNeeded(8);
       pdf.setTextColor(0, 0, 0);
       pdf.text(`• ${topic.topic_name}`, margin + 4, yPos + 4);
       pdf.setTextColor(100, 100, 100);
       pdf.text(`(${topic.subject}) - ${format(new Date(topic.completed_at), 'MMM d')}`, margin + 80, yPos + 4);
       yPos += 7;
     });
     yPos += 6;
   }
 
   // Recent Quizzes
   if (data.recentQuizzes.length > 0) {
     addNewPageIfNeeded(30);
     pdf.setFontSize(10);
     pdf.setFont('helvetica', 'bold');
     pdf.setTextColor(0, 0, 0);
     pdf.text('Recent Quiz Results:', margin, yPos + 4);
     yPos += 8;
     
     pdf.setFont('helvetica', 'normal');
     pdf.setFontSize(9);
     data.recentQuizzes.slice(0, 5).forEach(quiz => {
       addNewPageIfNeeded(8);
       const scoreColor = Number(quiz.percentage) >= 70 ? [34, 197, 94] : Number(quiz.percentage) >= 50 ? [234, 179, 8] : [239, 68, 68];
       
       pdf.setTextColor(0, 0, 0);
       pdf.text(`• ${quiz.topic_name}`, margin + 4, yPos + 4);
       
       pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
       pdf.text(`${quiz.score}/${quiz.total_questions} (${Math.round(Number(quiz.percentage))}%)`, margin + 80, yPos + 4);
       
       pdf.setTextColor(100, 100, 100);
       pdf.text(`- ${format(new Date(quiz.attempted_at), 'MMM d')}`, margin + 120, yPos + 4);
       yPos += 7;
     });
   }
 
   // ===== FOOTER =====
   const totalPages = pdf.getNumberOfPages();
   for (let i = 1; i <= totalPages; i++) {
     pdf.setPage(i);
     pdf.setFontSize(8);
     pdf.setTextColor(150, 150, 150);
     pdf.text(
       `Page ${i} of ${totalPages} | Generated by Study Buddy AI`,
       pageWidth / 2,
       pageHeight - 10,
       { align: 'center' }
     );
   }
 
   // Save
   pdf.save(`${data.studentName.replace(/\s+/g, '_')}_Full_Progress_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
 };