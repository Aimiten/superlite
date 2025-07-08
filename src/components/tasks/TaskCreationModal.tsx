// src/components/tasks/TaskCreationModal.tsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PlusCircle } from "lucide-react";
import { Task } from "./TaskTypes";

interface TaskCreationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: (task: Task) => void;
  companyId: string;
  createTask: (task: Partial<Task>) => Promise<Task | null>;
}

type FormValues = {
  title: string;
  description: string;
  category: string;
  type: string;
  priority: string;
  impact: string;
  estimated_time: string;
  expected_outcome: string;
  options: string; // Tämä on string, jonka arvo pilkotaan monivalinnoiksi
};

export const TaskCreationModal: React.FC<TaskCreationModalProps> = ({
  isOpen,
  onOpenChange,
  onTaskCreated,
  companyId,
  createTask,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptionField, setShowOptionField] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      type: "",
      priority: "medium",
      impact: "medium",
      estimated_time: "",
      expected_outcome: "",
      options: "",
    },
  });

  // Resetoi lomake kun dialogi suljetaan
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  // Näytä options-kenttä vain, jos tyyppi on multiple_choice
  const watchType = form.watch("type");

  useEffect(() => {
    setShowOptionField(watchType === "multiple_choice");
  }, [watchType]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Muotoile data ennen lähetystä
      const taskData: Partial<Task> = {
        title: values.title,
        description: values.description || null,
        category: values.category as any,
        type: values.type as any,
        priority: values.priority as any,
        impact: values.impact as any,
        estimated_time: values.estimated_time || null,
        expected_outcome: values.expected_outcome || null,
        company_id: companyId,
        completion_status: "not_started",
      };

      // Lisää options vain multiple_choice-tyyppisille tehtäville
      if (values.type === "multiple_choice" && values.options.trim()) {
        taskData.options = values.options.split(',').map(option => option.trim());
      }

      const createdTask = await createTask(taskData);

      if (createdTask) {
        onTaskCreated(createdTask);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Luo uusi tehtävä</DialogTitle>
          <DialogDescription>
            Täytä tiedot luodaksesi uuden tehtävän.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Otsikko */}
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Otsikko on pakollinen" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Otsikko</FormLabel>
                  <FormControl>
                    <Input placeholder="Tehtävän otsikko" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kuvaus */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kuvaus</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tehtävän kuvaus"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kategoria */}
            <FormField
              control={form.control}
              name="category"
              rules={{ required: "Kategoria on pakollinen" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategoria</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Valitse kategoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="financial">Talous</SelectItem>
                      <SelectItem value="legal">Sopimukset</SelectItem>
                      <SelectItem value="operations">Toiminta</SelectItem>
                      <SelectItem value="documentation">Dokumentaatio</SelectItem>
                      <SelectItem value="customers">Asiakkaat</SelectItem>
                      <SelectItem value="personnel">Henkilöstö</SelectItem>
                      <SelectItem value="strategy">Strategia</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tehtävätyyppi */}
            <FormField
              control={form.control}
              name="type"
              rules={{ required: "Tehtävätyyppi on pakollinen" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tehtävätyyppi</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Valitse tehtävätyyppi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="checkbox">Valintaruutu</SelectItem>
                      <SelectItem value="multiple_choice">Monivalinta</SelectItem>
                      <SelectItem value="text_input">Tekstikenttä</SelectItem>
                      <SelectItem value="document_upload">Tiedoston lataus</SelectItem>
                      <SelectItem value="explanation">Selitys</SelectItem>
                      <SelectItem value="contact_info">Yhteystiedot</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monivalintavaihtoehdot (näytetään vain jos tehtävätyyppi on multiple_choice) */}
            {showOptionField && (
              <FormField
                control={form.control}
                name="options"
                rules={{ required: "Vaihtoehdot ovat pakollisia monivalintatehtävälle" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monivalintavaihtoehdot</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Vaihtoehdot pilkulla erotettuna: Vaihtoehto 1, Vaihtoehto 2, Vaihtoehto 3"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Anna monivalintavaihtoehdot pilkulla erotettuna.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Prioriteetti */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioriteetti</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Valitse prioriteetti" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">Korkea</SelectItem>
                      <SelectItem value="medium">Keskitaso</SelectItem>
                      <SelectItem value="low">Matala</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vaikutus */}
            <FormField
              control={form.control}
              name="impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vaikutus myyntikuntoon</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Valitse vaikutus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">Suuri</SelectItem>
                      <SelectItem value="medium">Keskitaso</SelectItem>
                      <SelectItem value="low">Pieni</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Arvioitu aika */}
            <FormField
              control={form.control}
              name="estimated_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arvioitu aika</FormLabel>
                  <FormControl>
                    <Input placeholder="esim. 2 tuntia, 1 päivä" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Odotettu lopputulos */}
            <FormField
              control={form.control}
              name="expected_outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odotettu lopputulos</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Mikä on tehtävän odotettu lopputulos?"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tallennetaan...
                  </>
                ) : (
                  "Tallenna tehtävä"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Wrapper-komponentti, joka sisältää trigger-painikkeen
export const TaskCreationButton: React.FC<{
  onTaskCreated: (task: Task) => void;
  companyId: string;
  createTask: (task: Partial<Task>) => Promise<Task | null>;
}> = ({ onTaskCreated, companyId, createTask }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="default"
        size="sm"
        className="gap-1.5"
      >
        <PlusCircle className="h-4 w-4" />
        Lisää tehtävä
      </Button>

      <TaskCreationModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onTaskCreated={onTaskCreated}
        companyId={companyId}
        createTask={createTask}
      />
    </>
  );
};

export default TaskCreationModal;