// src/components/sharing/SharedTasksList.tsx
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, FileText, ClipboardList, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import ReactMarkdown from 'react-markdown';

interface TaskResponse {
  id: string;
  task_id: string;
  text_response?: string;
  file_path?: string;
  file_name?: string;
  created_at: string;
  value?: any;
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  completion_status: string;
  created_at: string;
  completed_at?: string;
  value?: any;
  task_responses?: TaskResponse[];
}

interface SharedTasksListProps {
  tasks: Task[];
  companyName: string;
}

const SharedTasksList: React.FC<SharedTasksListProps> = ({ tasks, companyName }) => {
  // Kategorioiden suomennokset
  const getCategoryName = (category: string) => {
    const categories = {
      financial: "Talous",
      legal: "Juridinen",
      operations: "Toiminta",
      documentation: "Dokumentaatio", 
      customers: "Asiakkaat",
      personnel: "Henkilöstö",
      strategy: "Strategia"
    };
    return categories[category] || category;
  };

  // Prioriteetin badge
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high':
        return <Badge variant="destructive">Korkea</Badge>;
      case 'medium':
        return <Badge variant="default">Normaali</Badge>;
      case 'low':
        return <Badge variant="secondary">Matala</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Value-objektin näyttäminen luettavassa muodossa
  const renderTaskValue = (value: any) => {
    if (!value) return <p className="text-slate-500 italic">Ei vastausta</p>;

    // Jos value on tyhjä objekti
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return <p className="text-slate-500 italic">Ei vastausta</p>;
    }

    // Jos value on teksti
    if (typeof value === 'string') {
      // Tarkistetaan onko kyseessä markdown-merkintä
      if (value.startsWith('```')) {
        // Poista ensimmäinen ```-rivi
        let content = value.replace(/^```.*?\n/, '');
        // Poista viimeinen ```
        content = content.replace(/```\s*$/, '');

        return (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        );
      }

      // Käytä ReactMarkdown-komponenttia kaikelle tekstille
      return (
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      );
    }

    // Jos value on boolean
    if (typeof value === 'boolean') {
      return value ? 
        <div className="flex items-center"><CheckCircle className="text-green-600 mr-2 h-4 w-4" /> Kyllä</div> : 
        <div className="flex items-center"><AlertCircle className="text-red-600 mr-2 h-4 w-4" /> Ei</div>;
    }

    // Suodata pois tekniset kentät
    const filteredValue = { ...value };
    ['generatedAt', 'copiedAt', 'generatedByAI', 'copiedFromAI'].forEach(key => {
      delete filteredValue[key];
    });

    // Jos on text-kenttä, käsitellään se erikseen
    if (filteredValue.text) {
      const textContent = filteredValue.text;

      // Tarkista onko text-kenttä markdown-merkintä
      if (typeof textContent === 'string' && textContent.startsWith('```')) {
        // Poista ensimmäinen ```-rivi
        let content = textContent.replace(/^```.*?\n/, '');
        // Poista viimeinen ```
        content = content.replace(/```\s*$/, '');

        return (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        );
      }

      // Käytä ReactMarkdown-komponenttia kaikelle tekstille
      return (
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown>{textContent}</ReactMarkdown>
        </div>
      );
    }

    // Jos suodatuksen jälkeen jäi vain yksi kenttä, näytä se suoraan
    const keys = Object.keys(filteredValue);
    if (keys.length === 1) {
      const content = filteredValue[keys[0]];
      if (typeof content === 'string') {
        return (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        );
      }
      return <p className="whitespace-pre-line">{String(content)}</p>;
    } else if (keys.length === 0) {
      return <p className="text-slate-500 italic">Ei vastausta</p>;
    }

    // Muuten näytä siistinä ruudukkona avain-arvo-parit
    return (
      <div className="grid grid-cols-1 gap-1 bg-slate-50 p-3 rounded-md">
        {Object.entries(filteredValue).map(([key, val]) => (
          <div key={key} className="grid grid-cols-3 gap-2">
            <span className="font-medium text-sm col-span-1">{key}:</span>
            <span className="col-span-2 text-sm">
              {typeof val === 'string' ? (
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown>{val}</ReactMarkdown>
                </div>
              ) : (
                JSON.stringify(val)
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Jos ei tehtäviä
  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tehtävät</CardTitle>
          <CardDescription>Myyntikuntoon liittyvät tehtävät yritykselle {companyName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ei jaettuja tehtäviä</h3>
            <p className="text-slate-500">Tähän jakoon ei ole liitetty tehtäviä.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Järjestetään tehtävät kategorian ja prioriteetin mukaan
  const sortedTasks = [...tasks].sort((a, b) => {
    // Ensin kategorian mukaan
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }

    // Sitten prioriteetin mukaan (high → medium → low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Ryhmitellään tehtävät kategorioittain
  const tasksByCategory: Record<string, Task[]> = {};
  sortedTasks.forEach(task => {
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = [];
    }
    tasksByCategory[task.category].push(task);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tehtävät</CardTitle>
        <CardDescription>Myyntikuntoon liittyvät tehtävät yritykselle {companyName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Yhteenveto */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h3 className="font-medium text-blue-800">Tehtävien yhteenveto</h3>
                <p className="text-blue-700 text-sm">
                  {tasks.length} tehtävää, kaikki valmiita
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.keys(tasksByCategory).map(category => (
                  <Badge key={category} variant="outline" className="bg-white">
                    {getCategoryName(category)}: {tasksByCategory[category].length}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Tehtävälistaus kategorioittain */}
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-medium text-lg">{getCategoryName(category)}</h3>

              <div className="space-y-4">
                {categoryTasks.map(task => (
                  <div key={task.id} className="border rounded-lg overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium">{task.title}</h4>
                        {getPriorityBadge(task.priority)}
                      </div>

                      {task.completed_at && (
                        <div className="flex items-center text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          Valmis: {format(new Date(task.completed_at), 'dd.MM.yyyy', { locale: fi })}
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {/* Tehtävän kuvaus */}
                      <div className="mb-4">
                        <p className="text-sm text-slate-600 whitespace-pre-line">{task.description}</p>
                      </div>

                      <Separator className="my-3" />

                      {/* Tehtävän vastaus */}
                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center">
                          <FileText className="h-4 w-4 mr-1.5 text-indigo-600" />
                          Vastaus
                        </h5>

                        <div className="pl-6">
                          {/* Value-kentän näyttäminen */}
                          {renderTaskValue(task.value)}

                          {/* Liitetiedosto jos on */}
                          {task.task_responses && task.task_responses.some(r => r.file_path) && (
                            <div className="mt-2 text-sm">
                              <p className="font-medium">Liitetiedosto:</p>
                              {task.task_responses.filter(r => r.file_path).map(response => (
                                <div key={response.id} className="flex items-center mt-1">
                                  <FileText className="h-4 w-4 mr-1.5 text-slate-500" />
                                  <span>{response.file_name || "Tiedosto"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SharedTasksList;