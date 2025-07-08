
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Task, TaskResponse } from "@/components/assessment/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyTasks } from "@/hooks/use-company-tasks";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Upload, RefreshCw } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

const TaskDetail = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fetchTask, fetchTaskResponse, saveTaskResponse, updateTaskStatus } = useCompanyTasks();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [textResponse, setTextResponse] = useState("");
  const [taskResponse, setTaskResponse] = useState<TaskResponse>({
    task_id: taskId || "",
    text_response: "",
    file_path: "",
    file_name: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Fetch task details and existing response
  useEffect(() => {
    const fetchData = async () => {
      if (!taskId) return;
      
      setLoading(true);
      try {
        // Fetch task details
        const taskData = await fetchTask(taskId);
        setTask(taskData);
        
        // Fetch existing response if any
        const responseData = await fetchTaskResponse(taskId);
        
        if (responseData) {
          setTaskResponse(responseData);
          setTextResponse(responseData.text_response || "");
        }
      } catch (error) {
        console.error("Error fetching task details:", error);
        toast({
          title: "Virhe",
          description: "Tehtävän tietojen hakeminen epäonnistui",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [taskId, fetchTask, fetchTaskResponse, toast]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleFileUpload = async () => {
    if (!selectedFile || !task) return;
    
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${task.company_id}/${task.id}/${fileName}`;
      
      // Upload file to task-files bucket
      const { error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(filePath, selectedFile);
        
      if (uploadError) throw uploadError;
      
      // Update task response with file info
      const updatedTaskResponse = {
        ...taskResponse,
        file_path: filePath,
        file_name: selectedFile.name
      };
      
      // Save to database
      const responseData = await saveTaskResponse(updatedTaskResponse);
      
      setTaskResponse(responseData);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      toast({
        title: "Tiedosto ladattu",
        description: "Tiedosto tallennettiin onnistuneesti",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Virhe",
        description: "Tiedoston lataaminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleSaveResponse = async () => {
    if (!task) return;
    
    setSaving(true);
    try {
      const updatedResponse = await saveTaskResponse({
        ...taskResponse,
        text_response: textResponse
      });
      
      setTaskResponse(updatedResponse);
      
      toast({
        title: "Vastaus tallennettu",
        description: "Vastauksesi on tallennettu onnistuneesti",
      });
    } catch (error) {
      console.error("Error saving response:", error);
      toast({
        title: "Virhe",
        description: "Vastauksen tallentaminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleMarkComplete = async () => {
    if (!task) return;
    
    try {
      const updatedTask = await updateTaskStatus(task.id, !task.is_completed);
      
      setTask(updatedTask);
      
      toast({
        title: task.is_completed ? "Tehtävä merkitty keskeneräiseksi" : "Tehtävä merkitty valmiiksi",
        description: task.title,
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Virhe",
        description: "Tehtävän tilan päivittäminen epäonnistui",
        variant: "destructive",
      });
    }
  };
  
  const getCategoryText = (category: string) => {
    switch (category) {
      case "financial": return "Talous";
      case "operations": return "Toiminta";
      case "documentation": return "Dokumentaatio";
      case "customers": return "Asiakkaat";
      default: return category;
    }
  };
  
  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case "high": return "Kiireellinen";
      case "medium": return "Keskitärkeä";
      case "low": return "Vähemmän kiireellinen";
      default: return urgency;
    }
  };
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-800 hover:bg-red-200";
      case "medium": return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "low": return "bg-green-100 text-green-800 hover:bg-green-200";
      default: return "bg-slate-100 text-slate-800 hover:bg-slate-200";
    }
  };
  
  return (
    <DashboardLayout
      pageTitle={task ? task.title : "Tehtävän tiedot"}
      pageDescription="Tehtävän tiedot ja vastaus"
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
        </div>
      ) : task ? (
        <div className="space-y-6 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Takaisin tehtävälistaan
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{task.title}</CardTitle>
                  <CardDescription>
                    Luotu {new Date(task.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {getCategoryText(task.category)}
                  </Badge>
                  <Badge className={getUrgencyColor(task.urgency)}>
                    {getUrgencyText(task.urgency)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-2">Tehtävän kuvaus</h3>
                <p className="text-muted-foreground">{task.description}</p>
              </div>
              
              <div>
                <h3 className="text-base font-medium mb-2">Odotettu lopputulos</h3>
                <p className="text-muted-foreground">{task.expected_outcome}</p>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-base font-medium mb-4">Tehtävän vastaus</h3>
                
                {(task.response_type === "text" || task.response_type === "both") && (
                  <div className="mb-4">
                    <Label htmlFor="response">Tekstivastaus</Label>
                    <Textarea
                      id="response"
                      placeholder="Kirjoita vastauksesi tähän..."
                      className="min-h-32 mt-2"
                      value={textResponse}
                      onChange={(e) => setTextResponse(e.target.value)}
                    />
                    <Button 
                      onClick={handleSaveResponse} 
                      className="mt-2"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Tallennetaan...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Tallenna vastaus
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {(task.response_type === "file" || task.response_type === "both") && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file">Tiedosto</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          id="file"
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        <Button 
                          onClick={handleFileUpload} 
                          disabled={!selectedFile || uploading}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Ladataan...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Lataa
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {taskResponse.file_name && (
                      <div className="p-4 border rounded-md bg-muted/30">
                        <h4 className="text-sm font-medium">Ladattu tiedosto</h4>
                        <p className="text-sm text-muted-foreground mb-2">{taskResponse.file_name}</p>
                        <Button variant="outline" size="sm">
                          <a 
                            href={`${supabase.storage.from('task-files').getPublicUrl(taskResponse.file_path || "").data.publicUrl}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Lataa tiedosto
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Takaisin
              </Button>
              
              <div className="flex gap-2">
                <Link to="/ai-assistant">
                  <Button variant="secondary">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Kysy AI-avustajalta
                  </Button>
                </Link>
                
                <Button 
                  onClick={handleMarkComplete}
                  variant={task.is_completed ? "outline" : "default"}
                >
                  {task.is_completed ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Merkitse keskeneräiseksi
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Merkitse valmiiksi
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Tehtävää ei löydy</h2>
          <p className="text-muted-foreground mb-6">Pyydettyä tehtävää ei löytynyt.</p>
          <Button onClick={() => navigate('/tasks')}>
            Palaa tehtävälistaan
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TaskDetail;
