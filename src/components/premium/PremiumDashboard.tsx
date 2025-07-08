
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, FileSpreadsheet, MessagesSquare, Database } from "lucide-react";
import MasterReportGenerator from "@/components/reports/MasterReportGenerator";
import AIAssistantChat from "@/components/chat/AIAssistantChat";
import KnowledgeBase from "@/components/knowledge/KnowledgeBase";
import { ShareReportDialog } from "@/components/reports/ShareReportDialog";

interface PremiumDashboardProps {
  companyName?: string;
  analysisResults?: any;
  companyData?: any;
}

const PremiumDashboard: React.FC<PremiumDashboardProps> = ({
  companyName = "Yrityksesi",
  analysisResults,
  companyData
}) => {
  const [activeTab, setActiveTab] = useState("reports");
  
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 p-6 rounded-3xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Premium Työkalut
        </h1>
        <p className="text-gray-600 mb-6">
          Hyödynnä premium-ominaisuuksia yrityksesi myyntikuntoisuuden parantamiseksi
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              title: "Master-raportit", 
              description: "Luo kattavia PDF-raportteja",
              icon: <FileSpreadsheet className="h-6 w-6 text-purple-500" />
            },
            { 
              title: "Tekoälyassistentti", 
              description: "Keskustele myyntikuntoisuudesta AI:n kanssa",
              icon: <MessagesSquare className="h-6 w-6 text-blue-500" />
            },
            { 
              title: "Tietopankki", 
              description: "Tallenna ja organisoi myyntiin liittyvää tietoa",
              icon: <Database className="h-6 w-6 text-green-500" />
            },
            { 
              title: "Premium-tuki", 
              description: "Saat kattavan tuen myyntiprosessiin",
              icon: <CheckCircle2 className="h-6 w-6 text-amber-500" />
            }
          ].map((feature, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-sm border-none">
              <CardContent className="p-6">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Tabs defaultValue="reports" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-8">
          <TabsTrigger value="reports" className="text-base py-3">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Master-raportit
          </TabsTrigger>
          <TabsTrigger value="assistant" className="text-base py-3">
            <MessagesSquare className="h-5 w-5 mr-2" />
            AI-assistentti
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="text-base py-3">
            <Database className="h-5 w-5 mr-2" />
            Tietopankki
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="mt-0">
          <MasterReportGenerator 
            companyName={companyName}
            analysisResults={analysisResults}
            companyData={companyData}
          />
        </TabsContent>
        
        <TabsContent value="assistant" className="mt-0">
          <AIAssistantChat
            companyName={companyName}
            companyData={companyData}
          />
        </TabsContent>
        
        <TabsContent value="knowledge" className="mt-0">
          <KnowledgeBase />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PremiumDashboard;
