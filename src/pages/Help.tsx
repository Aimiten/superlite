import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GettingStartedSection from "@/components/help/GettingStartedSection";
import ValuationHelpSection from "@/components/help/ValuationHelpSection";
import AssessmentHelpSection from "@/components/help/AssessmentHelpSection";
import TasksHelpSection from "@/components/help/TasksHelpSection";
import AIAssistantHelpSection from "@/components/help/AIAssistantHelpSection";
import SharingHelpSection from "@/components/help/SharingHelpSection";

const Help = () => {
  return (
    <DashboardLayout 
      pageTitle="Ohje" 
      pageDescription="Kattava opas Arventon käyttöön"
      showBackButton={true}
    >
      <div className="container mx-auto py-4 max-w-6xl">
        <Tabs defaultValue="getting-started">
          <TabsList className="mb-6 grid w-full grid-cols-6">
            <TabsTrigger value="getting-started">Aloittaminen</TabsTrigger>
            <TabsTrigger value="valuations">Arvonmääritys</TabsTrigger>
            <TabsTrigger value="assessment">Myyntikunto</TabsTrigger>
            <TabsTrigger value="tasks">Tehtävät</TabsTrigger>
            <TabsTrigger value="ai-assistant">AI-assistentti</TabsTrigger>
            <TabsTrigger value="sharing">Jakaminen</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started">
            <GettingStartedSection />
          </TabsContent>

          <TabsContent value="valuations">
            <ValuationHelpSection />
          </TabsContent>

          <TabsContent value="assessment">
            <AssessmentHelpSection />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksHelpSection />
          </TabsContent>

          <TabsContent value="ai-assistant">
            <AIAssistantHelpSection />
          </TabsContent>

          <TabsContent value="sharing">
            <SharingHelpSection />
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center border-t pt-6">
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium">Tarvitsetko lisäapua?</span> Jos et löydä vastausta kysymykseesi:
          </p>
          <div className="text-xs text-muted-foreground flex justify-center gap-4 flex-wrap">
            <span>💬 Kysyä AI-assistentilta</span>
            <span>•</span>
            <span>📧 tuki@arvento.fi</span>
            <span>•</span>
            <span>📞 045 123 4567 (arkisin 9-16)</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Help;