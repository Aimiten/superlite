
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Download, Filter, Scan, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { generatedTasks } from "@/data/generatedTasks";

const Tasks = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const handleTaskComplete = (taskId: string) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter(id => id !== taskId));
    } else {
      setCompletedTasks([...completedTasks, taskId]);
      
      // Show toast for completed task
      toast({
        title: "Tehtävä suoritettu!",
        description: "Yrityksesi myyntikuntoisuus on parantunut."
      });
    }
  };

  const handleDownload = () => {
    toast({
      title: "Tehtävälista ladattu",
      description: "Tehtävälista on ladattu PDF-muodossa."
    });
  };

  // Filter tasks by category or urgency
  const filteredTasks = filter 
    ? generatedTasks.filter(task => filter === task.category || filter === task.urgency)
    : generatedTasks;

  // Count completed tasks per category
  const categoryProgress = {
    financial: completedTasks.filter(id => 
      generatedTasks.find(task => task.id === id && task.category === "financial")).length,
    operations: completedTasks.filter(id => 
      generatedTasks.find(task => task.id === id && task.category === "operations")).length,
    documentation: completedTasks.filter(id => 
      generatedTasks.find(task => task.id === id && task.category === "documentation")).length,
    customers: completedTasks.filter(id => 
      generatedTasks.find(task => task.id === id && task.category === "customers")).length,
  };

  const totalCategoryTasks = {
    financial: generatedTasks.filter(task => task.category === "financial").length,
    operations: generatedTasks.filter(task => task.category === "operations").length,
    documentation: generatedTasks.filter(task => task.category === "documentation").length,
    customers: generatedTasks.filter(task => task.category === "customers").length,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Custom category colors for 3D icons
  const categoryColors = {
    financial: "bg-blue-400",
    operations: "bg-purple-400",
    documentation: "bg-pink-400",
    customers: "bg-green-400"
  };

  return (
    <div className="min-h-screen gradient-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center text-slate-700 hover:text-slate-900 mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Takaisin etusivulle
        </Link>

        <div className="flex flex-col lg:flex-row items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Tehtävälistan generaattori</h1>
            <p className="mt-2 text-slate-600">
              Räätälöity tehtävälista yrityksesi myyntikuntoon laittamiseksi
            </p>
          </div>
          <Button variant="outline" onClick={handleDownload} className="flex items-center rounded-full">
            <Download className="mr-2 h-4 w-4" />
            Lataa PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <Card className="card-3d">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Tehtävien edistyminen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Talous</span>
                    <span className="font-medium">{categoryProgress.financial}/{totalCategoryTasks.financial}</span>
                  </div>
                  <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${(categoryProgress.financial / totalCategoryTasks.financial) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Toiminta</span>
                    <span className="font-medium">{categoryProgress.operations}/{totalCategoryTasks.operations}</span>
                  </div>
                  <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${(categoryProgress.operations / totalCategoryTasks.operations) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dokumentaatio</span>
                    <span className="font-medium">{categoryProgress.documentation}/{totalCategoryTasks.documentation}</span>
                  </div>
                  <div className="h-3 bg-pink-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-400 rounded-full transition-all duration-500"
                      style={{ width: `${(categoryProgress.documentation / totalCategoryTasks.documentation) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Asiakkaat</span>
                    <span className="font-medium">{categoryProgress.customers}/{totalCategoryTasks.customers}</span>
                  </div>
                  <div className="h-3 bg-green-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-400 rounded-full transition-all duration-500"
                      style={{ width: `${(categoryProgress.customers / totalCategoryTasks.customers) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kokonaisedistyminen</span>
                    <span className="font-medium">{completedTasks.length}/{generatedTasks.length}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                      style={{ width: `${(completedTasks.length / generatedTasks.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div>
                  <p className="font-medium mb-3">Suodata tehtäviä</p>
                  <div className="space-y-2">
                    <Button 
                      variant={filter === "high" ? "default" : "outline"} 
                      size="sm" 
                      className="mr-2 mb-2 rounded-full"
                      onClick={() => setFilter(filter === "high" ? null : "high")}
                    >
                      Kiireelliset
                    </Button>
                    <Button 
                      variant={filter === "financial" ? "default" : "outline"} 
                      size="sm" 
                      className="mr-2 mb-2 rounded-full"
                      onClick={() => setFilter(filter === "financial" ? null : "financial")}
                    >
                      Talous
                    </Button>
                    <Button 
                      variant={filter === "operations" ? "default" : "outline"} 
                      size="sm" 
                      className="mr-2 mb-2 rounded-full"
                      onClick={() => setFilter(filter === "operations" ? null : "operations")}
                    >
                      Toiminta
                    </Button>
                    <Button 
                      variant={filter === "documentation" ? "default" : "outline"} 
                      size="sm" 
                      className="mr-2 mb-2 rounded-full"
                      onClick={() => setFilter(filter === "documentation" ? null : "documentation")}
                    >
                      Dokumentaatio
                    </Button>
                    <Button 
                      variant={filter === "customers" ? "default" : "outline"} 
                      size="sm" 
                      className="mr-2 rounded-full"
                      onClick={() => setFilter(filter === "customers" ? null : "customers")}
                    >
                      Asiakkaat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-9">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6 rounded-full bg-white/60 backdrop-blur-sm p-1">
                <TabsTrigger value="all" className="rounded-full">Kaikki tehtävät</TabsTrigger>
                <TabsTrigger value="completed" className="rounded-full">Valmiit ({completedTasks.length})</TabsTrigger>
                <TabsTrigger value="pending" className="rounded-full">Kesken ({generatedTasks.length - completedTasks.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {filteredTasks.map(task => (
                    <motion.div key={task.id} variants={itemVariants}>
                      <div className={`task-item ${
                        completedTasks.includes(task.id) ? 'opacity-70' : ''
                      }`}>
                        <div className="flex items-start gap-4">
                          <div className={`${categoryColors[task.category as keyof typeof categoryColors]} rounded-full p-3 text-white`}>
                            {task.category === 'financial' && <Scan className="h-6 w-6" />}
                            {task.category === 'operations' && <Filter className="h-6 w-6" />}
                            {task.category === 'documentation' && <Calendar className="h-6 w-6" />}
                            {task.category === 'customers' && <Tag className="h-6 w-6" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge 
                                variant="outline" 
                                className={`
                                  rounded-full px-3 py-1
                                  ${task.category === 'financial' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                  ${task.category === 'operations' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                  ${task.category === 'documentation' ? 'bg-pink-50 text-pink-700 border-pink-200' : ''}
                                  ${task.category === 'customers' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                `}
                              >
                                {task.category === 'financial' && 'Talous'}
                                {task.category === 'operations' && 'Toiminta'}
                                {task.category === 'documentation' && 'Dokumentaatio'}
                                {task.category === 'customers' && 'Asiakkaat'}
                              </Badge>
                              
                              <Badge 
                                variant="outline" 
                                className={`
                                  rounded-full px-3 py-1
                                  ${task.urgency === 'high' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                  ${task.urgency === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                  ${task.urgency === 'low' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                                `}
                              >
                                {task.urgency === 'high' && 'Kiireellinen'}
                                {task.urgency === 'medium' && 'Keskitärkeä'}
                                {task.urgency === 'low' && 'Vähemmän kiireellinen'}
                              </Badge>
                            </div>
                            
                            <h3 
                              className={`font-medium text-lg ${completedTasks.includes(task.id) ? 'line-through text-gray-500' : 'text-slate-800'}`}
                            >
                              {task.title}
                            </h3>
                            
                            <p className={`mt-1 ${completedTasks.includes(task.id) ? 'text-gray-400' : 'text-slate-600'}`}>
                              {task.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          {completedTasks.includes(task.id) ? (
                            <div className="check-circle cursor-pointer" onClick={() => handleTaskComplete(task.id)}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          ) : (
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer" 
                              onClick={() => handleTaskComplete(task.id)}
                            ></div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="completed">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {generatedTasks
                    .filter(task => completedTasks.includes(task.id))
                    .filter(task => !filter || filter === task.category || filter === task.urgency)
                    .map(task => (
                      <motion.div key={task.id} variants={itemVariants}>
                        <div className="task-item opacity-70">
                          <div className="flex items-start gap-4">
                            <div className={`${categoryColors[task.category as keyof typeof categoryColors]} rounded-full p-3 text-white opacity-70`}>
                              {task.category === 'financial' && <Scan className="h-6 w-6" />}
                              {task.category === 'operations' && <Filter className="h-6 w-6" />}
                              {task.category === 'documentation' && <Calendar className="h-6 w-6" />}
                              {task.category === 'customers' && <Tag className="h-6 w-6" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={`
                                    rounded-full px-3 py-1
                                    ${task.category === 'financial' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                    ${task.category === 'operations' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                    ${task.category === 'documentation' ? 'bg-pink-50 text-pink-700 border-pink-200' : ''}
                                    ${task.category === 'customers' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                  `}
                                >
                                  {task.category === 'financial' && 'Talous'}
                                  {task.category === 'operations' && 'Toiminta'}
                                  {task.category === 'documentation' && 'Dokumentaatio'}
                                  {task.category === 'customers' && 'Asiakkaat'}
                                </Badge>
                                
                                <Badge 
                                  variant="outline" 
                                  className={`
                                    rounded-full px-3 py-1
                                    ${task.urgency === 'high' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                    ${task.urgency === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                    ${task.urgency === 'low' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                                  `}
                                >
                                  {task.urgency === 'high' && 'Kiireellinen'}
                                  {task.urgency === 'medium' && 'Keskitärkeä'}
                                  {task.urgency === 'low' && 'Vähemmän kiireellinen'}
                                </Badge>
                              </div>
                              
                              <h3 className="font-medium text-lg line-through text-gray-500">
                                {task.title}
                              </h3>
                              
                              <p className="mt-1 text-gray-400">
                                {task.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <div className="check-circle cursor-pointer" onClick={() => handleTaskComplete(task.id)}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="pending">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {generatedTasks
                    .filter(task => !completedTasks.includes(task.id))
                    .filter(task => !filter || filter === task.category || filter === task.urgency)
                    .map(task => (
                      <motion.div key={task.id} variants={itemVariants}>
                        <div className="task-item">
                          <div className="flex items-start gap-4">
                            <div className={`${categoryColors[task.category as keyof typeof categoryColors]} rounded-full p-3 text-white`}>
                              {task.category === 'financial' && <Scan className="h-6 w-6" />}
                              {task.category === 'operations' && <Filter className="h-6 w-6" />}
                              {task.category === 'documentation' && <Calendar className="h-6 w-6" />}
                              {task.category === 'customers' && <Tag className="h-6 w-6" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={`
                                    rounded-full px-3 py-1
                                    ${task.category === 'financial' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                    ${task.category === 'operations' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                    ${task.category === 'documentation' ? 'bg-pink-50 text-pink-700 border-pink-200' : ''}
                                    ${task.category === 'customers' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                  `}
                                >
                                  {task.category === 'financial' && 'Talous'}
                                  {task.category === 'operations' && 'Toiminta'}
                                  {task.category === 'documentation' && 'Dokumentaatio'}
                                  {task.category === 'customers' && 'Asiakkaat'}
                                </Badge>
                                
                                <Badge 
                                  variant="outline" 
                                  className={`
                                    rounded-full px-3 py-1
                                    ${task.urgency === 'high' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                    ${task.urgency === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                    ${task.urgency === 'low' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                                  `}
                                >
                                  {task.urgency === 'high' && 'Kiireellinen'}
                                  {task.urgency === 'medium' && 'Keskitärkeä'}
                                  {task.urgency === 'low' && 'Vähemmän kiireellinen'}
                                </Badge>
                              </div>
                              
                              <h3 className="font-medium text-lg text-slate-800">
                                {task.title}
                              </h3>
                              
                              <p className="mt-1 text-slate-600">
                                {task.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer" 
                              onClick={() => handleTaskComplete(task.id)}
                            ></div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
