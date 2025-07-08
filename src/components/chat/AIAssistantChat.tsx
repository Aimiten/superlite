
import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Mic, 
  Send, 
  StopCircle,
  Volume2, 
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AIAssistantChatProps {
  companyName?: string;
  companyData?: any;
}

const AIAssistantChat = ({ companyName, companyData }: AIAssistantChatProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    pitch: 1,
    rate: 1,
    volume: 1,
  });
  const recognition = useRef<any>(null);
  const synth = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.log("Speech recognition is not supported in this browser.");
      toast({
        title: "Speech recognition not supported",
        description: "Please use a supported browser like Chrome.",
      });
    } else {
      recognition.current = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = "fi-FI";

      recognition.current.onstart = () => {
        console.log("Speech recognition started");
      };

      recognition.current.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setInput(finalTranscript || interimTranscript);
      };

      recognition.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast({
          title: "Speech recognition error",
          description: `Error: ${event.error}`,
        });
      };

      recognition.current.onend = () => {
        console.log("Speech recognition ended");
        setIsRecording(false);
      };
    }

    synth.current = window.speechSynthesis;

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (synth.current) {
        synth.current.cancel();
      }
    };
  }, [toast]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    try {
      const { data, error } = await supabase.functions.invoke('openai-function', {
        body: {
          company_name: companyName,
          company_data: companyData,
          user_message: input
        }
      });

      if (error) {
        console.error("Function invocation error:", error);
        toast({
          title: "Error processing message",
          description: error.message || "Failed to get response from AI.",
          variant: "destructive",
        });
        return;
      }

      if (data && data.response) {
        const aiMessage = { text: data.response, sender: "ai" };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
        speak(data.response);
      } else {
        toast({
          title: "Empty response",
          description: "AI returned an empty response.",
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Unexpected error",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const startRecording = () => {
    if (recognition.current) {
      setIsRecording(true);
      recognition.current.start();
    }
  };

  const stopRecording = () => {
    if (recognition.current) {
      recognition.current.stop();
      setIsRecording(false);
    }
  };

  const speak = (text: string) => {
    if (!synth.current) return;

    // Cancel any ongoing speech
    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fi-FI";
    utterance.pitch = voiceSettings.pitch;
    utterance.rate = voiceSettings.rate;
    utterance.volume = voiceSettings.volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      toast({
        title: "Speech synthesis error",
        description: `Error: ${event.error}`,
        variant: "destructive",
      });
      setIsSpeaking(false);
    };

    synth.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synth.current && isSpeaking) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleMute = () => {
    setVoiceSettings((prev) => ({ ...prev, volume: prev.volume > 0 ? 0 : 1 }));
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="mr-2 h-4 w-4" />
          Myyntikuntoon AI
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"
                }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-md ${message.sender === "user"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                  }`}
              >
                {message.text}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {message.sender === "user" ? "Sinä" : "Myyntikuntoon AI"}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <div className="w-full flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            disabled={isSpeaking}
          >
            {voiceSettings.volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Textarea
            placeholder="Kirjoita viesti..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-grow resize-none"
          />
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSpeaking}
            >
              {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button onClick={sendMessage} disabled={isSpeaking}>
              <Send className="h-4 w-4 mr-2" /> Lähetä
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default AIAssistantChat;
