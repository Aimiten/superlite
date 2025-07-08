
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, Save, Trash, FilePlus, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'document' | 'contact';
  createdAt: Date;
}

const KnowledgeBase: React.FC = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([
    {
      id: '1',
      title: 'Tärkeät asiakaskontaktit',
      content: 'Lista tärkeimmistä asiakkaista ja yhteyshenkilöistä...',
      type: 'contact',
      createdAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
    },
    {
      id: '2',
      title: 'Hiljaista tietoa tuotantoprosessista',
      content: 'Tuotantoprosessin kriittiset vaiheet, joita ei ole dokumentoitu:...',
      type: 'note',
      createdAt: new Date(Date.now() - 86400000) // 1 day ago
    }
  ]);
  const [newItem, setNewItem] = useState<Omit<KnowledgeItem, 'id' | 'createdAt'>>({
    title: '',
    content: '',
    type: 'note'
  });
  const [isAdding, setIsAdding] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddItem = async () => {
    if (!newItem.title.trim() || !newItem.content.trim()) {
      toast({
        title: "Puutteelliset tiedot",
        description: "Täytä otsikko ja sisältö",
        variant: "destructive"
      });
      return;
    }
    
    const newId = Date.now().toString();
    const itemToAdd = {
      ...newItem,
      id: newId,
      createdAt: new Date()
    };
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would save to Supabase
      // For now, we just add it to local state
      setItems(prev => [itemToAdd, ...prev]);
      
      setNewItem({
        title: '',
        content: '',
        type: 'note'
      });
      
      setIsAdding(false);
      
      toast({
        title: "Tiedot tallennettu",
        description: "Tieto lisätty tietopankkiin",
      });
    } catch (error) {
      toast({
        title: "Tallennus epäonnistui",
        description: "Tiedon lisääminen epäonnistui",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Haluatko varmasti poistaa tämän tiedon?")) return;
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would delete from Supabase
      // For now, we just remove from local state
      setItems(prev => prev.filter(item => item.id !== id));
      
      setSelectedItem(null);
      
      toast({
        title: "Tieto poistettu",
        description: "Tieto poistettu tietopankista",
      });
    } catch (error) {
      toast({
        title: "Poisto epäonnistui",
        description: "Tiedon poistaminen epäonnistui",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'document':
        return <FilePlus className="h-4 w-4 text-blue-500" />;
      case 'contact':
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 h-fit bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle>Tietopankki</CardTitle>
          <CardDescription>
            Tallenna myyntikuntoisuuteen liittyvää tietoa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r-lg">
            <p className="text-sm text-purple-800">
              Premium-ominaisuus: Kerää yhteen kaikki hiljainen tieto, dokumentit ja tärkeät kontaktit 
              yrityksesi myyntiprosessia varten.
            </p>
          </div>
          
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Lisää uusi tieto
          </Button>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-purple-300 ${
                  selectedItem === item.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center mb-2">
                  {getTypeIcon(item.type)}
                  <span className="ml-2 font-medium truncate">{item.title}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatDate(item.createdAt)}
                </p>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center p-4 text-gray-500">
                Ei tallennettuja tietoja
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg">
        {isAdding ? (
          <>
            <CardHeader>
              <CardTitle>Lisää uusi tieto</CardTitle>
              <CardDescription>
                Tallenna hiljaista tietoa, dokumentteja tai tärkeitä kontakteja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Otsikko</Label>
                <Input
                  id="title"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Esim. Tuotantoprosessin kriittiset vaiheet"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tiedon tyyppi</Label>
                <select
                  id="type"
                  value={newItem.type}
                  onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as 'note' | 'document' | 'contact' }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  disabled={isLoading}
                >
                  <option value="note">Muistiinpano</option>
                  <option value="document">Dokumentti</option>
                  <option value="contact">Kontakti</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Sisältö</Label>
                <Textarea
                  id="content"
                  rows={8}
                  value={newItem.content}
                  onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Kirjoita tarkka kuvaus tai tieto tähän..."
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewItem({
                    title: '',
                    content: '',
                    type: 'note'
                  });
                }}
                disabled={isLoading}
              >
                Peruuta
              </Button>
              
              <Button
                onClick={handleAddItem}
                disabled={isLoading || !newItem.title.trim() || !newItem.content.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Tallenna
              </Button>
            </CardFooter>
          </>
        ) : selectedItem ? (
          <>
            {items.filter(item => item.id === selectedItem).map(item => (
              <div key={item.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center mb-1">
                      {getTypeIcon(item.type)}
                      <CardTitle className="ml-2">{item.title}</CardTitle>
                    </div>
                    <CardDescription>
                      Luotu: {formatDate(item.createdAt)}
                    </CardDescription>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={isLoading}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 whitespace-pre-wrap">
                    {item.content}
                  </div>
                </CardContent>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              Valitse tieto tarkasteltavaksi
            </h3>
            <p className="text-gray-500 max-w-md mb-6">
              Valitse tieto vasemmalta listasta tai lisää uusi tieto tietopankkiin.
            </p>
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Lisää uusi tieto
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default KnowledgeBase;
